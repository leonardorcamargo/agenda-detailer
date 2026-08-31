import type { StaffMember, StaffWorkLog } from '../types';
import { brazilDate, periodRange } from './financialPeriod';
export const fixedStatuses: StaffWorkLog['status'][] = ['Falta', 'Atraso', 'Saída antecipada', 'Atraso e saída antecipada'];
export const workStatuses: StaffWorkLog['status'][] = ['Presente', 'Meio Período', 'Por horário'];
export const attendanceStatuses: StaffWorkLog['status'][] = [...workStatuses, ...fixedStatuses, 'Folga'];
export const isFixed = (staff: StaffMember) => staff.contractType === 'Fixo / CLT';
export const statusLabel = (status: string) => status === 'Presente' ? 'Dia inteiro' : status;
export const needsArrival = (status: string) => ['Atraso', 'Atraso e saída antecipada', 'Por horário'].includes(status);
export const needsDeparture = (status: string) => ['Saída antecipada', 'Atraso e saída antecipada', 'Por horário'].includes(status);
export function mergeOccurrenceStatus(next: StaffWorkLog['status'], previous?: StaffWorkLog['status']) {
  return (next === 'Atraso' && previous === 'Saída antecipada') || (next === 'Saída antecipada' && previous === 'Atraso')
    ? 'Atraso e saída antecipada' as const : next;
}
const timeMinutes = (time: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Horário inválido');
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
};
export function durationMinutes(arrival: string, departure: string, nextDay = false) {
  const minutes = timeMinutes(departure) - timeMinutes(arrival) + (nextDay ? 1440 : 0);
  if (minutes <= 0 || minutes > 1440) throw new Error('Confira entrada, saída e a opção de dia seguinte.');
  return minutes;
}
export function blankDayLabel(staff: StaffMember, day: string, today = brazilDate(new Date())!) {
  if (!isFixed(staff)) return 'Sem trabalho registrado';
  if (!staff.workDays || !staff.workScheduleFrom || day < staff.workScheduleFrom) return 'Escala não definida';
  if (!staff.workDays.includes(new Date(day + 'T12:00:00Z').getUTCDay())) return 'Fora da escala';
  return day > today ? 'Previsto na escala' : 'Sem ocorrência registrada';
}
export function suggestedDailyRate(staff: StaffMember, status: StaffWorkLog['status']) {
  if (isFixed(staff) || !['Presente', 'Meio Período'].includes(status) || staff.commissionType !== 'Diária Fixa') return 0;
  return Math.round((staff.dailyRate || 0) * (status === 'Meio Período' ? 0.5 : 1) * 100) / 100;
}
export function attendancePayload(log: StaffWorkLog, companyId: string) {
  periodRange(log.date, 'day'); // Reject impossible dates.
  if (!attendanceStatuses.includes(log.status)) throw new Error('Situação inválida');
  const amount = Number(log.dailyRateCharged ?? 0);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Valor inválido');
  const arrival = needsArrival(log.status) ? log.arrivalTime || '' : null;
  const departure = needsDeparture(log.status) ? log.departureTime || '' : null;
  if (arrival !== null) timeMinutes(arrival);
  if (departure !== null) timeMinutes(departure);
  const nextDay = !!(arrival && departure && log.departureNextDay);
  if (arrival && departure) durationMinutes(arrival, departure, nextDay);
  return { company_id: companyId, staff_id: log.staffId, work_date: log.date, status: log.status,
    arrival_time: arrival, departure_time: departure, departure_next_day: nextDay,
    daily_rate_charged: [...fixedStatuses, 'Folga'].includes(log.status) ? 0 : Math.round(amount * 100) / 100,
    notes: log.notes?.trim() || null };
}
export function attendanceMonth(month: string) {
  const range = periodRange(month + '-01', 'month');
  const first = new Date(range.start + 'T12:00:00Z');
  const count = Number(range.end.slice(8, 10));
  return { offset: (first.getUTCDay() + 6) % 7,
    dates: Array.from({ length: count }, (_, i) => month + '-' + String(i + 1).padStart(2, '0')) };
}
export function staffAttendancePayload(log: StaffWorkLog, staff: StaffMember, companyId: string) {
  if (log.staffId !== staff.id) throw new Error('Funcionário incorreto');
  if (!(isFixed(staff) ? [...fixedStatuses, 'Folga'] : workStatuses).includes(log.status)) throw new Error('Registro incompatível com o vínculo');
  return attendancePayload(isFixed(staff) ? { ...log, dailyRateCharged: 0 } : log, companyId);
}
