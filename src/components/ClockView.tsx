import React, { useState } from 'react';
import type { StaffMember } from '../types';
import type { useClock } from '../hooks/useClock';
import { clockActions, clockLabels, clockTime, proposedClockTime } from '../lib/clock';
type Clock = ReturnType<typeof useClock>;
const input = 'w-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 p-3 text-base text-white';
const button = 'min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';

export const ClockAlerts: React.FC<{ clock: Clock; onOpen: () => void }> = ({ clock, onOpen }) => {
  if (!clock.data?.manager || !clock.alerts.length) return null;
  return <aside role="status" aria-live="polite" className="fixed right-3 top-3 z-[100] w-[calc(100%-1.5rem)] max-w-sm rounded-2xl border border-blue-400 bg-slate-900 p-4 text-white shadow-xl">
    <h3 className="font-bold">Ponto registrado</h3>
    {clock.alerts.slice(0, 3).map(event => <p key={event.id} className="mt-2 break-words text-sm">
      <strong>{event.name}</strong> · {clockLabels[event.kind]}<br />{clockTime(event.recorded_at)}
    </p>)}
    {clock.alerts.length > 3 && <p className="mt-2 text-xs">Há mais registros no histórico.</p>}
    <div className="mt-3 flex justify-between gap-2">
      <button onClick={() => { clock.dismissAlerts(); onOpen(); }} className={button}>Conferir</button>
      <button onClick={clock.dismissAlerts} className="p-2 text-sm text-slate-300">Fechar aviso</button>
    </div>
  </aside>;
};

export const ClockView: React.FC<{ clock: Clock; staffList: StaffMember[] }> = ({ clock, staffList }) => {
  const [staffId, setStaffId] = useState('');
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null);
  const [message, setMessage] = useState('');
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [reviewing, setReviewing] = useState<{ id: string | number; correction: boolean; approve: boolean } | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const data = clock.data;
  const pending = data?.events.filter(e => !e.decision && !e.own) || [];
  return <section className="mx-auto w-full max-w-5xl space-y-5 p-3 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold text-white">{data?.manager ? 'Conferir ponto da equipe' : 'Meu ponto'}</h1>
        <p className="mt-1 text-xs text-slate-400">Horários de São Paulo · registros originais preservados · sem cálculo automático de folha.</p></div>
      <button className={button} disabled={clock.busy} onClick={() => void clock.refresh()}>Atualizar</button>
    </div>
    <p className={'text-xs ' + (clock.connected ? 'text-emerald-300' : 'text-amber-300')}>{clock.connected ? 'Conectado · atualização a cada 5 segundos com o app aberto.' : 'Sem confirmação de conexão. Não considere um ponto salvo sem a mensagem de sucesso.'}</p>
    {clock.error && <p role="alert" className="rounded-lg bg-rose-950 p-3 text-sm text-rose-200">{clock.error}</p>}
    {message && <p role="status" className="text-sm text-blue-200">{message}</p>}
    {!data && <p className="text-slate-300">Carregando acesso ao ponto…</p>}

    {data?.accounts.filter(a => a.own).map(account => <div key={account.id} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="font-bold text-white">{account.name} · {account.company_name}</h2>
      <p className="text-sm text-slate-300">{account.last_event ? 'Último: ' + clockLabels[account.last_event.kind] + ' · ' + clockTime(account.last_event.recorded_at) : 'Nenhum ponto registrado.'}</p>
      {!account.active && <p className="text-amber-300">Acesso suspenso ou funcionário inativo. Consulte a gestão.</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {clockActions(account.last_event?.kind).map(kind => <button key={kind} className={button} disabled={clock.busy || !clock.connected || !account.active}
          onClick={async () => {
            setMessage('');
            const result = await clock.record(account.id, kind, account.last_event?.id ?? null);
            setMessage(result ? clockLabels[kind] + ' registrada às ' + clockTime(result.recorded_at) + '.' : 'O registro não foi confirmado. Confira o histórico antes de repetir.');
          }}>{clockLabels[kind]}</button>)}
      </div>
      <p className="text-xs text-slate-400">Esqueceu uma marcação? Registre agora e solicite o ajuste no histórico, explicando o motivo. O horário original permanece.</p>
    </div>)}

    {data?.admin && <details className="rounded-xl border border-slate-700 p-4">
      <summary className="cursor-pointer font-semibold text-blue-300">Liberar acesso de funcionário</summary>
      <form className="mt-3 space-y-3" onSubmit={async e => { e.preventDefault(); setInvite(null); const result = await clock.act('invite', { staff_id: staffId, device: true }); if (result) setInvite(result); }}>
        <label className="block text-sm text-slate-300">Funcionário<select className={input} required disabled={clock.busy} value={staffId} onChange={e => { setStaffId(e.target.value); setInvite(null); }}>
          <option value="">Selecione</option>{staffList.filter(s => s.status === 'Ativo').map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
        <button className={button} disabled={clock.busy}>Gerar código para o celular</button>
      </form>
      {invite && <div className="mt-3 space-y-2 text-sm text-slate-200">
        <p>Entregue somente à pessoa escolhida. Código de uso único, válido até {clockTime(invite.expires_at)}. Gerar outro invalida o anterior.</p>
        <code className="block rounded-lg bg-slate-950 p-3 text-center text-lg tracking-wider">{invite.code.match(/.{1,4}/g)?.join('-')}</code>
        <button className={button} onClick={async () => { try { await navigator.clipboard.writeText(invite.code); setMessage('Código copiado.'); } catch { setMessage('Selecione e copie o código exibido.'); } }}>Copiar código</button>
        <p>O funcionário abre o Agenda Detailer → toca em “Sou funcionário” → digita o código. Nenhum e-mail ou senha é necessário.</p>
      </div>}
    </details>}

    {data?.manager && <details className="rounded-xl border border-slate-700 p-4">
      <summary className="cursor-pointer font-semibold text-blue-300">Situação atual da equipe</summary>
      <div className="mt-3 space-y-3">{data.accounts.map(a => <div key={a.id} className="flex flex-wrap justify-between gap-3 border-b border-slate-700 py-2 text-sm text-slate-200">
        <p>{a.name} · {a.last_event ? clockLabels[a.last_event.kind] + ' às ' + clockTime(a.last_event.recorded_at) : 'Ainda não registrou'}{!a.active ? ' · Inativo' : ''}</p>
        {data.admin && <button disabled={clock.busy} className="text-blue-300 underline" onClick={async () => {
          if (confirm((a.active ? 'Suspender' : 'Reativar') + ' o ponto de ' + a.name + '? O histórico será mantido.')) await clock.act('access', { account_id: a.id, active: !a.active });
        }}>{a.active ? 'Suspender acesso' : 'Reativar acesso'}</button>}
      </div>)}</div>
    </details>}

    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 text-sm text-slate-300">Histórico por data do registro original<input type="date" className={input} required value={clock.day} disabled={clock.busy} onChange={e => { if (e.target.value) { clock.setDay(e.target.value); setSelected([]); setAdjusting(null); setReviewing(null); } }} /></label>
      {data?.manager && <button className={button} disabled={clock.busy || !selected.length} onClick={async () => {
        if (!confirm('Aprovar os ' + selected.length + ' registros selecionados?')) return;
        const result = await clock.act('review_batch', { event_ids: selected });
        if (result) { setSelected([]); setMessage('Registros selecionados aprovados.'); }
      }}>Aprovar selecionados ({selected.length})</button>}
      {data?.manager && !!pending.length && <button className="p-2 text-sm text-blue-300 underline" disabled={clock.busy} onClick={() => setSelected(pending.slice(0,100).map(e => e.id))}>Selecionar pendentes (até 100)</button>}
    </div>
    {data && !data.events.length && <p className="text-sm text-slate-400">Nenhum registro nesta data. Isso não significa falta.</p>}
    {data && data.events.length >= 201 && <p className="text-amber-300">Limite de 201 registros exibidos nesta data. Não use esta tela como relatório completo.</p>}
    <div className="space-y-3">{data?.events.map(event => <article key={event.id} className="space-y-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{event.name} · {clockLabels[event.kind]}</strong>
        <span>{event.decision ? event.decision.decision === 'approved' ? 'Validado' : 'Contestado' : 'Aguardando validação'}</span>
      </div>
      <p>Original do servidor: {clockTime(event.recorded_at)}</p>
      {event.effective_at !== event.recorded_at && event.effective_at && <p className="text-amber-200">Horário ajustado e aprovado: {clockTime(event.effective_at)}</p>}
      {event.decision && <p className="text-xs text-slate-400">Decisão em {clockTime(event.decision.created_at)} · responsável {event.decision.reviewer_id} · {event.decision.reason}</p>}
      <div className="flex flex-wrap gap-3">
        {event.own && <button className="text-blue-300 underline" disabled={clock.busy} onClick={() => { setAdjusting(event.id); setTime(''); setReason(''); }}>Solicitar ajuste de horário</button>}
        {data.manager && !event.own && !event.decision && <>
          <label className="flex gap-2"><input type="checkbox" checked={selected.includes(event.id)} disabled={clock.busy} onChange={e => setSelected(old => e.target.checked ? [...old, event.id] : old.filter(id => id !== event.id))} />Selecionar</label>
          <button className="text-emerald-300 underline" onClick={() => { setReviewing({ id: event.id, correction: false, approve: true }); setReviewReason(''); }}>Validar</button>
          <button className="text-amber-300 underline" onClick={() => { setReviewing({ id: event.id, correction: false, approve: false }); setReviewReason(''); }}>Contestar</button>
        </>}
      </div>
      {adjusting === event.id && <form className="space-y-3" onSubmit={async e => {
        e.preventDefault();
        try { const result = await clock.act('correction', { event_id: event.id, proposed_at: proposedClockTime(time), reason }); if (result) { setAdjusting(null); setMessage('Solicitação enviada à gestão; original preservado.'); } }
        catch (error: any) { setMessage(error.message); }
      }}>
        <label className="block">Horário solicitado (São Paulo)<input type="datetime-local" className={input} required disabled={clock.busy} value={time} onChange={e => setTime(e.target.value)} /></label>
        <label className="block">Motivo<textarea className={input} required minLength={3} maxLength={500} disabled={clock.busy} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <p className="text-xs text-slate-400">Até 7 dias antes do registro. Horário futuro não é aceito. O superior confere e decide.</p>
        <button className={button} disabled={clock.busy}>Solicitar correção</button>
        <button type="button" className="p-2 underline" disabled={clock.busy} onClick={() => setAdjusting(null)}>Cancelar</button>
      </form>}
    </article>)}</div>

    {!!data?.corrections.length && <section className="space-y-3">
      <h2 className="font-bold text-white">Solicitações de ajuste</h2>
      {data.corrections.map(x => <article key={x.id} className="space-y-2 rounded-xl border border-amber-500/30 p-4 text-sm text-slate-200">
        <strong>{x.name}</strong>
        <p>Original: {clockTime(x.original_at)} → solicitado: {clockTime(x.proposed_at)}</p><p>{x.reason}</p>
        <p>{x.decision ? x.decision.decision === 'approved' ? 'Ajuste aprovado' : 'Ajuste recusado' : 'Ajuste pendente'}</p>
        {x.decision && <p className="text-xs">Responsável {x.decision.reviewer_id} · {clockTime(x.decision.created_at)} · {x.decision.reason}</p>}
        {data.manager && !x.own && !x.decision && <div className="flex gap-3">
          <button onClick={() => { setReviewing({ id: x.id, correction: true, approve: true }); setReviewReason(''); }} className="text-emerald-300 underline">Aprovar ajuste</button>
          <button onClick={() => { setReviewing({ id: x.id, correction: true, approve: false }); setReviewReason(''); }} className="text-amber-300 underline">Recusar ajuste</button>
        </div>}
      </article>)}
    </section>}
    {reviewing && <div role="dialog" aria-modal="true" aria-label="Conferir registro de ponto" className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <form className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-slate-900 p-5 text-white" onSubmit={async e => {
        e.preventDefault();
        const result = await clock.act(reviewing.correction ? 'review_correction' : 'review', {
          [reviewing.correction ? 'correction_id' : 'event_id']: reviewing.id, decision: reviewing.approve ? 'approved' : 'rejected', reason: reviewReason
        });
        if (result) { setReviewing(null); setMessage('Decisão registrada com seu usuário e horário.'); }
      }}>
        <h2 className="font-bold">{reviewing.approve ? 'Aprovar' : 'Contestar / recusar'} registro #{String(reviewing.id).slice(0,12)}</h2>
        <label className="block text-sm">Justificativa<textarea autoFocus className={input} required minLength={3} maxLength={500} disabled={clock.busy} value={reviewReason} onChange={e => setReviewReason(e.target.value)} /></label>
        {clock.error && <p role="alert" className="text-rose-300">{clock.error}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={clock.busy} onClick={() => setReviewing(null)}>Cancelar</button><button className={button} disabled={clock.busy}>Confirmar decisão</button></div>
      </form>
    </div>}
  </section>;
};
