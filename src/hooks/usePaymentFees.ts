import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PaymentProcessor, PaymentRecord, ProcessorRate } from '../lib/paymentFees';

export function usePaymentFees(companyId: string, refreshKey: unknown) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [rates, setRates] = useState<ProcessorRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const lock = useRef(false);
  const load = useCallback(async () => {
    const generation = ++sequence.current;
    setLoading(true); setError('');
    if (!companyId) { setPayments([]); setProcessors([]); setRates([]); setLoading(false); return; }
    try {
      const readAll = async (table: string) => {
        const records: any[] = [];
        for (let offset=0; ; offset+=500) {
          let query = supabase.from(table).select('*').eq('company_id',companyId).order('id').range(offset,offset+499);
          if (table === 'payments') query = query.eq('status','Pago');
          const {data,error} = await query;
          if (error) throw error;
          records.push(...(data??[]));
          if (!data || data.length<500) return records;
        }
      };
      const [p,m,r] = await Promise.all([readAll('payments'),readAll('payment_processors'),readAll('payment_processor_rates')]);
      if (generation !== sequence.current) return;
      setPayments(p.map(item => ({...item,amount:Number(item.amount),fee_amount:item.fee_amount === null ? null : Number(item.fee_amount),net_amount:item.net_amount === null ? null : Number(item.net_amount)})).sort((a,b)=>(b.paid_at??'').localeCompare(a.paid_at??'')));
      setProcessors(m.sort((a,b)=>a.name.localeCompare(b.name)));
      setRates(r.map(item=>({...item,percentage:Number(item.percentage),fixed_fee:Number(item.fixed_fee)})));
    } catch { if (generation === sequence.current) setError('Não foi possível carregar pagamentos e taxas. Atualize a lista antes de usar os totais.'); }
    finally { if(generation===sequence.current) setLoading(false); }
  },[companyId]);
  useEffect(()=>{void load();return()=>{sequence.current++;};},[load,refreshKey]);
  const mutate = async (action:()=>PromiseLike<{data:any;error:any}>) => {
    if(lock.current || loading || !companyId) return false;
    lock.current=true;setBusy(true);setError('');
    try {
      const result=await action();
      if(result.error) throw result.error;
      if(!result.data || (Array.isArray(result.data)&&!result.data.length)) throw new Error('Operação sem resultado.');
      await load(); return true;
    } catch(err:any) {
      setError(err?.code==='42501' ? 'Seu usuário não tem permissão para esta operação.'
        : ['22023','40001'].includes(err?.code) ? err.message
        : 'Não foi possível salvar. Confira os campos, sua conexão e tente novamente.');
      return false;
    } finally {lock.current=false;setBusy(false);}
  };
  return {payments,processors,rates,loading,busy,error,reload:load,
    saveProcessor:(name:string,id?:string)=>mutate(()=>id
      ? supabase.from('payment_processors').update({name:name.trim()}).eq('company_id',companyId).eq('id',id).select('id')
      : supabase.from('payment_processors').insert({company_id:companyId,name:name.trim()}).select('id')),
    setActive:(id:string,active:boolean)=>mutate(()=>supabase.from('payment_processors').update({active}).eq('company_id',companyId).eq('id',id).select('id')),
    saveRate:(input:Omit<ProcessorRate,'id'|'company_id'>)=>mutate(()=>supabase.from('payment_processor_rates').upsert({...input,company_id:companyId},{onConflict:'company_id,processor_id,payment_method,installments'}).select('id')),
    applyFee:(payment:PaymentRecord,processorId:string,installments:number,actualNet:number|null,settledAt:string|null)=>mutate(()=>supabase.rpc('apply_payment_fee',{
      p_payment_id:payment.id,p_expected_amount:payment.amount,p_expected_method:payment.payment_method,
      p_processor_id:processorId||null,p_installments:installments,p_actual_net:actualNet,p_settled_at:settledAt,
    })),
  };
}
