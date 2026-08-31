import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { periodRange } from '../lib/financialPeriod';
import type { StaffMember, StaffWorkLog } from '../types';
import { staffAttendancePayload } from '../lib/attendance';

const staffFields = 'id,name,role,phone,contract_type,daily_rate,commission_rate,commission_type,fixed_commission_value,status,avatar_url,specialties,pix_key,notes,work_days,work_schedule_from';
const logFields = 'id,staff_id,work_date,status,daily_rate_charged,notes,arrival_time,departure_time,departure_next_day';
const mapStaff = (s: any): StaffMember => ({
  id: s.id, name: s.name, role: s.role, phone: s.phone || '', contractType: s.contract_type,
  dailyRate: Number(s.daily_rate || 0), commissionRate: Number(s.commission_rate || 0),
  commissionType: s.commission_type, fixedCommissionValue: Number(s.fixed_commission_value || 0),
  status: s.status, avatarUrl: s.avatar_url || '', specialties: s.specialties || [],
  workDays: s.work_days ?? undefined, workScheduleFrom: s.work_schedule_from ?? undefined,
  pixKey: s.pix_key || '', notes: s.notes || '',
});
const mapLog = (l: any, staff: StaffMember[]): StaffWorkLog => ({
  id: l.id, staffId: l.staff_id, staffName: staff.find(s => s.id === l.staff_id)?.name || 'Funcionário',
  arrivalTime: l.arrival_time?.slice(0, 5), departureTime: l.departure_time?.slice(0, 5), departureNextDay: !!l.departure_next_day,
  date: l.work_date, status: l.status, dailyRateCharged: Number(l.daily_rate_charged || 0), notes: l.notes || '',
});

export function useTeam(companyId: string, role: string | null) {
  const [data, setData] = useState<{ companyId: string; staff: StaffMember[]; logs: StaffWorkLog[] }>({ companyId: '', staff: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const activeCompany = useRef(companyId);
  activeCompany.current = companyId;
  const pending = useRef(false);
  const canManage = ['owner', 'admin', 'manager'].includes(role || '');
  const canDelete = ['owner', 'admin'].includes(role || '');
  const current = data.companyId === companyId ? data : { staff: [], logs: [] };
  const ready = !!companyId && data.companyId === companyId && !loading;

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setLoading(true);
    async function readAll(table: string, fields: string) {
      const rows: any[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data: page, error } = await supabase.from(table).select(fields).eq('company_id', companyId)
          .order('id').range(offset, offset + 499).abortSignal(controller.signal);
        if (error) throw error;
        rows.push(...page);
        if (page.length < 500) return rows;
      }
    }
    async function load() {
      try {
        if (!companyId) return;
        const [people, logs] = await Promise.all([readAll('staff', staffFields), readAll('staff_work_logs', logFields)]);
        const staff = people.map(mapStaff);
        if (!controller.signal.aborted) setData({ companyId, staff, logs: logs.map(l => mapLog(l, staff)) });
      } catch {
        if (!controller.signal.aborted) setError('Não foi possível carregar equipe e presenças. Tente atualizar.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [companyId, version]);

  async function run(action: () => Promise<void>) {
    if (!ready || !canManage || pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      return activeCompany.current === companyId;
    } catch {
      if (activeCompany.current === companyId) setError('Não foi possível salvar a alteração. Confira a conexão e sua permissão; os campos foram mantidos.');
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const saveStaff = (staff: StaffMember, isNew: boolean) => run(async () => {
    if (staff.workDays) {
      if (!staff.workScheduleFrom || staff.workDays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Escala inválida');
      periodRange(staff.workScheduleFrom, 'day');
    }
    const payload = {
      work_days: staff.workDays ? [...new Set(staff.workDays)].sort() : null,
      work_schedule_from: staff.workDays ? staff.workScheduleFrom : null,
      name: staff.name.trim(), role: staff.role, phone: staff.phone, contract_type: staff.contractType,
      daily_rate: staff.dailyRate || 0, commission_rate: staff.commissionRate,
      commission_type: staff.commissionType, fixed_commission_value: staff.fixedCommissionValue || 0,
      status: staff.status, active: staff.status !== 'Inativo', specialties: staff.specialties || [],
      pix_key: staff.pixKey || '', notes: staff.notes || '',
    };
    const query = isNew ? supabase.from('staff').insert({ ...payload, company_id: companyId })
      : supabase.from('staff').update(payload).eq('company_id', companyId).eq('id', staff.id);
    const { data: row, error } = await query.select(staffFields).single();
    if (error) throw error;
    if (activeCompany.current === companyId) setData(previous => {
      const saved = mapStaff(row);
      return { ...previous, staff: [...previous.staff.filter(s => s.id !== saved.id), saved],
        logs: previous.logs.map(log => log.staffId === saved.id ? { ...log, staffName: saved.name } : log) };
    });
  });

  const saveLog = (log: StaffWorkLog) => run(async () => {
    const person = current.staff.find(s => s.id === log.staffId);
    if (!person) throw new Error('Funcionário indisponível');
    const payload = staffAttendancePayload(log, person, companyId);
    const { data: row, error } = await supabase.from('staff_work_logs')
      .upsert(payload, { onConflict: 'staff_id,work_date' }).select(logFields).single();
    if (error) throw error;
    if (activeCompany.current === companyId) setData(previous => ({ ...previous,
      logs: [mapLog(row, previous.staff), ...previous.logs.filter(l => !(l.staffId === log.staffId && l.date === log.date))] }));
  });

  const deleteLog = (id: string) => {
    if (!canDelete) return Promise.resolve(false);
    return run(async () => {
      const { error } = await supabase.from('staff_work_logs').delete().eq('company_id', companyId).eq('id', id).select('id').single();
      if (error) throw error;
      if (activeCompany.current === companyId) setData(previous => ({ ...previous, logs: previous.logs.filter(l => l.id !== id) }));
    });
  };
  return { staffList: current.staff, staffWorkLogs: current.logs, loading, busy, error, ready, canManage, canDelete,
    reload: () => { if (!pending.current) setVersion(value => value + 1); },
    addStaff: (staff: StaffMember) => saveStaff(staff, true),
    updateStaff: (staff: StaffMember) => saveStaff(staff, false),
    deactivateStaff: (id: string) => {
      const staff = current.staff.find(s => s.id === id);
      return staff ? saveStaff({ ...staff, status: 'Inativo' }, false) : Promise.resolve(false);
    },
    saveLog, deleteLog };
}
