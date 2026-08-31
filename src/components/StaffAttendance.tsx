import React, { useEffect, useRef, useState } from 'react';
import type { StaffMember, StaffWorkLog } from '../types';
import { attendanceMonth, attendanceStatuses, suggestedDailyRate } from '../lib/attendance';
import { shiftPeriod } from '../lib/financialPeriod';

const tones: Record<string, string> = {
  Presente: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
  'Meio Período': 'bg-amber-500/20 text-amber-200 border-amber-500/40',
  Falta: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  Folga: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
};
const shortDate = (date: string) => date.split('-').reverse().join('/');
type Draft = { status: StaffWorkLog['status']; amount: string; notes: string };

export const StaffAttendance: React.FC<{
  staff: StaffMember; logs: StaffWorkLog[]; date: string; busy: boolean;
  canManage: boolean; canDelete: boolean;
  onSave: (log: StaffWorkLog) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ staff, logs, date, busy, canManage, canDelete, onSave, onDelete }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [month, setMonth] = useState(date.slice(0, 7));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const section = useRef<HTMLDivElement>(null);
  useEffect(() => { setSelectedDate(date); setMonth(date.slice(0, 7)); setDraft(null); setMessage(''); }, [date]);
  const memberLogs = logs.filter(log => log.staffId === staff.id);
  const saved = memberLogs.find(log => log.date === selectedDate);
  const monthLogs = memberLogs.filter(log => log.date.startsWith(month + '-'));
  const calendar = attendanceMonth(month);

  function choose(status: StaffWorkLog['status']) {
    setDraft({ status, amount: String(saved?.status === status ? (saved.dailyRateCharged || 0) : suggestedDailyRate(staff, status)), notes: saved?.notes || '' });
    setMessage('');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    const ok = await onSave({ id: saved?.id || '', staffId: staff.id, staffName: staff.name,
      date: selectedDate, status: draft.status, dailyRateCharged: Number(draft.amount), notes: draft.notes });
    setFailed(!ok);
    setMessage(ok ? 'Registro salvo no Supabase.' : 'Não foi possível salvar. Seu preenchimento foi mantido.');
    if (ok) setDraft(null);
  }

  return <div ref={section} className="space-y-3 rounded-xl border border-[#23314a] bg-[#111827] p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <strong className="text-slate-200">{shortDate(selectedDate)}</strong>
      <span className={saved ? tones[saved.status].split(' ').find(c => c.startsWith('text-')) : 'text-slate-400'}>{saved?.status || 'Sem registro'}</span>
    </div>
    {canManage ? <>
      <p className="text-xs text-slate-400">Como foi o dia de {staff.name.split(' ')[0]}?</p>
      <div className="grid grid-cols-2 gap-2">
        {attendanceStatuses.map(status => <button key={status} type="button" disabled={busy}
          aria-pressed={(draft?.status || saved?.status) === status} onClick={() => choose(status)}
          className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-semibold disabled:opacity-50 ${tones[status]} ${draft?.status === status ? 'ring-2 ring-white/60' : ''}`}>{status}</button>)}
      </div>
    </> : <p className="text-xs text-slate-400">A gestão registra e corrige a frequência.</p>}
    {draft && <form onSubmit={save} className="space-y-3 border-t border-slate-700 pt-3">
      <p className="text-sm text-white">Salvar <strong>{draft.status}</strong> em {shortDate(selectedDate)}?</p>
      {!['Falta', 'Folga'].includes(draft.status) && <label className="block text-xs text-slate-300">Diária deste dia (R$)
        <input required min="0" step="0.01" type="number" value={draft.amount} disabled={busy}
          onChange={event => setDraft({ ...draft, amount: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white" />
        <span className="mt-1 block text-slate-400">Valor previsto, não confirmação de pagamento. Ajuste se necessário.</span>
      </label>}
      {['Falta', 'Folga'].includes(draft.status) && <p className="text-xs text-slate-400">Sem diária lançada para este dia. Isso não calcula desconto salarial.</p>}
      <label className="block text-xs text-slate-300">Observação (opcional)
        <textarea rows={2} maxLength={2000} value={draft.notes} disabled={busy} onChange={event => setDraft({ ...draft, notes: event.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white" />
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => setDraft(null)} className="rounded-lg p-2 text-sm text-slate-300">Cancelar</button>
        <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Salvar registro'}</button>
      </div>
    </form>}
    {message && <p role={failed ? 'alert' : 'status'} className={`text-xs ${failed ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>}
    {saved && !draft && <div className="space-y-1 text-xs text-slate-400">
      {saved.notes && <p className="whitespace-pre-wrap break-words">{saved.notes}</p>}
      <p>Diária registrada: R$ {(saved.dailyRateCharged || 0).toFixed(2).replace('.', ',')}</p>
      {canDelete && <button type="button" disabled={busy} className="py-2 text-rose-300" onClick={async () => {
        if (!confirm('Apagar somente o registro de ' + shortDate(selectedDate) + ' de ' + staff.name + '?')) return;
        const ok = await onDelete(saved.id);
        setFailed(!ok); setMessage(ok ? 'Registro removido.' : 'Não foi possível remover.');
      }}>Apagar registro deste dia</button>}
    </div>}
    <details className="border-t border-slate-700 pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-blue-300">Ver calendário e dias trabalhados</summary>
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" disabled={busy || !!draft} aria-label="Mês anterior" className="rounded-lg border border-slate-600 p-2 text-slate-200" onClick={() => setMonth(shiftPeriod(month + '-01', 'month', -1).slice(0, 7))}>‹</button>
          <label className="min-w-0 flex-1 text-xs text-slate-300">Mês
            <input type="month" value={month} disabled={busy || !!draft} onChange={event => { if (event.target.value) setMonth(event.target.value); }} className="w-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 p-2 text-white" />
          </label>
          <button type="button" disabled={busy || !!draft} aria-label="Próximo mês" className="rounded-lg border border-slate-600 p-2 text-slate-200" onClick={() => setMonth(shiftPeriod(month + '-01', 'month', 1).slice(0, 7))}>›</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {attendanceStatuses.map(status => <span key={status} className={`rounded-lg border p-2 ${tones[status]}`}>{status}: {monthLogs.filter(log => log.status === status).length}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => <span key={label} className="text-slate-400">{label}</span>)}
          {Array.from({ length: calendar.offset }, (_, i) => <span key={'blank' + i} />)}
          {calendar.dates.map(day => {
            const log = monthLogs.find(row => row.date === day);
            return <button key={day} type="button" disabled={busy || !!draft} aria-label={shortDate(day) + ': ' + (log?.status || 'Sem registro')}
              aria-pressed={day === selectedDate}
              onClick={() => { setSelectedDate(day); setMessage(''); section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className={`min-w-0 rounded-md border py-2 text-xs disabled:opacity-50 ${log ? tones[log.status] : 'border-slate-700 text-slate-400'} ${day === selectedDate ? 'ring-2 ring-blue-400' : ''}`}>
              {Number(day.slice(8))}<span className="block text-[9px]">{log ? ({ Presente: 'P', 'Meio Período': '½', Falta: 'F', Folga: 'Fo' }[log.status]) : '—'}</span>
            </button>;
          })}
        </div>
        <p className="text-xs text-slate-400">Toque em um dia para consultar ou corrigir. “—” significa sem registro, não falta.</p>
      </div>
    </details>
  </div>;
};
