import React, { useState } from 'react';
import { usePaymentFees } from '../hooks/usePaymentFees';
import { calculateFee, money, PaymentRecord } from '../lib/paymentFees';
import { localDate } from '../lib/expenseDates';
const field='w-full rounded-lg border border-[#283854] bg-[#0f172a] px-3 py-2 text-xs text-white';
export function PaymentFeeEditor({payment,model,onClose}:{payment:PaymentRecord;model:ReturnType<typeof usePaymentFees>;onClose:()=>void}) {
 const [processor,setProcessor]=useState(payment.processor_id??'');
 const parcelled=['Crédito Parcelado','Boleto Parcelado'].includes(payment.payment_method);
 const [installments,setInstallments]=useState(payment.installments??(parcelled?2:1));
 const [mode,setMode]=useState<'rate'|'statement'>(payment.settlement_confirmed?'statement':'rate');
 const [actual,setActual]=useState(payment.settlement_confirmed&&payment.net_amount!==null?String(payment.net_amount):'');
 const [date,setDate]=useState(payment.settled_at??localDate());
 const [message,setMessage]=useState('');
 const machine=model.processors.find(p=>p.id===processor&&p.active);
 const rate=model.rates.find(r=>r.processor_id===processor&&r.payment_method===payment.payment_method&&r.installments===installments);
 let preview:{fee:number;net:number}|null=null;let previewError='';
 try {if(payment.payment_method==='Dinheiro')preview=calculateFee(Number(payment.amount),0,0);else if(machine&&rate)preview=calculateFee(Number(payment.amount),rate.percentage,rate.fixed_fee);}catch(err){previewError=(err as Error).message;}
 return <form className="mt-3 border-t border-slate-700 pt-3 space-y-3" onSubmit={async e=>{
   e.preventDefault();setMessage('');
   if(mode==='statement'&&(actual===''||!Number.isFinite(Number(actual))||Number(actual)<0||Number(actual)>payment.amount)){setMessage('Informe o valor líquido integral que foi creditado.');return;}
   if(await model.applyFee(payment,processor,installments,mode==='statement'?Number(actual):null,mode==='statement'?date:null))onClose();
 }}>
   <p className="text-xs text-slate-300">{payment.payment_method} • Bruto {money(Number(payment.amount))}</p>
   <fieldset disabled={model.busy||model.loading} className="space-y-3">
     <label className="block text-xs text-slate-300">Como conferir<select className={`${field} mt-1`} value={mode} onChange={e=>setMode(e.target.value as 'rate'|'statement')}><option value="rate">Calcular pela taxa cadastrada</option><option value="statement">Conferir valor integral no extrato / caixa</option></select></label>
     {payment.payment_method!=='Dinheiro'&&<label className="block text-xs text-slate-300">Maquininha / plano{mode==='statement'?' (opcional)':''}<select className={`${field} mt-1`} value={processor} onChange={e=>setProcessor(e.target.value)} required={mode==='rate'}><option value="">Selecione</option>{model.processors.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
     {parcelled&&<label className="block text-xs text-slate-300">Parcelas<select className={`${field} mt-1`} value={installments} onChange={e=>setInstallments(Number(e.target.value))}>{Array.from({length:23},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}x</option>)}</select></label>}
     {mode==='rate'?<>
       {preview?<p className="text-xs text-blue-200">Taxa calculada: {money(preview.fee)} • Líquido previsto: {money(preview.net)}</p>:<p className="text-xs text-amber-300">{previewError||'Selecione uma maquininha com taxa cadastrada para esta modalidade e parcelas, ou confira pelo extrato.'}</p>}
       <p className="text-[11px] text-slate-400">Salva a taxa usada nesta venda. Não confirma que o dinheiro já foi creditado.</p>
     </>:<>
       <label className="block text-xs text-slate-300">Líquido integral creditado (R$)<input className={`${field} mt-1`} type="number" required min="0" max={payment.amount} step="0.01" value={actual} onChange={e=>setActual(e.target.value)}/></label>
       <label className="block text-xs text-slate-300">Data do crédito integral<input className={`${field} mt-1`} type="date" required max={localDate()} value={date} onChange={e=>setDate(e.target.value)}/></label>
       <p className="text-[11px] text-amber-200">Confirme somente após receber o valor integral da venda. Se o repasse parcelado estiver incompleto, mantenha como previsto. Inclua os descontos de antecipação no líquido informado.</p>
     </>}
     {message&&<p role="alert" className="text-xs text-rose-300">{message}</p>}
     <div className="flex flex-wrap gap-2"><button type="submit" disabled={mode==='rate'&&!preview} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{model.busy?'Salvando…':mode==='statement'?'Confirmar líquido recebido':'Salvar taxa e líquido previsto'}</button><button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">Cancelar</button></div>
   </fieldset>
 </form>;
}
