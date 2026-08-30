import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ServiceOrder, Appointment } from '../types';
import { usePaymentFees } from '../hooks/usePaymentFees';
import { money, summarizePayments } from '../lib/paymentFees';
import { brazilDate, FinancialPeriod, inPeriod, periodRange, shiftPeriod } from '../lib/financialPeriod';
import { PaymentFeeSettings } from './PaymentFeeSettings';
import { PaymentFeeEditor } from './PaymentFeeEditor';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseManager } from './ExpenseManager';

interface FinancialViewProps {
  companyId: string;
  orders: ServiceOrder[];
  appointments: Appointment[];
  role: string | null;
  onUpdatePaymentStatus: (orderId: string, status: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado') => void;
}
const shortDate = (value: string) => value.split('-').reverse().join('/');
const panel = 'bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 sm:p-5';
const control = 'rounded-lg border border-[#283854] bg-[#182338] px-3 py-2 text-xs text-slate-200 disabled:opacity-40';

export const FinancialView: React.FC<FinancialViewProps> = ({ companyId, orders, appointments, role }) => {
  const expenseModel = useExpenses(companyId);
  const refreshKey = useMemo(() => [orders, appointments], [orders, appointments]);
  const feeModel = usePaymentFees(companyId, refreshKey);
  const [period, setPeriod] = useState<FinancialPeriod>('month');
  const [anchor, setAnchor] = useState(() => brazilDate(new Date())!);
  const range = periodRange(anchor, period);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [receiptScope, setReceiptScope] = useState('period');
  const [onlyPending, setOnlyPending] = useState(false);
  const [showAllMovements, setShowAllMovements] = useState(false);
  const receiptsRef = useRef<HTMLDetailsElement>(null);
  const expensesRef = useRef<HTMLDetailsElement>(null);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const canManage = ['owner', 'admin', 'manager'].includes(role ?? '');
  const payments = feeModel.payments.filter(p => inPeriod(p.paid_at, range));
  const expenses = expenseModel.expenses.filter(e => inPeriod(e.expense_date, range));
  const expenseTotal = expenses.reduce((sum, e) => sum + Math.round(e.value * 100), 0) / 100;
  const summary = summarizePayments(payments, expenseTotal);
  const paymentUnavailable = feeModel.loading || !!feeModel.error;
  const expenseUnavailable = expenseModel.loading || !!expenseModel.error;
  const openOrders = orders.filter(o => ['Pendente', 'Fiado'].includes(o.paymentStatus));
  const partialOrders = orders.filter(o => o.paymentStatus === 'Parcial');
  const pendingTotal = openOrders.reduce((sum, o) => sum + Math.round(o.totalValue * 100), 0) / 100;
  const missingDate = feeModel.payments.filter(p => !p.paid_at || !brazilDate(p.paid_at));
  const confirmedInPeriod = feeModel.payments.filter(p => p.settlement_confirmed && inPeriod(p.settled_at, range))
    .reduce((sum, p) => sum + Math.round(Number(p.net_amount) * 100), 0) / 100;
  const labelFor = (payment: typeof feeModel.payments[number]) => {
    const order = orders.find(o => o.id === payment.service_order_id);
    const appointment = appointments.find(a => a.id === payment.appointment_id);
    return order ? `OS #${order.osNumber}${order.clientName ? ` • ${order.clientName}` : ''}` : appointment ? `Agendamento • ${appointment.clientName || 'Cliente'}` : 'Recebimento';
  };
  const movements = [
    ...payments.map(p => ({ id: `payment-${p.id}`, date: brazilDate(p.paid_at!)!, title: labelFor(p), kind: 'income', amount: p.net_amount, note: p.fee_amount === null ? 'Taxa a conferir' : p.settlement_confirmed ? 'Líquido conferido' : 'Líquido calculado' })),
    ...expenses.map(e => ({ id: `expense-${e.id}`, date: e.expense_date, title: e.description, kind: 'expense', amount: e.value, note: e.category })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const receiptList = (receiptScope === 'all' ? feeModel.payments : receiptScope === 'undated' ? missingDate : payments)
    .filter(p => !onlyPending || p.fee_amount === null || !p.settlement_confirmed);
  const openReceipts = (pending = false) => {
    setOnlyPending(pending); setReceiptScope('period'); setReceiptsOpen(true);
    requestAnimationFrame(() => receiptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const changePeriod = (next: FinancialPeriod) => { setPeriod(next); setShowAllMovements(false); setEditingFee(null); };

  return <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl sm:text-2xl font-bold text-white">Financeiro</h2><p className="text-xs text-slate-400 mt-1">Veja o que entrou, o que saiu e o que falta receber.</p></div>
      {canManage && <button type="button" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white" onClick={() => { setExpensesOpen(true); requestAnimationFrame(() => expensesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>Registrar despesa</button>}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-xl border border-[#23314a] bg-[#141c2b] p-1 gap-1" aria-label="Período do financeiro">
        {([['day', 'Diário'], ['week', 'Semanal'], ['month', 'Mensal']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => changePeriod(value)} className={`rounded-lg px-4 py-2 text-xs font-semibold ${period === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Período anterior" className={control} onClick={() => { setAnchor(shiftPeriod(anchor, period, -1)); setEditingFee(null); }}><ChevronLeft className="w-4 h-4" /></button>
        <label className="sr-only" htmlFor="finance-reference-date">Data de referência</label>
        <input id="finance-reference-date" type="date" value={anchor} className={`${control} max-w-[155px]`} onChange={e => { if (e.target.value) { try { periodRange(e.target.value, period); setAnchor(e.target.value); setEditingFee(null); } catch { /* Keep the last valid range. */ } } }} />
        <button type="button" aria-label="Próximo período" className={control} onClick={() => { setAnchor(shiftPeriod(anchor, period, 1)); setEditingFee(null); }}><ChevronRight className="w-4 h-4" /></button>
        <button type="button" className={control} onClick={() => { setAnchor(brazilDate(new Date())!); setEditingFee(null); }}>Hoje</button>
      </div>
    </div>
    <p className="text-xs text-slate-400">{range.start === range.end ? shortDate(range.start) : `${shortDate(range.start)} a ${shortDate(range.end)}`}</p>

    {(feeModel.error || expenseModel.error) && <div role="alert" className="text-xs text-rose-300">Não foi possível atualizar todos os valores. <button type="button" className="underline" disabled={feeModel.busy || expenseModel.busy || feeModel.loading || expenseModel.loading} onClick={() => { void feeModel.reload(); void expenseModel.reload(); }}>Tentar novamente</button></div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { title: 'Faturamento bruto', value: paymentUnavailable ? null : summary.gross, note: 'Recebido dos clientes', color: 'text-white' },
        { title: 'Líquido', value: paymentUnavailable || summary.unresolved ? null : summary.knownNet, note: summary.unresolved ? 'Falta conferir taxas' : summary.unconfirmed ? 'Após taxas • calculado' : 'Após taxas, antes das despesas', color: 'text-emerald-300' },
        { title: 'Despesas', value: expenseUnavailable ? null : expenseTotal, note: 'Lançadas no período', color: 'text-rose-300' },
        { title: 'A receber', value: partialOrders.length ? null : pendingTotal, note: partialOrders.length ? 'Há pagamentos parciais a conferir' : 'OS em aberto • todos os períodos', color: 'text-amber-300' },
      ].map(card => <div key={card.title} className="rounded-2xl border border-[#23314a] bg-[#141c2b] p-3 sm:p-4">
        <p className="text-xs font-medium text-slate-400">{card.title}</p><p className={`mt-3 text-lg sm:text-2xl font-bold break-words ${card.color}`}>{card.value === null ? '—' : money(card.value)}</p><p className="mt-2 text-[11px] text-slate-400">{card.note}</p>
      </div>)}
    </div>
    {!paymentUnavailable && summary.unresolved > 0 && <button type="button" onClick={() => openReceipts(true)} className="text-xs text-amber-300 hover:underline">Confira as taxas de {summary.unresolved} pagamento(s) para ver seu líquido →</button>}

    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-white">Fluxo do período</h3><span className="text-[11px] text-slate-400">Entradas e despesas lançadas</span></div>
      {paymentUnavailable || expenseUnavailable ? <p className="py-6 text-xs text-slate-400">{feeModel.loading || expenseModel.loading ? 'Carregando movimentações…' : 'Atualize os dados para ver o fluxo completo.'}</p> : movements.length === 0 ? <p className="py-6 text-xs text-slate-400">Nenhuma movimentação neste período. Escolha outra data para consultar.</p> : <div className="mt-3 divide-y divide-[#23314a] max-h-[420px] overflow-y-auto">
        {(showAllMovements ? movements : movements.slice(0, 8)).map(item => <div key={item.id} className="flex items-center gap-3 py-3">
          <span className={`shrink-0 rounded-lg p-2 ${item.kind === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{item.kind === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}</span>
          <div className="min-w-0 flex-1"><p className="text-xs text-slate-200 break-words">{item.title}</p><p className="text-[11px] text-slate-400 mt-1">{shortDate(item.date)} • {item.note}</p></div>
          <p className={`text-xs sm:text-sm font-semibold text-right ${item.kind === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>{item.amount === null ? 'A conferir' : `${item.kind === 'expense' ? '− ' : '+ '}${money(item.amount)}`}</p>
        </div>)}
      </div>}
      {movements.length > 8 && <button type="button" className="mt-3 text-xs text-blue-300" onClick={() => setShowAllMovements(!showAllMovements)}>{showAllMovements ? 'Mostrar menos' : `Ver todas as ${movements.length} movimentações`}</button>}
      {missingDate.length > 0 && <button type="button" className="mt-3 block text-xs text-amber-300" onClick={() => { setReceiptScope('undated'); setOnlyPending(false); setReceiptsOpen(true); requestAnimationFrame(() => receiptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>{missingDate.length} pagamento(s) sem data não entram no filtro. Conferir →</button>}
      <p className="mt-3 text-[11px] text-slate-500">Entradas pela data do pagamento do cliente; despesas pela data lançada. Repasses da maquininha podem ocorrer em outra data.</p>
    </section>

    <div className="space-y-3">
      <details ref={expensesRef} open={expensesOpen} onToggle={e => setExpensesOpen(e.currentTarget.open)} className={`${panel} scroll-mt-20`}>
        <summary className="cursor-pointer text-sm font-semibold text-white">Registrar e gerenciar despesas</summary>
        <div className="mt-4"><ExpenseManager model={expenseModel} role={role} /></div>
      </details>
      <details ref={receiptsRef} open={receiptsOpen} onToggle={e => setReceiptsOpen(e.currentTarget.open)} className={`${panel} scroll-mt-20`}>
        <summary className="cursor-pointer text-sm font-semibold text-white">Conferir recebimentos e taxas</summary>
        <div className="flex flex-wrap gap-3 items-center mt-4">
          <label className="text-xs text-slate-300">Mostrar <select className={control} value={receiptScope} onChange={e => { setReceiptScope(e.target.value); setEditingFee(null); }}><option value="period">Período selecionado</option><option value="all">Todos os pagamentos</option><option value="undated">Sem data ({missingDate.length})</option></select></label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} />Somente pendências</label>
        </div>
        {feeModel.error && <p role="alert" className="text-xs text-rose-300 mt-3">{feeModel.error}</p>}
        {feeModel.loading ? <p className="mt-3 text-xs text-slate-400">Carregando…</p> : receiptList.length === 0 ? <p className="mt-3 text-xs text-slate-400">Nenhum recebimento nesta seleção.</p> : <div className="mt-4 space-y-3">
          {receiptList.map(payment => <div key={payment.id} className="rounded-xl bg-[#182338] p-3 text-xs space-y-2">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-white">{labelFor(payment)}</p><span className="text-slate-400">{payment.paid_at && brazilDate(payment.paid_at) ? shortDate(brazilDate(payment.paid_at)!) : 'Sem data de pagamento'}</span></div>
            <p className="text-slate-400">{payment.payment_method}{payment.processor_name ? ` • ${payment.processor_name} • ${payment.installments}x` : ''}</p>
            <p className="text-slate-300">Bruto {money(payment.amount)} • Taxa {payment.fee_amount === null ? 'a conferir' : money(payment.fee_amount)} • Líquido {payment.net_amount === null ? 'a conferir' : money(payment.net_amount)}</p>
            <p className={payment.settlement_confirmed ? 'text-emerald-300' : 'text-amber-300'}>{payment.settlement_confirmed ? `Crédito integral conferido em ${shortDate(payment.settled_at!)}` : payment.fee_amount === null ? 'Falta informar a taxa' : 'Calculado; falta conferir o crédito no extrato'}</p>
            {payment.fee_basis === 'configured' && <p className="text-slate-400">Taxa usada: {payment.fee_percentage}% + {money(Number(payment.fee_fixed))}</p>}
            {canManage && <button type="button" className={control} disabled={feeModel.busy || feeModel.loading} onClick={() => setEditingFee(editingFee === payment.id ? null : payment.id)}>Taxa / líquido</button>}
            {canManage && editingFee === payment.id && <PaymentFeeEditor payment={payment} model={feeModel} onClose={() => setEditingFee(null)} />}
          </div>)}
        </div>}
      </details>
      <details className={panel}>
        <summary className="cursor-pointer text-sm font-semibold text-white">Entender o resultado e os valores a receber</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
          <div><p className="text-slate-400">Taxas registradas no período</p><p className="mt-1 font-semibold text-white">{paymentUnavailable ? '—' : money(summary.fees)}{summary.unresolved ? ' (parcial)' : ''}</p></div>
          <div><p className="text-slate-400">Créditos conferidos pela data do repasse</p><p className="mt-1 font-semibold text-white">{paymentUnavailable ? '—' : money(confirmedInPeriod)}</p></div>
          <div><p className="text-slate-400">Líquido menos despesas do período</p><p className="mt-1 font-semibold text-white">{paymentUnavailable || expenseUnavailable || summary.result === null ? '—' : money(summary.result)}</p></div>
        </div>
        <div className="mt-4 space-y-2 text-xs text-slate-400">
          <p>Bruto é o valor recebido dos clientes. Líquido é esse valor menos as taxas. As despesas ainda precisam ser descontadas para apurar o resultado.</p>
          <p>O resultado considera despesas lançadas, mesmo que ainda não tenham sido pagas. Não representa saldo bancário. Valores calculados precisam ser conferidos no extrato.</p>
          <p>Não registre a mesma taxa da maquininha novamente como despesa: ela já foi descontada do recebimento.</p>
          <p>A receber reúne OS pendentes e fiado de todos os períodos, sem filtrar por data. Não inclui previsões da Agenda.</p>
          {partialOrders.length > 0 && <p className="text-amber-300">Há {partialOrders.length} OS com pagamento parcial. O saldo total não é exibido porque o valor já pago ainda precisa ser apurado. OS totalmente pendentes: {money(pendingTotal)}.</p>}
          {missingDate.length > 0 && <p className="text-amber-300">{missingDate.length} pagamento(s) sem data ficaram fora dos totais por período. Consulte “Sem data” em Conferir recebimentos.</p>}
        </div>
      </details>
      <details className={panel}>
        <summary className="cursor-pointer text-sm font-semibold text-white">Recebimentos por forma de pagamento</summary>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from(new Set(payments.map(p => p.payment_method))).map(method => {
            const totals = summarizePayments(payments.filter(p => p.payment_method === method), 0);
            return <div key={method} className="rounded-xl bg-[#182338] p-3 text-xs"><p className="font-semibold text-white">{method}</p><p className="mt-2 text-slate-400">Bruto {paymentUnavailable ? '—' : money(totals.gross)}</p><p className="text-emerald-300">Líquido {paymentUnavailable || totals.unresolved ? 'a conferir' : money(totals.knownNet)}</p>{totals.unconfirmed > 0 && <p className="text-[11px] text-amber-300">Inclui valores calculados</p>}</div>;
          })}
          {payments.length === 0 && <p className="text-xs text-slate-400">Sem recebimentos no período.</p>}
        </div>
      </details>
      <PaymentFeeSettings model={feeModel} canManage={canManage} />
    </div>
  </div>;
};
