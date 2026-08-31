export type ClockKind = 'entry' | 'break_start' | 'break_end' | 'exit';
export const clockLabels: Record<ClockKind,string> = { entry: 'Entrada', break_start: 'Saída para intervalo', break_end: 'Volta do intervalo', exit: 'Saída' };
export function clockActions(last?: ClockKind): ClockKind[] {
  return !last || last === 'exit' ? ['entry'] : last === 'break_start' ? ['break_end','exit'] : ['break_start','exit'];
}
export function clockTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
}
// Sem depender do fuso do celular. Horário operacional desta versão: São Paulo.
export function proposedClockTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Informe data e horário.');
  const iso = value + ':00-03:00';
  const civil = new Date(value + ':00Z');
  if (!Number.isFinite(civil.getTime()) || civil.toISOString().slice(0,16) !== value || !Number.isFinite(new Date(iso).getTime())) throw new Error('Data inválida.');
  return iso;
}
export type ClockEvent = { id: number; account_id: string; kind: ClockKind; recorded_at: string; effective_at?: string; own?: boolean; name?: string; decision?: any };
export type ClockAccount = { id: string; staff_id: string; name: string; company_name: string; own: boolean; active: boolean; last_event?: ClockEvent };
export type ClockSnapshot = { accounts: ClockAccount[]; events: ClockEvent[]; corrections: any[]; recent: (ClockEvent & { name: string })[]; manager: boolean; admin: boolean; server_now: string };
