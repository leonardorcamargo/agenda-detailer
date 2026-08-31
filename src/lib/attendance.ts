import type { StaffMember, StaffWorkLog } from '../types';
import { periodRange } from './financialPeriod';
export const attendanceStatuses: StaffWorkLog['status'][] = ['Presente', 'Meio Período', 'Falta', 'Folga'];
export function suggestedDailyRate(staff: StaffMember, status: StaffWorkLog['status']) {
  if (status === 'Falta' || status === 'Folga' || staff.commissionType !== 'Diária Fixa') return 0;
  return Math.round((staff.dailyRate || 0) * (status === 'Meio Período' ? 0.5 : 1) * 100) / 100;
}
export function attendancePayload(log: StaffWorkLog, companyId: string) {
  periodRange(log.date, 'day'); // Reject impossible dates.
  if (!attendanceStatuses.includes(log.status)) throw new Error('Situação inválida');
  const amount = Number(log.dailyRateCharged ?? 0);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Valor inválido');
  return { company_id: companyId, staff_id: log.staffId, work_date: log.date, status: log.status,
    daily_rate_charged: ['Falta', 'Folga'].includes(log.status) ? 0 : Math.round(amount * 100) / 100,
    notes: log.notes?.trim() || null };
}
export function attendanceMonth(month: string) {
  const range = periodRange(month + '-01', 'month');
  const first = new Date(range.start + 'T12:00:00Z');
  const count = Number(range.end.slice(8, 10));
  return { offset: (first.getUTCDay() + 6) % 7,
    dates: Array.from({ length: count }, (_, i) => month + '-' + String(i + 1).padStart(2, '0')) };
}
