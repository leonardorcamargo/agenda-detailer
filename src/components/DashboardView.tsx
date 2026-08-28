import React, { useEffect, useMemo, useState } from 'react';
import { ProductItem, ServiceOrder } from '../types';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle,
  CalendarDays,
  Car,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Package,
  ShoppingCart,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface DashboardViewProps {
  orders: ServiceOrder[];
  products?: ProductItem[];
  onOpenOSModal: (order: ServiceOrder) => void;
  onNewOSClick: () => void;
  onOpenQuickStockOutflow?: () => void;
  onOpenPurchaseOrder?: () => void;
  onAdjustStock?: (productId: string, delta: number) => void;
  onNavigateToCatalog?: () => void;
}

interface DashboardCompany {
  name: string;
  logoUrl: string;
}

interface DashboardSummary {
  receivedThisMonth: number;
  appointmentsToday: number;
}

const money = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  products = [],
  onOpenOSModal,
  onOpenQuickStockOutflow,
  onOpenPurchaseOrder,
  onNavigateToCatalog,
}) => {
  const [company, setCompany] = useState<DashboardCompany>({ name: 'Sua empresa', logoUrl: '' });
  const [summary, setSummary] = useState<DashboardSummary>({ receivedThisMonth: 0, appointmentsToday: 0 });

  const carsInYard = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'Aguardando' ||
          order.status === 'Em Execução' ||
          order.status === 'Pronto para Entrega'
      ),
    [orders]
  );

  const inServiceCount = orders.filter((order) => order.status === 'Em Execução').length;
  const waitingCount = orders.filter((order) => order.status === 'Aguardando').length;
  const readyCount = orders.filter((order) => order.status === 'Pronto para Entrega').length;
  const pendingPaymentCount = orders.filter((order) => order.paymentStatus !== 'Pago').length;
  const criticalProducts = products.filter((product) => product.currentStock <= product.minStock);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.osNumber - a.osNumber).slice(0, 4),
    [orders]
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (membershipError || !membership) {
        console.error('Não foi possível identificar a empresa no Dashboard.', membershipError);
        return;
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const [companyResult, paymentsResult, appointmentsResult] = await Promise.all([
        supabase.from('companies').select('name, logo_url').eq('id', membership.company_id).maybeSingle(),
        supabase
          .from('payments')
          .select('amount')
          .eq('company_id', membership.company_id)
          .eq('status', 'Pago')
          .gte('paid_at', monthStart.toISOString())
          .lt('paid_at', nextMonthStart.toISOString()),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', membership.company_id)
          .gte('scheduled_at', todayStart.toISOString())
          .lt('scheduled_at', tomorrowStart.toISOString()),
      ]);

      if (companyResult.error) {
        console.error('Erro ao carregar empresa no Dashboard.', companyResult.error);
      } else if (companyResult.data) {
        setCompany({
          name: companyResult.data.name ?? 'Sua empresa',
          logoUrl: companyResult.data.logo_url ?? '',
        });
      }

      if (paymentsResult.error) console.error('Erro ao carregar recebimentos no Dashboard.', paymentsResult.error);
      if (appointmentsResult.error) console.error('Erro ao carregar agendamentos do dia no Dashboard.', appointmentsResult.error);

      setSummary({
        receivedThisMonth: (paymentsResult.data ?? []).reduce(
          (total, payment) => total + Number(payment.amount ?? 0),
          0
        ),
        appointmentsToday: appointmentsResult.count ?? 0,
      });
    };

    void loadDashboardData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const initials = company.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const attentionItems = [
    readyCount > 0 ? `${readyCount} ${readyCount === 1 ? 'veículo pronto para entrega' : 'veículos prontos para entrega'}` : null,
    pendingPaymentCount > 0 ? `${pendingPaymentCount} ${pendingPaymentCount === 1 ? 'pagamento pendente' : 'pagamentos pendentes'}` : null,
    criticalProducts.length > 0 ? `${criticalProducts.length} ${criticalProducts.length === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-7xl space-y-3 p-3 sm:space-y-5 sm:p-6">
      <section className="px-2 py-3 sm:px-1 sm:py-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-500/70 bg-[#0f1727] shadow-lg shadow-blue-950/20 sm:h-20 sm:w-20">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-black text-blue-300 sm:text-2xl">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{company.name}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Agenda Detailer
            </div>
          </div>
        </div>

        <div className="mt-4 pl-1 sm:mt-5">
          <p className="text-sm font-semibold text-slate-200 sm:text-base">{greeting}!</p>
          <p className="mt-0.5 text-xs capitalize text-slate-500 sm:text-sm">{todayLabel}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
        <div className="rounded-2xl border border-[#23314a] bg-[#141c2b] p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hoje</p>
            <CalendarDays className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{summary.appointmentsToday}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-slate-400 sm:text-sm">
            {summary.appointmentsToday === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#23314a] bg-[#141c2b] p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pátio</p>
            <Car className="h-4 w-4 text-violet-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{carsInYard.length}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-slate-400 sm:text-sm">{inServiceCount} execução · {readyCount} pronto</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-emerald-500/20 bg-[#141c2b] p-3.5 md:col-span-1 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recebido no mês</p>
              <p className="mt-1 truncate text-2xl font-black text-white sm:mt-2 sm:text-3xl">{money(summary.receivedThisMonth)}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_0.65fr] lg:gap-4">
        <div className="overflow-hidden rounded-2xl border border-[#23314a] bg-[#141c2b]">
          <div className="flex items-center justify-between border-b border-[#23314a] px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-sm font-bold text-white">Operação no pátio</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Situação dos veículos agora</p>
            </div>
            <Wrench className="h-4 w-4 text-slate-500" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#23314a]">
            <div className="p-3 text-center sm:p-4">
              <div className="text-xl font-black text-white sm:text-2xl">{waitingCount}</div>
              <div className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Aguardando</div>
            </div>
            <div className="p-3 text-center sm:p-4">
              <div className="text-xl font-black text-blue-400 sm:text-2xl">{inServiceCount}</div>
              <div className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Em execução</div>
            </div>
            <div className="p-3 text-center sm:p-4">
              <div className="text-xl font-black text-emerald-400 sm:text-2xl">{readyCount}</div>
              <div className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">Pronto</div>
            </div>
          </div>
          {carsInYard.length > 0 && (
            <div className="border-t border-[#23314a] px-3 py-2 sm:px-5 sm:py-3">
              <button onClick={() => onOpenOSModal(carsInYard[0])} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-[#192438]">
                <span className="truncate text-[11px] font-semibold text-slate-300 sm:text-xs">
                  OS #{carsInYard[0].osNumber} · {carsInYard[0].plate} · {carsInYard[0].brand} {carsInYard[0].model}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#23314a] bg-[#141c2b] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Precisa de atenção</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Pendências da operação</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          {attentionItems.length > 0 ? (
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-xl border border-[#23314a] bg-[#111827] px-3 py-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-medium text-slate-300 sm:text-xs">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">Nenhuma pendência importante agora.</div>
          )}
        </div>
      </section>

      {recentOrders.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#23314a] bg-[#141c2b]">
          <div className="flex items-center justify-between border-b border-[#23314a] px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-sm font-bold text-white">Ordens recentes</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Últimas OS</p>
            </div>
            <Clock3 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="divide-y divide-[#1e2a40]">
            {recentOrders.map((order) => (
              <button key={order.id} onClick={() => onOpenOSModal(order)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#192438] sm:px-5 sm:py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">OS #{order.osNumber}</span>
                    <span className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">{order.plate}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{order.clientName} · {order.brand} {order.model}</p>
                </div>
                <span className="hidden text-[11px] font-semibold text-slate-400 sm:block">{order.status}</span>
                <Eye className="h-4 w-4 shrink-0 text-slate-500" />
              </button>
            ))}
          </div>
        </section>
      )}

      {criticalProducts.length > 0 && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400"><Package className="h-5 w-5" /></div>
              <div>
                <h2 className="text-sm font-bold text-white">Estoque baixo</h2>
                <p className="mt-0.5 text-xs text-slate-400">{criticalProducts.length} {criticalProducts.length === 1 ? 'item precisa' : 'itens precisam'} de reposição.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onOpenQuickStockOutflow && <button onClick={onOpenQuickStockOutflow} className="rounded-xl border border-[#2d4063] bg-[#1f2d47] px-3 py-2 text-xs font-semibold text-slate-200">Baixa rápida</button>}
              {onOpenPurchaseOrder && <button onClick={onOpenPurchaseOrder} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><ShoppingCart className="h-3.5 w-3.5" />Gerar pedido</button>}
              {onNavigateToCatalog && <button onClick={onNavigateToCatalog} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-blue-400">Ver estoque<ChevronRight className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};