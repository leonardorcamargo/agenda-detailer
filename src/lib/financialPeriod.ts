export type FinancialPeriod = 'day' | 'week' | 'month';

export function brazilDate(value: string | Date): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const iso = (date: Date) => date.toISOString().slice(0, 10);
export function periodRange(anchor: string, period: FinancialPeriod) {
  const date = new Date(`${anchor}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor) || Number.isNaN(date.getTime()) || iso(date) !== anchor) throw new Error('Data inválida.');
  const start = new Date(date); const end = new Date(date);
  if (period === 'week') {
    start.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    end.setTime(start.getTime()); end.setUTCDate(start.getUTCDate() + 6);
  } else if (period === 'month') {
    start.setUTCDate(1); end.setUTCMonth(end.getUTCMonth() + 1, 0);
  }
  return { start: iso(start), end: iso(end) };
}
export function inPeriod(date: string | null, range: { start: string; end: string }) {
  if (!date) return false;
  const day = brazilDate(date);
  return day !== null && day >= range.start && day <= range.end;
}
export function shiftPeriod(anchor: string, period: FinancialPeriod, direction: number) {
  const date = new Date(`${anchor}T12:00:00Z`);
  if (period === 'month') date.setUTCMonth(date.getUTCMonth() + direction, 1);
  else date.setUTCDate(date.getUTCDate() + direction * (period === 'week' ? 7 : 1));
  return iso(date);
}
