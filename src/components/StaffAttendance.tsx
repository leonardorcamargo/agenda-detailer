import React, { useEffect, useState } from 'react';
import type { StaffMember, StaffWorkLog } from '../types';
import { attendanceMonth, attendancePayload, blankDayLabel, durationMinutes, fixedStatuses, isFixed, mergeOccurrenceStatus, needsArrival, needsDeparture, statusLabel, suggestedDailyRate, workStatuses } from '../lib/attendance';
import { shiftPeriod } from '../lib/financialPeriod';

const shortDate = (date: string) => date.split('-').reverse().join('/');
const tones = (status?: string) => status === 'Falta' ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
  : status?.includes('traso') || status === 'Saída antecipada' ? 'border-amber-500/40 text-amber-200 bg-amber-500/10'
  : status === 'Folga' ? 'border-sky-500/40 text-sky-200 bg-sky-500/10'
  : status ? 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10' : 'border-slate-700 text-slate-400';
const codes: Record<string, string> = { Presente: 'P', 'Meio Período': '½', 'Por horário': 'H', Falta: 'F', Folga: 'Fo',
  Atraso: 'A', 'Saída antecipada': 'S', 'Atraso e saída antecipada': 'A/S' };
type Draft = { status: StaffWorkLog['status']; amount: string; notes: string; arrival: string; departure: string; nextDay: boolean };

export const StaffAttendance: React.FC<{
  staff: StaffMember; logs: StaffWorkLog[]; date: string; busy: boolean;
  canManage: boolean; canDelete: boolean;
  onSave: (log: StaffWorkLog) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ staff, logs, date, busy, canManage, canDelete, onSave, onDelete }) => {
  const [selectedDate, setSelectedDate] = useState(date);
  const [month, setMonth] = useState(date.slice(0, 7));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => { setSelectedDate(date); setMonth(date.slice(0, 7)); setDraft(null); setEditing(false); setMessage(''); }, [date]);
  const fixed = isFixed(staff);
  const statuses = fixed ? fixedStatuses : workStatuses;
  const memberLogs = logs.filter(log => log.staffId === staff.id);
  const saved = memberLogs.find(log => log.date === selectedDate);
  const monthLogs = memberLogs.filter(log => log.date.startsWith(month + '-'));
  const calendar = attendanceMonth(month);

  function choose(status: StaffWorkLog['status']) {
    if (fixed) status = mergeOccurrenceStatus(status, saved?.status);
    setDraft({ status, amount: String(saved?.status === status ? saved.dailyRateCharged || 0 : suggestedDailyRate(staff, status)),
      notes: draft?.notes ?? saved?.notes ?? '', arrival: draft?.arrival ?? saved?.arrivalTime ?? '',
      departure: draft?.departure ?? saved?.departureTime ?? '', nextDay: draft?.nextDay ?? saved?.departureNextDay ?? false });
    setMessage('');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || busy || !canManage) return;
    const log: StaffWorkLog = { id: saved?.id || '', staffId: staff.id, staffName: staff.name, date: selectedDate,
      status: draft.status, dailyRateCharged: fixed ? 0 : Number(draft.amount), notes: draft.notes,
      arrivalTime: draft.arrival, departureTime: draft.departure, departureNextDay: draft.nextDay };
    try { attendancePayload(log, 'validation'); }
    catch (error) { setFailed(true); setMessage((error as Error).message); return; }
    const ok = await onSave(log);
    setFailed(!ok); setMessage(ok ? 'Registro salvo.' : 'Não foi possível salvar. Seu preenchimento foi mantido.');
    if (ok) { setDraft(null); setEditing(false); }
  }
  let duration = '';
  if (saved?.arrivalTime && saved.departureTime) {
    try { const minutes = durationMinutes(saved.arrivalTime, saved.departureTime, saved.departureNextDay);
      duration = Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'min de permanência (sem descontar intervalos)'; } catch {}
  }

  return <div className="min-w-0 space-y-3 rounded-xl border border-[#23314a] bg-[#111827] p-3">
    <div className="flex flex-wrap justify-between gap-2 text-sm">
      <strong className="text-slate-200">{shortDate(selectedDate)}</strong>
      <span className="text-slate-300">{saved ? statusLabel(saved.status) : blankDayLabel(staff, selectedDate)}</span>
    </div>
    <p className="text-xs text-slate-400">{fixed
      ? 'Fixo: anote apenas falta, atraso ou saída antecipada. Sem marcação diária de presença.'
      : 'Registre somente quando trabalhar. Sem lançamento, não gera presença nem diária.'}</p>
    {fixed && !staff.workDays && <p className="text-xs text-amber-300">Defina os dias de trabalho em Editar colaborador → Escala semanal.</p>}
    {canManage && <button type="button" disabled={busy} onClick={() => { setEditing(!editing); setDraft(null); setMessage(''); }}
      className="min-h-11 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
      {editing ? 'Fechar lançamento' : fixed ? 'Registrar ocorrência' : 'Registrar trabalho'}
    </button>}
    {editing && canManage && <div className="grid grid-cols-2 gap-2">
      {statuses.map(status => <button key={status} type="button" disabled={busy} aria-pressed={draft?.status === status}
        onClick={() => choose(status)} className={'min-h-11 rounded-lg border p-2 text-xs ' + tones(status) + (draft?.status === status ? ' ring-2 ring-blue-400' : '')}>
        {statusLabel(status)}</button>)}
      {fixed && <button type="button" disabled={busy} onClick={() => choose('Folga')} className="rounded-lg border border-slate-600 p-2 text-xs text-slate-300">Folga excepcional</button>}
    </div>}
    {draft && <form onSubmit={save} className="space-y-3 border-t border-slate-700 pt-3">
      <p className="text-sm text-white">{statusLabel(draft.status)} em {shortDate(selectedDate)}</p>
      {saved && <p className="text-xs text-amber-300">Já registrado: {statusLabel(saved.status)}. Salvar atualiza este dia com a situação acima.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {needsArrival(draft.status) && <label className="text-xs text-slate-300">Chegada
          <input required type="time" disabled={busy} value={draft.arrival} onChange={e => setDraft({ ...draft, arrival: e.target.value })}
            className="mt-1 block w-full min-w-0 rounded-lg bg-slate-900 p-2 text-white" /></label>}
        {needsDeparture(draft.status) && <label className="text-xs text-slate-300">Saída
          <input required type="time" disabled={busy} value={draft.departure} onChange={e => setDraft({ ...draft, departure: e.target.value })}
            className="mt-1 block w-full min-w-0 rounded-lg bg-slate-900 p-2 text-white" /></label>}
      </div>
      {needsArrival(draft.status) && needsDeparture(draft.status) && <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" disabled={busy} checked={draft.nextDay} onChange={e => setDraft({ ...draft, nextDay: e.target.checked })} />Saída no dia seguinte
      </label>}
      {!fixed && <label className="block text-xs text-slate-300">Valor deste trabalho (R$)
        <input required min="0" step="0.01" type="number" value={draft.amount} disabled={busy}
          onChange={e => setDraft({ ...draft, amount: e.target.value })} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-white" />
        <span className="mt-1 block text-slate-400">{staff.commissionType === 'Diária Fixa'
          ? 'Valor previsto, não pagamento confirmado. Por horário: informe o valor combinado.'
          : 'Pagamento por serviço continua na OS. Mantenha zero aqui para não lançar novamente.'}</span>
      </label>}
      {fixed && <p className="text-xs text-slate-400">Somente registro da ocorrência; sem diária ou desconto salarial automático.</p>}
      <label className="block text-xs text-slate-300">Observação (opcional)
        <textarea rows={2} maxLength={2000} value={draft.notes} disabled={busy} onChange={e => setDraft({ ...draft, notes: e.target.value })}
          className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-white" /></label>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => setDraft(null)} className="p-2 text-sm text-slate-300">Cancelar</button>
        <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">{busy ? 'Salvando…' : 'Salvar registro'}</button>
      </div>
    </form>}
    {message && <p role={failed ? 'alert' : 'status'} className={'text-xs ' + (failed ? 'text-rose-300' : 'text-emerald-300')}>{message}</p>}
    {saved && !draft && <div className="space-y-1 text-xs text-slate-400">
      {saved.arrivalTime && <p>Chegada: {saved.arrivalTime}</p>}
      {saved.departureTime && <p>Saída: {saved.departureTime}{saved.departureNextDay ? ' (dia seguinte)' : ''}</p>}
      {duration && <p>{duration}</p>}
      {saved.notes && <p className="whitespace-pre-wrap break-words">{saved.notes}</p>}
      {!fixed && <p>Valor registrado: R$ {(saved.dailyRateCharged || 0).toFixed(2).replace('.', ',')}</p>}
      {canDelete && <button type="button" disabled={busy} className="py-2 text-rose-300" onClick={async () => {
        if (!confirm('Apagar somente o registro de ' + shortDate(selectedDate) + ' de ' + staff.name + '?')) return;
        const ok = await onDelete(saved.id); setFailed(!ok); setMessage(ok ? 'Registro removido.' : 'Não foi possível remover.');
      }}>Apagar registro deste dia</button>}
    </div>}
    <details className="border-t border-slate-700 pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-blue-300">{fixed ? 'Ver calendário de ocorrências' : 'Ver calendário e dias trabalhados'}</summary>
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" disabled={busy || !!draft} aria-label="Mês anterior" className="p-2 text-white" onClick={() => setMonth(shiftPeriod(month + '-01', 'month', -1).slice(0, 7))}>‹</button>
          <label className="min-w-0 flex-1 text-xs text-slate-300">Mês
            <input type="month" value={month} disabled={busy || !!draft} onChange={e => { if (e.target.value) setMonth(e.target.value); }} className="w-full min-w-0 rounded-lg bg-slate-900 p-2 text-white" />
          </label>
          <button type="button" disabled={busy || !!draft} aria-label="Próximo mês" className="p-2 text-white" onClick={() => setMonth(shiftPeriod(month + '-01', 'month', 1).slice(0, 7))}>›</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {statuses.map(status => <span key={status} className={'rounded-lg border p-2 ' + tones(status)}>
            {statusLabel(status)}: {monthLogs.filter(log => log.status === status).length}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => <span key={label} className="text-slate-400">{label}</span>)}
          {Array.from({ length: calendar.offset }, (_, i) => <span key={'blank' + i} />)}
          {calendar.dates.map(day => {
            const log = monthLogs.find(row => row.date === day);
            const empty = blankDayLabel(staff, day);
            return <button key={day} type="button" disabled={busy || !!draft} aria-label={shortDate(day) + ': ' + (log ? statusLabel(log.status) : empty)}
              aria-pressed={day === selectedDate} onClick={() => { setSelectedDate(day); setEditing(false); setMessage(''); }}
              className={'min-w-0 rounded-md border py-2 text-xs ' + tones(log?.status) + (day === selectedDate ? ' ring-2 ring-blue-400' : '')}>
              {Number(day.slice(8))}<span className="block text-[9px]">{log ? codes[log.status] : empty === 'Fora da escala' ? '·' : '—'}</span>
            </button>;
          })}
        </div>
        <p className="text-xs text-slate-400">{fixed ? 'F = falta · A = atraso · S = saída antecipada · A/S = ambos · Fo = folga. Sem ocorrência não confirma ponto. A escala exibida é a atual, a partir da vigência informada; feriados exigem folga excepcional.' : 'P = dia inteiro · ½ = meio período · H = por horário · — = sem trabalho registrado.'} Toque no dia para consultar ou corrigir.</p>
      </div>
    </details>
  </div>;
};
