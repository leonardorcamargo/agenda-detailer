import React, { useEffect, useMemo, useState } from 'react';
import { ProductItem, ServiceOrder } from '../types';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle,
  CalendarDays,
  Car,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Package,
  Pencil,
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  products = [],
  onOpenOSModal,
  onNavigateToCatalog,
}) => {
  const [company, setCompany] = useState<DashboardCompany>({ name: 'Sua empresa', logoUrl: '' });
  const [userName, setUserName] = useState('');
  const [appointmentsToday, setAppointmentsToday] = useState(0);

  const carsInYard = useMemo(
    () => orders.filter((order) =>
      order.status === 'Aguardando' ||
      order.status === 'Em Execução' ||
      order.status === 'Pronto para Entrega'
    ),
    [orders]
  );

  const waitingCount = orders.filter((order) => order.status === 'Aguardando').length;
  const inServiceCount = orders.filter((order) => order.status === 'Em Execução').length;
  const readyCount = orders.filter((order) => order.status === 'Pronto para Entrega').length;
  const finishedCount = orders.filter((order) => order.status === 'Finalizado').length;
  const pendingPaymentCount = orders.filter((order) => order.paymentStatus !== 'Pago').length;
  const criticalProducts = products.filter((product) => product.currentStock <= product.minStock);

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

      if (membershipError || !membership) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const [companyResult, profileResult, appointmentsResult] = await Promise.all([
        supabase.from('companies').select('name, logo_url, owner_name').eq('id', membership.company_id).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', membership.company_id)
          .gte('scheduled_at', todayStart.toISOString())
          .lt('scheduled_at', tomorrowStart.toISOString()),
      ]);

      if (companyResult.data) {
        setCompany({
          name: companyResult.data.name ?? 'Sua empresa',
          logoUrl: companyResult.data.logo_url ?? '',
        });
      }

      setUserName(
        profileResult.data?.full_name?.trim() ||
        companyResult.data?.owner_name?.trim() ||
        user.email?.split('@')[0] ||
        ''
      );
      setAppointmentsToday(appointmentsResult.count ?? 0);
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

  const handleOpenSettings = () => {
    document.querySelector<HTMLButtonElement>('button[data-tab="configuracoes"]')?.click();
  };

  const attentionItems = [
    criticalProducts.length > 0 ? `${criticalProducts.length} ${criticalProducts.length === 1 ? 'insumo precisa' : 'insumos precisam'} de reposição` : null,
    readyCount > 0 ? `${readyCount} ${readyCount === 1 ? 'veículo pronto' : 'veículos prontos'} para entrega` : null,
    pendingPaymentCount > 0 ? `${pendingPaymentCount} ${pendingPaymentCount === 1 ? 'pagamento pendente' : 'pagamentos pendentes'}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-[#23314a] bg-gradient-to-r from-[#101a2b] to-[#0d1422] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-500/80 bg-[#0b1220] shadow-lg shadow-blue-950/30 sm:h-20 sm:w-20">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-black text-blue-300">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{company.name}</h1>
              <button type="button" onClick={handleOpenSettings} className="rounded-full p-1.5 text-slate-500 hover:bg-[#1b2940] hover:text-blue-400" title="Editar empresa">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">Estética Automotiva</p>
          </div>
        </div>

        <div className="flex items-center sm:pl-10">
          <div className="border-l border-[#2a3850] pl-5 sm:pl-8">
            <div className="flex items-center gap-2 text-sm font-black tracking-[0.16em] text-slate-300 sm:text-base">
              <Sparkles className="h-4 w-4 text-blue-500" /> AGENDA DETAILER
            </div>
            <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-slate-600">Gestão automotiva inteligente</p>
          </div>
        </div>
      </section>

      <section className="px-1 py-1">
        <h2 className="text-xl font-black text-white sm:text-2xl">{greeting}{userName ? `, ${userName}` : ''}!</h2>
        <p className="mt-1 text-xs capitalize text-slate-500 sm:text-sm">Aqui está o que está acontecendo hoje · {todayLabel}</p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: 'Agendamentos hoje', value: appointmentsToday, icon: CalendarDays, tone: 'text-blue-400 bg-blue-500/10' },
          { label: 'Em atendimento', value: inServiceCount, icon: Clock3, tone: 'text-blue-400 bg-blue-500/10' },
          { label: 'Concluídos', value: finishedCount, icon: CheckCircle2, tone: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Pendências', value: attentionItems.length, icon: AlertTriangle, tone: 'text-rose-400 bg-rose-500/10' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-[#23314a] bg-[#121b2a] p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${tone}`}><Icon className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] text-slate-500 sm:text-[11px]">{label}</p>
                <p className="text-xl font-black text-white sm:text-2xl">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-[#23314a] bg-[#121b2a]">
          <div className="flex items-center justify-between border-b border-[#23314a] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Operação de hoje</h3>
            </div>
            <span className="text-[11px] text-slate-500">{carsInYard.length} no pátio</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#23314a] border-b border-[#23314a]">
            <div className="p-3.5 text-center"><strong className="block text-xl text-white">{waitingCount}</strong><span className="text-[10px] text-slate-500">Aguardando</span></div>
            <div className="p-3.5 text-center"><strong className="block text-xl text-blue-400">{inServiceCount}</strong><span className="text-[10px] text-slate-500">Em execução</span></div>
            <div className="p-3.5 text-center"><strong className="block text-xl text-emerald-400">{readyCount}</strong><span className="text-[10px] text-slate-500">Prontos</span></div>
          </div>
          <div className="divide-y divide-[#1e2a40]">
            {carsInYard.slice(0, 4).map((order) => (
              <button key={order.id} onClick={() => onOpenOSModal(order)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#172338]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-200">OS #{order.osNumber} · {order.clientName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{order.plate} · {order.brand} {order.model}</p>
                </div>
                <span className="hidden text-[10px] font-semibold text-blue-400 sm:block">{order.status}</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            ))}
            {carsInYard.length === 0 && <p className="p-5 text-center text-xs text-slate-500">Nenhum veículo no pátio agora.</p>}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[#23314a] bg-[#121b2a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Lembretes e pendências</h3>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            {attentionItems.length > 0 ? (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-xl border border-[#23314a] bg-[#0f1725] px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-medium text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-emerald-500/5 p-3 text-xs text-emerald-300">Tudo em ordem por aqui.</p>
            )}
          </div>

          <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-950/35 to-[#101a2b] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><Wrench className="h-4 w-4" /></div>
              <div>
                <h3 className="text-sm font-bold text-white">Dica do Detailer</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Mantenha clientes, veículos e serviços atualizados para agilizar os próximos atendimentos.</p>
              </div>
            </div>
          </div>

          {criticalProducts.length > 0 && onNavigateToCatalog && (
            <button onClick={onNavigateToCatalog} className="flex w-full items-center justify-between rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 text-left">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-rose-400" />
                <div><p className="text-xs font-bold text-white">Estoque baixo</p><p className="text-[10px] text-slate-500">{criticalProducts.length} para revisar</p></div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
