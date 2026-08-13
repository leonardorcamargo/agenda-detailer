import React, { useState } from 'react';
import { ServiceOrder, ProductItem } from '../types';
import { 
  Car, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Eye, 
  Share2, 
  ExternalLink,
  Calendar,
  AlertTriangle,
  Zap,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

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

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  products = [],
  onOpenOSModal,
  onNewOSClick,
  onOpenQuickStockOutflow,
  onOpenPurchaseOrder,
  onAdjustStock,
  onNavigateToCatalog,
}) => {
  // Metrics calculations
  const carsInYard = orders.filter(
    (o) => o.status === 'Aguardando' || o.status === 'Em Execução' || o.status === 'Pronto para Entrega'
  );
  
  const inServiceCount = orders.filter((o) => o.status === 'Em Execução').length;

  const finishedOrders = orders.filter((o) => o.status === 'Finalizado');
  
  const monthlyRevenue = finishedOrders.reduce((sum, o) => sum + o.totalValue, 0);

  const averageTicket = finishedOrders.length > 0 ? monthlyRevenue / finishedOrders.length : 0;

  // Low stock products
  const criticalProducts = products.filter((p) => p.currentStock <= p.minStock);

  // Payment method frequency
  const paymentCounts: Record<string, number> = {};
  finishedOrders.forEach((o) => {
    paymentCounts[o.paymentMethod] = (paymentCounts[o.paymentMethod] || 0) + 1;
  });

  let topPaymentMethod = 'Cartão de Crédito';
  let topPaymentCount = 0;
  Object.entries(paymentCounts).forEach(([method, count]) => {
    if (count > topPaymentCount) {
      topPaymentMethod = method;
      topPaymentCount = count;
    }
  });

  // Daily Chart Data generator
  const dailyChartData = [
    { date: '03/08', valor: 0 },
    { date: '04/08', valor: 0 },
    { date: '05/08', valor: 960 },
    { date: '06/08', valor: 0 },
    { date: '07/08', valor: 0 },
    { date: '08/08', valor: 0 },
    { date: '09/08', valor: 180 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top 4 Metric Cards (Matching Screenshot 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Carros no pátio hoje */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              CARROS NO PÁTIO HOJE
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {carsInYard.length}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              {inServiceCount} em atendimento
            </p>
          </div>
        </div>

        {/* Card 2: Faturamento do Mês */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              FATURAMENTO DO MÊS
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              {finishedOrders.length} OS finalizadas
            </p>
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              TICKET MÉDIO
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              Média por OS finalizada
            </p>
          </div>
        </div>

        {/* Card 4: Pagamento Mais Usado */}
        <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              PAGAMENTO MAIS USADO
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight truncate">
              {topPaymentMethod}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-normal">
              {topPaymentCount > 0 ? `${topPaymentCount} recebimentos` : 'Nenhum recebimento'}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart Section: Faturamento dos últimos dias */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Faturamento dos últimos dias
          </h3>
          <span className="text-[11px] text-slate-400">Agosto 2026</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23314a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#23314a' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip
                cursor={{ fill: '#1a2438' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#26354f',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
              />
              <Bar 
                dataKey="valor" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]} 
                barSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Histórico de OS finalizadas Table (Matching Screenshot 2) */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#23314a] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Histórico de OS finalizadas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Últimos veículos entregues e recebimentos confirmados</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg">
            {finishedOrders.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#101726] text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-[#23314a]">
              <tr>
                <th className="py-3 px-4">DATA</th>
                <th className="py-3 px-4">OS</th>
                <th className="py-3 px-4">PLACA</th>
                <th className="py-3 px-4">VEÍCULO</th>
                <th className="py-3 px-4">PAGAMENTO</th>
                <th className="py-3 px-4 text-right">VALOR</th>
                <th className="py-3 px-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a40]">
              {finishedOrders.length > 0 ? (
                finishedOrders.map((order) => {
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-[#192438] transition-colors cursor-pointer group"
                      onClick={() => onOpenOSModal(order)}
                    >
                      <td className="py-3.5 px-4 text-slate-400">{formattedDate}</td>
                      <td className="py-3.5 px-4 font-bold text-white">#{order.osNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        <span className="bg-[#1a2538] border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {order.plate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {order.brand} {order.model}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-400">
                        R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenOSModal(order)}
                          className="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-blue-500/30 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhuma ordem de serviço finalizada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRITICAL STOCK ALERT WIDGET */}
      {criticalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-[#181d2e] to-[#141c2b] border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Summary and badge */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    🚨 ATENÇÃO AO ESTOQUE
                  </span>
                  <span className="text-xs font-black text-rose-400">
                    {criticalProducts.length} {criticalProducts.length === 1 ? 'insumo atingiu' : 'insumos atingiram'} o nível mínimo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  A operação não pode parar. Garanta a reposição imediata de produtos químicos, boinas e ceras antes do próximo lote de veículos.
                </p>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenPurchaseOrder && (
                <button
                  onClick={onOpenPurchaseOrder}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Gerar Pedido WhatsApp</span>
                </button>
              )}

              {onNavigateToCatalog && (
                <button
                  onClick={onNavigateToCatalog}
                  className="bg-[#1f2d47] hover:bg-[#283b5e] text-slate-200 hover:text-white font-semibold text-xs px-3 py-2 rounded-xl border border-[#2d4063] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Estoque</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Critical Items Horizontal Quick Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-rose-500/20">
            {criticalProducts.slice(0, 4).map((p) => {
              const stockPercentage = Math.min(100, Math.round((p.currentStock / (p.minStock * 2 || 1)) * 100));

              return (
                <div
                  key={p.id}
                  className="bg-[#121929] border border-[#22314a] hover:border-rose-500/50 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate" title={p.name}>
                      {p.name}
                    </span>
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded shrink-0">
                      {p.currentStock} {p.unit}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Mínimo: {p.minStock}</span>
                      {p.supplier && <span className="truncate max-w-[90px]">{p.supplier}</span>}
                    </div>

                    {/* Mini progress bar */}
                    <div className="w-full bg-[#1a2336] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.currentStock === 0 ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, stockPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Inline Increment / Decrement */}
                  {onAdjustStock && (
                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#1c273d]">
                      <span className="text-[10px] text-slate-500 font-medium">Ajuste rápido:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(p.id, -1)}
                          disabled={p.currentStock <= 0}
                          className="w-5 h-5 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-black text-[11px] flex items-center justify-center cursor-pointer disabled:opacity-30"
                          title="Dar baixa de 1"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(p.id, 1)}
                          className="w-5 h-5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-black text-[11px] flex items-center justify-center cursor-pointer"
                          title="Adicionar entrada de 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
