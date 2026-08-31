import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffMember } from '../types';
import { buildClockSheet, sheetDate, sheetHours, sheetStatus, sheetTime, type SheetDay, type SheetEvent } from '../lib/clockSheet';
import { clockLabels, type ClockKind } from '../lib/clock';
type Snapshot = { account_id: string | null; events: SheetEvent[]; server_now: string };
const fields: [ClockKind,string][] = [['entry','Entrada'],['break_start','Saída almoço / intervalo'],['break_end','Retorno almoço / intervalo'],['exit','Saída / término']];
const input = 'min-w-0 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-base text-white';
function Times({day,kind}:{day:SheetDay;kind:ClockKind}) {
  const events=day.events.filter(e=>e.kind===kind);
  return <>{events.length ? events.map(e=><div key={e.id} className="break-words">{sheetTime(e.effective_at,day.date)}{e.effective_at!==e.recorded_at && <span className="block text-xs text-amber-300">Ajustado</span>}</div>) : '—'}</>;
}
function DayHours({day}:{day:SheetDay}) {
  return <>{day.events.length && !day.incomplete && !day.contested ? sheetHours(day.validatedMs+day.pendingMs) : '—'}</>;
}
export const ClockSheet: React.FC<{companyId:string;staffList:StaffMember[];onReview:()=>void}> = ({companyId,staffList,onReview}) => {
  const [staffId,setStaffId]=useState('');
  const [month,setMonth]=useState(()=>sheetDate(new Date().toISOString()).slice(0,7));
  const [refresh,setRefresh]=useState(0);
  const [state,setState]=useState<{key:string;data?:Snapshot;error?:string} | null>(null);
  const staff=staffList.find(s=>s.id===staffId);
  const key=companyId+':'+staffId+':'+month+':'+refresh;
  useEffect(()=>{
    if(!companyId || !staffId || !month) return;
    let cancelled=false;
    void (async()=>{
      try {
        const {data,error}=await supabase.rpc('clock_month',{p_company_id:companyId,p_staff_id:staffId,p_month:month+'-01'});
        if(error) throw error;
        if(!cancelled) setState({key,data:data as Snapshot});
      } catch(error:any) { if(!cancelled) setState({key,error:error.message || 'Não foi possível carregar a folha.'}); }
    })();
    return ()=>{cancelled=true;};
  },[key,companyId,staffId,month]);
  const current=state?.key===key ? state : null;
  const days=current?.data ? buildClockSheet(month,current.data.events) : [];
  // Dias com qualquer inconsistência ficam inteiramente fora dos totais para não
  // exibir soma parcial como jornada completa.
  const eligible=days.filter(d=>!d.incomplete && !d.contested);
  const approved=eligible.reduce((s,d)=>s+d.validatedMs,0), pending=eligible.reduce((s,d)=>s+d.pendingMs,0);
  return <section className="min-w-0 space-y-4" aria-label="Folha de ponto">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Folha de ponto</h2><p className="text-sm text-slate-400">Escolha quem deseja consultar e o mês.</p></div>
      <button onClick={onReview} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Validar pontos / liberar acesso</button></div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="min-w-0 text-sm text-slate-300">Colaborador<select className={input} value={staffId} onChange={e=>setStaffId(e.target.value)}><option value="">Selecione o colaborador</option>{staffList.map(s=><option key={s.id} value={s.id}>{s.name}{s.status!=='Ativo' ? ' · '+s.status : ''}</option>)}</select></label>
      <label className="min-w-0 text-sm text-slate-300">Mês<input type="month" min="2000-01" max="2100-12" className={input} value={month} onChange={e=>{if(/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(e.target.value))setMonth(e.target.value);}} /></label>
      <button onClick={()=>setRefresh(n=>n+1)} disabled={!staff || !current} className="self-end rounded-lg border border-slate-600 p-3 text-sm text-white disabled:opacity-40">Atualizar</button>
    </div>
    {staff && <p className="break-words text-sm text-slate-300"><strong>{staff.name}</strong> · {staff.role} · Contato: {staff.phone || 'Não informado'}</p>}
    {staff && !current && <p role="status" className="text-slate-300">Carregando a folha…</p>}
    {current?.error && <p role="alert" className="rounded-lg bg-rose-950 p-3 text-rose-200">{current.error}</p>}
    {current?.data && <>
      {!current.data.account_id && <p className="rounded-lg bg-amber-950 p-3 text-sm text-amber-200">Este colaborador ainda não ativou o acesso ao ponto. Use “Validar pontos / liberar acesso”. Nenhum horário será preenchido automaticamente.</p>}
      <div className="grid gap-3 sm:grid-cols-3">{[['Horas validadas',sheetHours(approved)],['Horas pendentes',sheetHours(pending)],['Dias para conferir',String(days.filter(d=>d.incomplete||d.contested).length)]].map(([label,value])=><div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><strong className="text-xl text-white">{value}</strong></div>)}</div>
      <p className="text-xs text-slate-400">Intervalos descontados. Dias incompletos ou contestados não entram nos totais. Sem marcação não significa falta. Jornada que atravessa a meia-noite pertence à data da entrada; acima de 24h exige conferência. Horários de São Paulo, sem cálculo de folha de pagamento.</p>
      <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-slate-700 lg:block"><table className="w-full text-left text-sm text-slate-200"><thead className="bg-slate-900 text-xs text-slate-400"><tr><th className="p-3">Data / dia</th>{fields.map(([k,l])=><th className="p-3" key={k}>{l}</th>)}<th className="p-3">Horas</th><th className="p-3">Situação</th></tr></thead><tbody>{days.map(d=><tr key={d.date} className="border-t border-slate-800"><td className="p-3">{d.date.split('-').reverse().join('/')}<span className="block text-xs text-slate-400">{weekday(d.date)}</span></td>{fields.map(([k])=><td className="p-3" key={k}><Times day={d} kind={k}/></td>)}<td className="p-3"><DayHours day={d}/></td><td className="p-3 text-xs">{sheetStatus(d)}</td></tr>)}</tbody></table></div>
      <div className="space-y-3 lg:hidden">{days.map(d=><article key={d.date} className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200"><h3 className="font-bold">{d.date.split('-').reverse().join('/')} · {weekday(d.date)}</h3><p className="mt-1 text-xs text-blue-300">{sheetStatus(d)}</p><dl className="mt-3 grid min-w-0 grid-cols-2 gap-3">{fields.map(([k,l])=><div key={k} className="min-w-0"><dt className="text-xs text-slate-400">{l}</dt><dd><Times day={d} kind={k}/></dd></div>)}</dl><p className="mt-3 border-t border-slate-700 pt-2">Horas trabalhadas: <strong><DayHours day={d}/></strong></p></article>)}</div>
      <details className="rounded-xl border border-slate-700 p-3 text-sm text-slate-300"><summary className="cursor-pointer">Ver marcações e horários originais</summary><div className="mt-3 space-y-3">{days.filter(d=>d.events.length).map(d=><div key={d.date}><strong>{d.date.split('-').reverse().join('/')}</strong>{d.events.map(e=><p key={e.id} className="break-words text-xs">{clockLabels[e.kind]} · {sheetTime(e.effective_at,d.date)} · original: {new Date(e.recorded_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}{e.pending_correction ? ' · ajuste pendente' : ''}</p>)}</div>)}</div></details>
      <p className="text-xs text-slate-500">Consultado em {new Date(current.data.server_now).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. Use Atualizar após novas marcações ou validações.</p>
    </>}
  </section>;
};
function weekday(date:string) { return new Date(date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long'}); }
