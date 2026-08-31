import type { ClockKind } from './clock';
export type SheetEvent = { id: number; account_id: string; kind: ClockKind; recorded_at: string; effective_at: string; review_status: 'approved' | 'rejected' | null; pending_correction: boolean };
export type SheetDay = { date: string; events: SheetEvent[]; validatedMs: number; pendingMs: number; incomplete: boolean; contested: boolean; continuation: boolean };
const zone = 'America/Sao_Paulo';
export function sheetDate(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return ['year','month','day'].map(k => parts.find(p => p.type === k)!.value).join('-');
}
export function sheetTime(value: string, day: string) {
  const time = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value));
  return time + (sheetDate(value) === day ? '' : ' (' + sheetDate(value).split('-').reverse().slice(0,2).join('/') + ')');
}
export function sheetHours(ms: number) {
  // Trunca somente na apresentação; soma preserva milissegundos.
  const minutes = Math.floor(ms / 60000);
  return Math.floor(minutes / 60) + 'h ' + String(minutes % 60).padStart(2,'0') + 'min';
}
export function sheetDays(month: string): SheetDay[] {
  if (!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Selecione um mês válido.');
  const [y,m] = month.split('-').map(Number);
  return Array.from({length:new Date(Date.UTC(y,m,0)).getUTCDate()},(_,i)=>({date:month+'-'+String(i+1).padStart(2,'0'),events:[],validatedMs:0,pendingMs:0,incomplete:false,contested:false,continuation:false}));
}
export function buildClockSheet(month: string, events: SheetEvent[]) {
  const days = sheetDays(month), byDay = new Map(days.map(d=>[d.date,d]));
  // Keep original sequence; sorting corrected timestamps could hide invalid chronology.
  let shift: SheetEvent[] = [];
  function finish() {
    if (!shift.length) return;
    const date = sheetDate(shift[0].effective_at), day = byDay.get(date);
    for (const event of shift) {
      const other = byDay.get(sheetDate(event.effective_at));
      if (other && other !== day) other.continuation = true;
    }
    if (day) {
      day.events.push(...shift);
      let state: 'out' | 'work' | 'break' = 'out', last = 0, total = 0, valid = true;
      for (const e of shift) {
        const at = Date.parse(e.effective_at);
        if (!Number.isFinite(at) || (last && at < last)) valid = false;
        if (e.kind === 'entry') { if(state !== 'out') valid = false; state='work'; }
        else if(e.kind === 'break_start') { if(state !== 'work') valid=false; else total += at-last; state='break'; }
        else if(e.kind === 'break_end') { if(state !== 'break') valid=false; state='work'; }
        else { if(state === 'out') valid=false; if(state === 'work') total += at-last; state='out'; }
        last=at;
      }
      const complete = valid && shift[0].kind === 'entry' && shift.at(-1)!.kind === 'exit' && state === 'out'
        && Date.parse(shift.at(-1)!.effective_at)-Date.parse(shift[0].effective_at) <= 86400000;
      const contested = shift.some(e=>e.review_status==='rejected');
      day.incomplete ||= !complete; day.contested ||= contested;
      if(complete && !contested) {
        if(shift.every(e=>e.review_status==='approved' && !e.pending_correction)) day.validatedMs+=total;
        else day.pendingMs+=total;
      }
    }
    shift=[];
  }
  for(const e of [...events].sort((a,b)=>a.id-b.id)) {
    if(e.kind==='entry' && shift.length) finish();
    shift.push(e);
    if(e.kind==='exit') finish();
  }
  finish();
  return days;
}
export function sheetStatus(day: SheetDay) {
  if(day.contested) return 'Contestado · conferir';
  if(day.incomplete) return 'Incompleto / conferir jornada';
  if(!day.events.length) return day.continuation ? 'Continuação de jornada anterior' : 'Sem marcação';
  return day.events.some(e=>e.review_status!=='approved' || e.pending_correction) ? 'Pendente de validação' : 'Validado';
}
