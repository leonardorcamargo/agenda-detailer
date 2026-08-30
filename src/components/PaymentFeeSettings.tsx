import React, { useEffect, useState } from 'react';
import { usePaymentFees } from '../hooks/usePaymentFees';
import { money, rateMethods } from '../lib/paymentFees';
const field='w-full rounded-xl border border-[#283854] bg-[#182338] px-3 py-2 text-xs text-white';
const button='rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-200 disabled:opacity-40';
export function PaymentFeeSettings({model,canManage}:{model:ReturnType<typeof usePaymentFees>;canManage:boolean}) {
 const [name,setName]=useState('');const [processor,setProcessor]=useState('');
 const [method,setMethod]=useState('Cartão de Débito');const [installments,setInstallments]=useState(1);
 const [percentage,setPercentage]=useState('');const [fixed,setFixed]=useState('0');const [message,setMessage]=useState('');
 const current=model.processors.find(p=>p.id===processor);
 useEffect(()=>{
   const rate=model.rates.find(r=>r.processor_id===processor&&r.payment_method===method&&r.installments===installments);
   setPercentage(rate ? String(rate.percentage) : '');setFixed(rate ? String(rate.fixed_fee) : '0');
 },[processor,method,installments,model.rates]);
 const disabled=model.loading||model.busy||!canManage;
 return <details className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 space-y-4">
   <summary className="cursor-pointer text-sm font-bold text-white">Maquininhas e taxas da oficina</summary>
   <p className="text-xs text-slate-400">Cadastre a taxa total contratada por modalidade e parcelas, incluindo antecipação quando fizer parte do plano. Alterações valem somente para novos cálculos; não mudam pagamentos já conferidos.</p>
   {message&&<p role="status" className="text-xs text-emerald-300">{message}</p>}
   {canManage&&<form className="flex flex-wrap gap-2" onSubmit={async e=>{e.preventDefault();if(name.trim()&&await model.saveProcessor(name)){setName('');setMessage('Maquininha cadastrada. Selecione-a abaixo para informar as taxas.');}}}>
     <label className="grow text-xs text-slate-300">Nome da maquininha / plano<input className={`${field} mt-1`} required maxLength={100} value={name} onChange={e=>setName(e.target.value)} disabled={disabled} placeholder="Ex.: Minha maquininha — recebimento em 1 dia"/></label>
     <button className={button} disabled={disabled} type="submit">Adicionar maquininha</button>
   </form>}
   <label className="block text-xs text-slate-300">Maquininha<select className={`${field} mt-1`} value={processor} onChange={e=>{setProcessor(e.target.value);setMessage('');}}><option value="">Selecione</option>{model.processors.map(p=><option key={p.id} value={p.id}>{p.name}{p.active?'':' (inativa)'}</option>)}</select></label>
   {current&&<>
     {canManage&&<button type="button" disabled={disabled} className={button} onClick={()=>void model.setActive(current.id,!current.active)}>{current.active?'Desativar maquininha':'Reativar maquininha'}</button>}
     {canManage&&current.active&&<form className="space-y-3" onSubmit={async e=>{e.preventDefault();if(await model.saveRate({processor_id:processor,payment_method:method,installments,percentage:Number(percentage),fixed_fee:Number(fixed)}))setMessage('Taxa salva. Os pagamentos anteriores foram preservados.');}}>
       <fieldset disabled={disabled} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
         <label className="text-xs text-slate-300">Modalidade<select className={`${field} mt-1`} value={method} onChange={e=>{setMethod(e.target.value);setInstallments(e.target.value==='Crédito Parcelado'?2:1);}}>{rateMethods.map(m=><option key={m} value={m}>{m==='Cartão de Crédito'?'Crédito à vista (1x)':m}</option>)}</select></label>
         <label className="text-xs text-slate-300">Parcelas<select className={`${field} mt-1`} value={installments} disabled={method!=='Crédito Parcelado'} onChange={e=>setInstallments(Number(e.target.value))}>{(method==='Crédito Parcelado'?Array.from({length:23},(_,i)=>i+2):[1]).map(n=><option key={n} value={n}>{n}x</option>)}</select></label>
         <label className="text-xs text-slate-300">Taxa total (%)<input className={`${field} mt-1`} required type="number" min="0" max="100" step="0.01" value={percentage} onChange={e=>setPercentage(e.target.value)}/></label>
         <label className="text-xs text-slate-300">Tarifa fixa por venda (R$)<input className={`${field} mt-1`} required type="number" min="0" max="9999999999.99" step="0.01" value={fixed} onChange={e=>setFixed(e.target.value)}/></label>
       </fieldset>
       <button type="submit" disabled={disabled} className={button}>Salvar taxa desta modalidade</button>
     </form>}
     <div className="space-y-2">{model.rates.filter(r=>r.processor_id===processor).sort((a,b)=>a.payment_method.localeCompare(b.payment_method)||a.installments-b.installments).map(r=><div key={r.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#182338] p-3 text-xs text-slate-300"><span>{r.payment_method==='Cartão de Crédito'?'Crédito à vista':r.payment_method} • {r.installments}x</span><span>{r.percentage.toLocaleString('pt-BR')}% + {money(r.fixed_fee)}</span></div>)}</div>
     <p className="text-[11px] text-slate-400">Cada quantidade de parcelas precisa de sua própria taxa. Uma taxa ausente nunca será tratada como zero.</p>
   </>}
 </details>;
}
