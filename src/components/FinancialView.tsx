import React, { useMemo, useState } from 'react';
import { ServiceOrder, Appointment } from '../types';
import { usePaymentFees } from '../hooks/usePaymentFees';
import { money, summarizePayments } from '../lib/paymentFees';
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

export const FinancialView: React.FC<FinancialViewProps> = ({
  companyId,
  orders,
  appointments,
  role,
  onUpdatePaymentStatus,
}) => {
  const expenseModel = useExpenses(companyId);
  const expenses = expenseModel.expenses;
  const refreshKey = useMemo(() => [orders, appointments], [orders, appointments]);
  const feeModel = usePaymentFees(companyId, refreshKey);
  const payments = feeModel.payments;
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const canManageFees = ['owner', 'admin', 'manager'].includes(role ?? '');
  const totalExpensesValue = expenses.reduce((sum, e) => sum + e.value, 0);
  const summary = summarizePayments(payments, totalExpensesValue);
  const amountsUnavailable = feeModel.loading || !!feeModel.error;
  const resultUnavailable = amountsUnavailable || expenseModel.loading || !!expenseModel.error;

  const totalPending = orders
    .filter((o) => o.paymentStatus === 'Pendente')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalFiado = orders
    .filter((o) => o.paymentStatus === 'Fiado' || o.paymentMethod === 'Fiado')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const methods = Array.from(new Set(['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Crédito Parcelado', 'Boleto Parcelado', 'Dinheiro', 'Fiado', ...payments.map(p => p.payment_method)]));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Financeiro</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Controle de entradas, contas a receber, faturamento por forma de pagamento e despesas da oficina.
        </p>
      </div>

      {feeModel.error && <p role="alert" className="text-sm text-rose-300">{feeModel.error} <button type="button" disabled={feeModel.loading || feeModel.busy} onClick={() => void feeModel.reload()} className="underline">Atualizar</button></p>}
      {summary.unresolved > 0 && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{summary.unresolved} pagamento(s) sem taxa conferida. O líquido total e o resultado ficam indisponíveis até resolver essas pendências. Nenhuma taxa foi presumida como zero.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Bruto de vendas pagas', value: amountsUnavailable ? null : summary.gross, note: 'Valor pago pelos clientes, antes das taxas' },
          { label: 'Taxas registradas', value: amountsUnavailable ? null : summary.fees, note: summary.unresolved ? 'Parcial: existem pagamentos sem taxa' : 'Já descontadas do líquido abaixo' },
          { label: 'Líquido após taxas', value: amountsUnavailable || summary.unresolved ? null : summary.knownNet, note: summary.unconfirmed ? 'Inclui valores calculados ainda não conferidos no extrato' : 'Valores com taxa registrada' },
          { label: 'Créditos integrais conferidos', value: amountsUnavailable ? null : summary.credited, note: 'Recebimento integral confirmado no extrato / caixa' },
          { label: 'Despesas registradas', value: expenseModel.loading || expenseModel.error ? null : totalExpensesValue, note: 'Todas as despesas lançadas; não representam somente saídas pagas' },
          { label: 'Resultado após taxas e despesas', value: resultUnavailable ? null : summary.result, note: summary.unconfirmed ? 'Calculado com taxas previstas; há créditos ainda não conferidos.' : 'Líquido menos despesas registradas. Não é saldo bancário nem lucro contábil.' },
          { label: 'Clientes a receber', value: totalPending, note: 'OS pendentes, antes de eventuais taxas' },
          { label: 'Fiado / a prazo', value: totalFiado, note: 'OS em aberto, antes de eventuais taxas' },
        ].map(card => <div key={card.label} className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <span className="text-[11px] font-semibold uppercase text-slate-400">{card.label}</span>
          <div className="mt-3 text-xl font-extrabold text-white">{card.value === null ? '—' : money(card.value)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{card.note}</p>
        </div>)}
      </div>
      <p className="text-[11px] text-slate-400">Totais acumulados dos registros disponíveis. Não lance as mesmas taxas da maquininha novamente como despesas, pois elas já são descontadas dos pagamentos. Confira antecipações e diferenças pelo extrato.</p>
      <PaymentFeeSettings model={feeModel} canManage={canManageFees} />
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Recebimentos por modalidade</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {methods.map(method => {
            const totals = summarizePayments(payments.filter(p => p.payment_method === method), 0);
            return <div key={method} className="bg-[#182338] border border-[#263757] p-3 rounded-xl text-xs">
              <p className="font-semibold text-white">{method === 'Cartão de Crédito' ? 'Crédito à vista (1x)' : method}</p>
              <p className="text-slate-400 mt-2">Bruto: {amountsUnavailable ? '—' : money(totals.gross)}</p>
              <p className="text-slate-400">Taxas: {amountsUnavailable || totals.unresolved ? 'A conferir' : money(totals.fees)}</p>
              <p className="text-emerald-300 font-semibold mt-1">Líquido: {amountsUnavailable || totals.unresolved ? 'A conferir' : money(totals.knownNet)}</p>
              {totals.unconfirmed > 0 && <p className="text-[11px] text-amber-300">Inclui créditos ainda não conferidos</p>}
            </div>;
          })}
        </div>
      </div>

      {/* Expenses & OS Payment Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseManager model={expenseModel} role={role} />

        {/* Right Column: Recebimentos */}
<div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
  <div>
    <h3 className="text-sm font-bold text-white tracking-tight">
      Recebimentos
    </h3>
    <p className="text-[11px] text-slate-400 mt-0.5">
      Vendas marcadas como pagas pelo cliente. Confira as taxas e o crédito efetivo abaixo.
    </p>
  </div>

  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
    {payments.length > 0 ? (
      payments.map((payment) => {
        const paidDate = payment.paid_at
          ? new Date(payment.paid_at).toLocaleString('pt-BR')
          : 'Data não informada';

        const sourceLabel =
          payment.source_type === 'appointment'
            ? 'Agendamento'
            : payment.source_type === 'service_order'
            ? 'Ordem de Serviço'
            : 'Recebimento';

        const relatedAppointment =
  payment.appointment_id
    ? appointments.find((appointment) => appointment.id === payment.appointment_id)
    : undefined;

const relatedOrder =
  payment.service_order_id
    ? orders.find((order) => order.id === payment.service_order_id)
    : undefined;

const clientName =
  relatedAppointment?.clientName ||
  relatedOrder?.clientName ||
  '';

const vehicleLabel = relatedAppointment
  ? `${relatedAppointment.vehiclePlate} • ${relatedAppointment.vehicleModel}`
  : relatedOrder
  ? `${relatedOrder.plate} • ${relatedOrder.brand} ${relatedOrder.model}`
  : '';

const serviceDate = relatedAppointment
  ? new Date(
      `${relatedAppointment.date}T${relatedAppointment.time}`
    ).toLocaleString('pt-BR')
  : '';

const title =
  payment.source_type === 'appointment'
    ? `Agendamento${clientName ? ` • ${clientName}` : ''}`
    : payment.source_type === 'service_order'
    ? `OS #${relatedOrder?.osNumber ?? ''}${clientName ? ` • ${clientName}` : ''}`
    : sourceLabel;
        return (
          <div
            key={payment.id}
            className="bg-[#182338] border border-[#263757] p-3 rounded-xl text-xs space-y-3"
          >
            <div>
              <div className="font-bold text-white">
                {title}
              </div>
            {vehicleLabel && (
  <p className="text-[11px] text-slate-400 mt-0.5">
    Veículo: {vehicleLabel}
  </p>
)}

{serviceDate && (
  <p className="text-[11px] text-slate-400 mt-0.5">
    Serviço agendado para: {serviceDate}
  </p>
)}
              <p className="text-[11px] text-slate-400 mt-0.5">
                Forma: {payment.payment_method}
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Recebido em: {paidDate}
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-slate-300">Bruto: {money(Number(payment.amount))}</p>
              <p className="text-slate-400">Taxas: {payment.fee_amount === null ? 'A conferir' : money(payment.fee_amount)}</p>
              <p className="font-bold text-emerald-300">Líquido: {payment.net_amount === null ? 'A conferir' : money(payment.net_amount)}</p>
              {payment.processor_name && <p className="text-slate-400">{payment.processor_name} • {payment.installments}x</p>}
              <p className={payment.settlement_confirmed ? 'text-emerald-300' : 'text-amber-300'}>{payment.settlement_confirmed ? `Crédito integral conferido em ${payment.settled_at?.split('-').reverse().join('/')}` : payment.fee_amount === null ? 'Taxa pendente de conferência' : 'Calculado — crédito integral ainda não confirmado'}</p>
              {payment.fee_basis === 'configured' && <p className="text-[11px] text-slate-400">Taxa usada: {payment.fee_percentage}% + {money(Number(payment.fee_fixed))}</p>}
              {canManageFees && <button type="button" disabled={feeModel.busy || feeModel.loading} onClick={() => setEditingFee(editingFee === payment.id ? null : payment.id)} className="mt-2 rounded-lg border border-blue-500/40 px-3 py-2 text-blue-300 disabled:opacity-40">Taxa / líquido</button>}
            </div>
            {editingFee === payment.id && canManageFees && <PaymentFeeEditor payment={payment} model={feeModel} onClose={() => setEditingFee(null)} />}

          </div>
        );
      })
    ) : (
      <div className="py-8 text-center text-slate-500 text-xs">
        Nenhum recebimento registrado.
      </div>
    )}
  </div>
</div>
</div>
</div>
);
};
