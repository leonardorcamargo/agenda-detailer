import React, { useState } from 'react';
import { ServiceOrder, OSStatus, PaymentMethod } from '../types';
import { DETAILERS_LIST } from '../data/mockData';
import { 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  Search,
  User,
  DollarSign,
  CheckCircle2
} from 'lucide-react';

interface KanbanViewProps {
  orders: ServiceOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OSStatus) => void;
  onUpdateDetailer: (orderId: string, detailer: string) => void;
  onOpenOSModal: (order: ServiceOrder) => void;
  onNewOSClick: () => void;
  onSendWhatsApp: (order: ServiceOrder) => void;
  onUpdatePaymentStatus?: (orderId: string, status: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado') => void;
  onUpdatePaymentMethod?: (orderId: string, method: PaymentMethod) => void;
}

const STAGES: { id: OSStatus; label: string }[] = [
  { id: 'Aguardando', label: 'AGUARDANDO' },
  { id: 'Em Execução', label: 'EM EXECUÇÃO' },
  { id: 'Pronto para Entrega', label: 'PRONTO PARA ENTREGA' },
  { id: 'Finalizado', label: 'FINALIZADO' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdateDetailer,
  onOpenOSModal,
  onNewOSClick,
  onSendWhatsApp,
  onUpdatePaymentStatus,
  onUpdatePaymentMethod,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetailerFilter, setSelectedDetailerFilter] = useState<string>('Todos');

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.osNumber).includes(searchTerm);

    const matchesDetailer =
      selectedDetailerFilter === 'Todos' || o.assignedDetailer === selectedDetailerFilter;

    return matchesSearch && matchesDetailer;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Pátio</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arraste os cartões entre as colunas ou use as setas para avançar a etapa.
          </p>
        </div>

        {/* Search & Detailer Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, modelo, cliente..."
              className="bg-[#141c2b] border border-[#23314a] text-white text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>

          <select
            value={selectedDetailerFilter}
            onChange={(e) => setSelectedDetailerFilter(e.target.value)}
            className="bg-[#141c2b] border border-[#23314a] text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos os Detailers</option>
            {DETAILERS_LIST.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vertical Stages List (Matching Reference Images) */}
      <div className="space-y-5">
        {STAGES.map((stage) => {
          const stageOrders = filteredOrders.filter((o) => o.status === stage.id);

          return (
            <div
              key={stage.id}
              className="bg-[#121929] border border-[#1f2c42] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg"
            >
              {/* Stage Title and Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase">
                  {stage.label}
                </h3>
                <span className="bg-[#1a2436] text-slate-300 border border-[#23334d] font-bold text-xs px-3 py-0.5 rounded-full">
                  {stageOrders.length}
                </span>
              </div>

              {/* Stage Cards or Empty State */}
              {stageOrders.length > 0 ? (
                stage.id === 'Finalizado' ? (
                  <div className="space-y-2">
                    {stageOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-[#172133] border border-[#263754] hover:border-blue-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all text-xs shadow-sm group"
                      >
                        {/* Left: OS #, Car Model & Plate */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-extrabold text-blue-400 shrink-0">
                            OS #{order.osNumber}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                            {order.brand} {order.model}
                          </span>
                          <span className="text-slate-400 font-mono font-semibold uppercase text-[11px] hidden sm:inline shrink-0">
                            ({order.plate})
                          </span>
                        </div>

                        {/* Right: Service Value & Action buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-slate-200 text-sm">
                            R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* WhatsApp */}
                            <button
                              onClick={() => onSendWhatsApp(order)}
                              className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Enviar mensagem WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {/* View OS Details */}
                            <button
                              onClick={() => onOpenOSModal(order)}
                              className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Back Arrow */}
                            <button
                              onClick={() => {
                                const prevIdx = STAGES.findIndex((s) => s.id === stage.id) - 1;
                                if (prevIdx >= 0) onUpdateOrderStatus(order.id, STAGES[prevIdx].id);
                              }}
                              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#23334d] transition-colors cursor-pointer"
                              title="Voltar etapa"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {stageOrders.map((order) => {
                      const servicesSummary = order.services.length > 0
                        ? order.services.map((s) => s.name).join(', ')
                        : order.customDescription || 'Sem serviços especificados';

                      return (
                        <div
                          key={order.id}
                          className="bg-[#172133] border border-[#263754] hover:border-blue-500/50 rounded-2xl p-4 space-y-2.5 transition-all shadow-sm group relative"
                        >
                          {/* OS Header & Plate */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-blue-400">
                              OS #{order.osNumber}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                              {order.plate}
                            </span>
                          </div>

                          {/* Vehicle & Services */}
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                              {order.brand} {order.model}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {order.color} · {servicesSummary}
                            </p>
                          </div>

                          {/* Payment Quick Badge / Toggle */}
                          <div className="flex items-center justify-between text-xs bg-[#111827] px-2.5 py-1.5 rounded-xl border border-[#23314a]">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              Pagamento:
                            </span>
                            <select
                              value={order.paymentStatus}
                              onChange={(e: any) => onUpdatePaymentStatus?.(order.id, e.target.value)}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${
                                order.paymentStatus === 'Pago'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : order.paymentStatus === 'Fiado'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="Pendente" className="bg-[#121929] text-amber-400">Pendente</option>
                              <option value="Pago" className="bg-[#121929] text-emerald-400">Pago ({order.paymentMethod})</option>
                              <option value="Parcial" className="bg-[#121929] text-blue-400">Parcial</option>
                              <option value="Fiado" className="bg-[#121929] text-purple-300">Fiado / A Prazo</option>
                            </select>
                          </div>

                          {/* Price & Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#23334d]">
                            <span className="text-base font-extrabold text-white">
                              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* WhatsApp */}
                              <button
                                onClick={() => onSendWhatsApp(order)}
                                className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-xl hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title="Enviar mensagem WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              {/* View OS Modal */}
                              <button
                                onClick={() => onOpenOSModal(order)}
                                className="text-slate-400 hover:text-blue-400 p-1.5 rounded-xl hover:bg-blue-500/10 transition-colors cursor-pointer"
                                title="Ver Detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Back Arrow */}
                              {stage.id !== 'Aguardando' && (
                                <button
                                  onClick={() => {
                                    const prevIdx = STAGES.findIndex((s) => s.id === stage.id) - 1;
                                    if (prevIdx >= 0) onUpdateOrderStatus(order.id, STAGES[prevIdx].id);
                                  }}
                                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#23334d] transition-colors cursor-pointer"
                                  title="Voltar etapa"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              )}

                              {/* Forward Arrow / Finalize Button */}
                              {stage.id !== 'Finalizado' && (
                                <button
                                  onClick={() => {
                                    const nextIdx = STAGES.findIndex((s) => s.id === stage.id) + 1;
                                    if (nextIdx < STAGES.length) onUpdateOrderStatus(order.id, STAGES[nextIdx].id);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all cursor-pointer border border-blue-400/50 shadow-md shadow-blue-900/40 animate-pulse-glow"
                                  title={stage.id === 'Pronto para Entrega' ? 'Finalizar e Entregar OS' : 'Avançar etapa'}
                                >
                                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="border border-dashed border-[#23314a] rounded-2xl py-10 flex items-center justify-center text-slate-500 text-xs sm:text-sm font-medium">
                  Nenhum veículo aqui
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
