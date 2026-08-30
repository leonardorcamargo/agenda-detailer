import React, { useEffect, useState } from 'react';
import { ServiceOrder, Appointment } from '../types';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseManager } from './ExpenseManager';

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  source_type: 'appointment' | 'service_order' | null;
  appointment_id: string | null;
  service_order_id: string | null;
  customer?: { name: string } | { name: string }[] | null;
  appointment?: { scheduled_at: string } | { scheduled_at: string }[] | null;
  service_order?: { os_number: number } | { os_number: number }[] | null;
}
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
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  useEffect(() => {
  if (!companyId) return;

  const loadPayments = async () => {
  console.log('FINANCEIRO companyId:', companyId);

  const { data, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_method,
      status,
      paid_at,
      source_type,
      appointment_id,
      service_order_id
    `)
    .eq('company_id', companyId)
    .eq('status', 'Pago')
    .order('paid_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar recebimentos.', error);
    return;
  }

    setPayments((data ?? []) as PaymentRecord[]);
  };

  void loadPayments();
}, [companyId, appointments, orders]);

  // Financial calculations
 const totalReceived = payments.reduce(
  (sum, payment) => sum + Number(payment.amount ?? 0),
  0
);

  const totalPending = orders
    .filter((o) => o.paymentStatus === 'Pendente')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalFiado = orders
    .filter((o) => o.paymentStatus === 'Fiado' || o.paymentMethod === 'Fiado')
    .reduce((sum, o) => sum + o.totalValue, 0);

  const totalExpensesValue = expenses.reduce((sum, e) => sum + e.value, 0);
  const netProfit = totalReceived - totalExpensesValue;

  // Payment Breakdown
  const paymentMethodStats = {
    'Pix': 0,
    'Cartão de Crédito': 0,
    'Cartão de Débito': 0,
    'Dinheiro': 0,
    'Fiado': 0,
    'Pendente': 0,
  };

  payments.forEach((payment) => {
  const method = payment.payment_method;

  if (method in paymentMethodStats) {
    paymentMethodStats[method as keyof typeof paymentMethodStats] += Number(payment.amount ?? 0);
  }
});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Financeiro</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Controle de entradas, contas a receber, faturamento por forma de pagamento e despesas da oficina.
        </p>
      </div>

      {/* Top Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Recebido */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Recebido</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-emerald-400">
              R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pagamentos recebidos</p>
          </div>
        </div>

        {/* Card 2: A Receber (Pendente) */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">A Receber</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-amber-400">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pendentes</p>
          </div>
        </div>

        {/* Card 3: Total Fiado / A Prazo */}
        <div className="bg-[#141c2b] border border-purple-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-purple-300">Fiado / A Prazo</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-purple-400">
              R$ {totalFiado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-purple-300/70 mt-1">Conta de Clientes</p>
          </div>
        </div>

        {/* Card 4: Despesas da Oficina */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Despesas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-rose-400">
              {expenseModel.loading || expenseModel.error ? '—' : `R$ ${totalExpensesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Custos fixos e insumos</p>
          </div>
        </div>

        {/* Card 5: Lucro Estimado */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Lucro Estimado</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-blue-400">
              {expenseModel.loading || expenseModel.error ? '—' : `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Recebido (-) Despesas</p>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-blue-400" />
          Faturamento por Forma de Pagamento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(paymentMethodStats).map(([method, val]) => (
            <div key={method} className="bg-[#182338] border border-[#263757] p-3.5 rounded-xl">
              <span className="text-xs text-slate-400 block font-medium">{method}</span>
              <div className="text-lg font-bold text-white mt-1">
                R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
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
      Entradas confirmadas no caixa, independente da data do serviço.
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
            className="bg-[#182338] border border-[#263757] p-3 rounded-xl flex items-center justify-between text-xs"
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

            <div className="text-right">
              <span className="font-bold text-emerald-400">
                R$ {Number(payment.amount).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>

              <div className="mt-1">
                <span className="inline-flex text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Pago
                </span>
              </div>
            </div>
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
