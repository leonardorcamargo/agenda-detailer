import React, { useState } from 'react';
import { StaffMember, ServiceOrder, StaffWorkLog } from '../types';
import { 
  Users, 
  Plus, 
  Phone, 
  Award, 
  DollarSign, 
  Car, 
  CheckCircle2, 
  TrendingUp, 
  Edit, 
  Trash2, 
  X, 
  UserPlus, 
  Search, 
  Clock, 
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Briefcase,
  Calendar,
  FileText,
  UserCheck,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';

interface StaffViewProps {
  staffList: StaffMember[];
  orders: ServiceOrder[];
  staffWorkLogs?: StaffWorkLog[];
  onAddStaff: (staff: StaffMember) => void;
  onUpdateStaff: (staff: StaffMember) => void;
  onRemoveStaff: (id: string) => void;
  onReassignOrder: (orderId: string, newDetailerName: string) => void;
  onOpenOSModal: (order: ServiceOrder) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  orders,
  staffWorkLogs = [],
  onAddStaff,
  onUpdateStaff,
  onRemoveStaff,
  onReassignOrder,
  onOpenOSModal,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'equipe' | 'distribuicao' | 'comissoes' | 'presencas'>('equipe');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo' | 'Férias'>('Todos');
  const [contractFilter, setContractFilter] = useState<'Todos' | 'Fixo / CLT' | 'Diarista (Diária Fixa)' | 'Empreiteiro / Freelancer (por Serviço)'>('Todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
  // Reassign Modal
  const [reassigningOrder, setReassigningOrder] = useState<ServiceOrder | null>(null);
  
  // Copied Pix Toast feedback
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    role: 'Polidor Especialista',
    contractType: 'Fixo / CLT',
    phone: '',
    commissionType: 'Porcentagem',
    commissionRate: 15,
    fixedCommissionValue: 30,
    dailyRate: 180,
    status: 'Ativo',
    specialties: ['Polimento'],
    pixKey: '',
    notes: '',
  });

  // Helper calculations per staff member
  const getStaffMetrics = (staff: StaffMember) => {
    // Orders assigned to this staff member
    const memberOrders = orders.filter((o) => o.assignedDetailer === staff.name);
    
    // Active orders in yard
    const activeOrders = memberOrders.filter((o) => o.status !== 'Finalizado');
    
    // Finished orders
    const finishedOrders = memberOrders.filter((o) => o.status === 'Finalizado');
    
    // Total revenue generated
    const totalRevenue = memberOrders.reduce((sum, o) => sum + o.totalValue, 0);
    
    // Total commission or pay earned
    let totalCommission = 0;
    if (staff.commissionType === 'Porcentagem') {
      totalCommission = memberOrders.reduce((sum, o) => sum + (o.totalValue * (staff.commissionRate / 100)), 0);
    } else if (staff.commissionType === 'Valor Fixo por OS' || staff.commissionType === 'Valor de Empreita por OS') {
      totalCommission = memberOrders.length * (staff.fixedCommissionValue || 0);
    } else if (staff.commissionType === 'Diária Fixa') {
      const daysWorked = memberOrders.length > 0 ? memberOrders.length : (staff.status === 'Ativo' ? 1 : 0);
      totalCommission = (staff.dailyRate || 0) * daysWorked;
    }

    return {
      totalOrdersCount: memberOrders.length,
      activeOrdersCount: activeOrders.length,
      finishedOrdersCount: finishedOrders.length,
      totalRevenue,
      totalCommission,
      activeOrdersList: activeOrders,
    };
  };

  // Overall KPIs
  const activeStaffCount = staffList.filter((s) => s.status === 'Ativo').length;
  
  const totalAssignedYardCars = orders.filter((o) => o.status !== 'Finalizado' && o.assignedDetailer).length;
  
  const totalEstimatedCommissions = staffList.reduce((acc, staff) => {
    const metrics = getStaffMetrics(staff);
    return acc + metrics.totalCommission;
  }, 0);

  const totalRevenueGenerated = orders.reduce((sum, o) => sum + o.totalValue, 0);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'Polidor Especialista',
      contractType: 'Fixo / CLT',
      phone: '',
      commissionType: 'Porcentagem',
      commissionRate: 15,
      fixedCommissionValue: 30,
      dailyRate: 180,
      status: 'Ativo',
      specialties: ['Polimento'],
      pixKey: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({ ...staff });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const contractType = formData.contractType || 'Fixo / CLT';
    let defaultRole = formData.role || 'Polidor Especialista';
    if (contractType === 'Diarista (Diária Fixa)' && !formData.role) defaultRole = 'Freelancer / Diarista';
    if (contractType === 'Empreiteiro / Freelancer (por Serviço)' && !formData.role) defaultRole = 'Empreiteiro';

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: formData.name.trim(),
        role: defaultRole,
        contractType,
        phone: formData.phone || '',
        commissionType: formData.commissionType || 'Porcentagem',
        commissionRate: Number(formData.commissionRate) || 0,
        fixedCommissionValue: Number(formData.fixedCommissionValue) || 0,
        dailyRate: Number(formData.dailyRate) || 0,
        status: formData.status || 'Ativo',
        specialties: formData.specialties || [],
        pixKey: formData.pixKey || '',
        notes: formData.notes || '',
      });
    } else {
      const newStaff: StaffMember = {
        id: 'st_' + Date.now(),
        name: formData.name.trim(),
        role: defaultRole,
        contractType,
        phone: formData.phone || '',
        commissionType: formData.commissionType || 'Porcentagem',
        commissionRate: Number(formData.commissionRate) || 0,
        fixedCommissionValue: Number(formData.fixedCommissionValue) || 0,
        dailyRate: Number(formData.dailyRate) || 0,
        status: formData.status || 'Ativo',
        specialties: formData.specialties || [],
        pixKey: formData.pixKey || '',
        notes: formData.notes || '',
      };
      onAddStaff(newStaff);
    }

    setIsModalOpen(false);
  };

  const handleToggleSpecialty = (spec: string) => {
    const currentSpecs = formData.specialties || [];
    if (currentSpecs.includes(spec)) {
      setFormData({ ...formData, specialties: currentSpecs.filter((s) => s !== spec) });
    } else {
      setFormData({ ...formData, specialties: [...currentSpecs, spec] });
    }
  };

  const handleCopyPix = (pix: string, id: string) => {
    if (!pix) return;
    navigator.clipboard.writeText(pix);
    setCopiedPixId(id);
    setTimeout(() => setCopiedPixId(null), 2000);
  };

  // Filtered staff
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
    const matchesContract = contractFilter === 'Todos' || (s.contractType || 'Fixo / CLT') === contractFilter;
    return matchesSearch && matchesStatus && matchesContract;
  });

  // Unassigned active orders
  const unassignedOrders = orders.filter((o) => o.status !== 'Finalizado' && !o.assignedDetailer);

  const ALL_SPECIALTIES = [
    'Vitrificação',
    'Polimento',
    'Higienização',
    'Lavagem Detalhada',
    'Lixamento de Faróis',
    'Descontaminação',
    'Motor',
    'Tratamento de Couro',
    'PPF / Insulfilm',
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Equipe Ativa</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {activeStaffCount} <span className="text-xs text-slate-400 font-normal">/ {staffList.length} total</span>
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Fixos & Informais / Diaristas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">No Pátio c/ Responsável</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {totalAssignedYardCars} <span className="text-xs text-slate-400 font-normal">veículos</span>
            </h3>
            <p className="text-[11px] text-blue-400 font-medium mt-1 flex items-center gap-1">
              <Car className="w-3 h-3" /> Distribuídos na equipe
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-600/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Faturamento Produzido</p>
            <h3 className="text-2xl font-black text-white mt-1">
              R$ {totalRevenueGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Soma das OSs atribuídas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Comissões & Diárias</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              R$ {totalEstimatedCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-amber-400/90 font-medium mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Comissões, Diárias & Empreitas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#23314a] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('equipe')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'equipe'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#151e30] text-slate-400 hover:text-white border border-[#23314a]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipe & Produtividade</span>
          </button>

          <button
            onClick={() => setActiveTab('distribuicao')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'distribuicao'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#151e30] text-slate-400 hover:text-white border border-[#23314a]'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Distribuição do Pátio</span>
            {unassignedOrders.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {unassignedOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('comissoes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'comissoes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#151e30] text-slate-400 hover:text-white border border-[#23314a]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Extrato de Pagamentos & Comissões</span>
          </button>

          <button
            onClick={() => setActiveTab('presencas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'presencas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#151e30] text-slate-400 hover:text-white border border-[#23314a]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Resumo de Presenças & Diárias</span>
          </button>
        </div>

        {/* Primary Add Staff Button */}
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Cadastrar Colaborador / Freelancer</span>
        </button>
      </div>

      {/* TAB 1: Equipe & Produtividade */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou função do profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#151e30] border border-[#23314a] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Contract / Regime Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1">Vínculo:</span>
              {[
                { label: 'Todos', val: 'Todos' },
                { label: 'Fixo / CLT', val: 'Fixo / CLT' },
                { label: 'Diarista', val: 'Diarista (Diária Fixa)' },
                { label: 'Empreiteiro', val: 'Empreiteiro / Freelancer (por Serviço)' },
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => setContractFilter(c.val as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    contractFilter === c.val
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-[#151e30] text-slate-400 hover:text-slate-200 border-[#23314a]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(['Todos', 'Ativo', 'Inativo', 'Férias'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    statusFilter === st
                      ? 'bg-[#23314a] text-blue-400 font-bold border-blue-500/40'
                      : 'bg-[#151e30] text-slate-400 hover:text-slate-200 border-[#23314a]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Members List / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredStaff.map((staff) => {
              const metrics = getStaffMetrics(staff);
              const isInformal = staff.contractType === 'Diarista (Diária Fixa)' || staff.contractType === 'Empreiteiro / Freelancer (por Serviço)';

              return (
                <div
                  key={staff.id}
                  className="bg-[#151e30] border border-[#23314a] hover:border-blue-500/40 rounded-2xl p-4 space-y-4 transition-all shadow-sm"
                >
                  {/* Top Info Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-md shrink-0 ${
                        isInformal 
                          ? 'bg-gradient-to-tr from-amber-600 to-orange-400 shadow-amber-900/30' 
                          : 'bg-gradient-to-tr from-blue-600 to-sky-400 shadow-blue-900/30'
                      }`}>
                        {staff.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white truncate">{staff.name}</h3>
                          
                          {/* Contract Type Badge */}
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 border flex items-center gap-1 ${
                              staff.contractType === 'Diarista (Diária Fixa)'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : staff.contractType === 'Empreiteiro / Freelancer (por Serviço)'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-slate-700/40 text-slate-300 border-slate-600/40'
                            }`}
                          >
                            {staff.contractType === 'Diarista (Diária Fixa)' && <Calendar className="w-3 h-3 text-amber-400" />}
                            {staff.contractType === 'Empreiteiro / Freelancer (por Serviço)' && <Briefcase className="w-3 h-3 text-purple-400" />}
                            {staff.contractType || 'Fixo / CLT'}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              staff.status === 'Ativo'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : staff.status === 'Férias'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                            }`}
                          >
                            {staff.status}
                          </span>
                        </div>
                        <p className="text-xs text-blue-400 font-medium mt-0.5">{staff.role}</p>
                        {staff.phone && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3 text-slate-500" /> {staff.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(staff)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-[#1f2a3e] transition-colors cursor-pointer"
                        title="Editar Colaborador"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover ${staff.name} da equipe?`)) {
                            onRemoveStaff(staff.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remover Colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Specialties Chips */}
                  {staff.specialties && staff.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {staff.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="bg-[#1e293b] text-slate-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border border-[#2e3e59]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Payment / Commission Rule Banner */}
                  <div className="bg-[#1b2538] border border-[#283854] rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Remuneração / Regra:
                    </span>
                    <span className="text-amber-300 font-bold">
                      {staff.commissionType === 'Porcentagem'
                        ? `${staff.commissionRate}% por OS`
                        : staff.commissionType === 'Diária Fixa'
                        ? `R$ ${(staff.dailyRate || 0).toFixed(2)} / Diária`
                        : staff.commissionType === 'Valor de Empreita por OS'
                        ? `R$ ${(staff.fixedCommissionValue || 0).toFixed(2)} por Empreita`
                        : `R$ ${(staff.fixedCommissionValue || 0).toFixed(2)} por OS`}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-[#111827] border border-[#1f293d] p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Ativos no Pátio</span>
                      <span className="text-base font-black text-blue-400 block mt-0.5">
                        {metrics.activeOrdersCount}
                      </span>
                    </div>

                    <div className="bg-[#111827] border border-[#1f293d] p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Faturamento</span>
                      <span className="text-xs font-black text-emerald-400 block mt-1 truncate">
                        R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="bg-[#111827] border border-[#1f293d] p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">A Pagar</span>
                      <span className="text-xs font-black text-amber-400 block mt-1 truncate">
                        R$ {metrics.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Active Cars assigned to staff preview */}
                  {metrics.activeOrdersList.length > 0 && (
                    <div className="border-t border-[#23314a] pt-3 space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                        <span>Veículos atualmente com {staff.name.split(' ')[0]}:</span>
                        <span className="text-blue-400">{metrics.activeOrdersList.length} no pátio</span>
                      </p>

                      <div className="space-y-1.5">
                        {metrics.activeOrdersList.map((order) => (
                          <div
                            key={order.id}
                            onClick={() => onOpenOSModal(order)}
                            className="bg-[#111827] hover:bg-[#192438] border border-[#1f293d] hover:border-blue-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all cursor-pointer group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-blue-400">OS #{order.osNumber}</span>
                                <span className="text-slate-300 font-bold truncate">
                                  {order.brand} {order.model}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Placa: {order.plate}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  order.status === 'Em Execução'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : order.status === 'Pronto para Entrega'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {order.status}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PIX Key copy footer if present */}
                  {staff.pixKey && (
                    <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">PIX: <strong className="text-slate-200 font-mono">{staff.pixKey}</strong></span>
                      <button
                        onClick={() => handleCopyPix(staff.pixKey!, staff.id)}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        {copiedPixId === staff.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> <span>Copiar Chave</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Distribuição do Pátio */}
      {activeTab === 'distribuicao' && (
        <div className="space-y-6">
          {/* Warning / Notice for Unassigned Cars */}
          {unassignedOrders.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    {unassignedOrders.length} {unassignedOrders.length === 1 ? 'veículo sem profissional responsável' : 'veículos sem profissional responsável'}
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Atribua um detailer ou freelancer da equipe para acompanhar a execução e garantir o pagamento correto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Matrix of Detailers & assigned active cars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Unassigned Box */}
            <div className="bg-[#151e30] border-2 border-dashed border-amber-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="font-bold text-amber-300 text-sm">Sem Profissional Atribuído</h3>
                </div>
                <span className="bg-amber-500/20 text-amber-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {unassignedOrders.length}
                </span>
              </div>

              {unassignedOrders.length > 0 ? (
                <div className="space-y-2">
                  {unassignedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[#111827] border border-amber-500/30 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-amber-400">OS #{order.osNumber}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{order.plate}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-xs">{order.brand} {order.model}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{order.color}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]">
                        <span className="font-bold text-xs text-white">
                          R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>

                        <button
                          onClick={() => setReassigningOrder(order)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Atribuir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Todos os veículos no pátio possuem responsável! 🎉
                </div>
              )}
            </div>

            {/* Assigned Detailers Columns */}
            {staffList.filter((s) => s.status === 'Ativo').map((staff) => {
              const activeStaffOrders = orders.filter(
                (o) => o.assignedDetailer === staff.name && o.status !== 'Finalizado'
              );

              return (
                <div
                  key={staff.id}
                  className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#23314a] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-white text-xs leading-tight">{staff.name}</h3>
                          {staff.contractType === 'Diarista (Diária Fixa)' && <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">Diarista</span>}
                          {staff.contractType === 'Empreiteiro / Freelancer (por Serviço)' && <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded">Empreita</span>}
                        </div>
                        <p className="text-[10px] text-slate-400">{staff.role}</p>
                      </div>
                    </div>

                    <span className="bg-blue-600/20 text-blue-400 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30">
                      {activeStaffOrders.length}
                    </span>
                  </div>

                  {activeStaffOrders.length > 0 ? (
                    <div className="space-y-2">
                      {activeStaffOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#111827] border border-[#1f293d] hover:border-blue-500/40 rounded-xl p-3 space-y-2 transition-all"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-blue-400">OS #{order.osNumber}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{order.plate}</span>
                          </div>

                          <div>
                            <h4 className="font-bold text-white text-xs">{order.brand} {order.model}</h4>
                            <span
                              className={`inline-block text-[9px] font-bold px-2 py-0.2 rounded-md mt-1 ${
                                order.status === 'Em Execução'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : order.status === 'Pronto para Entrega'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#1f293d] text-xs">
                            <span className="font-extrabold text-slate-200">
                              R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>

                            <button
                              onClick={() => setReassigningOrder(order)}
                              className="text-slate-400 hover:text-blue-400 text-[11px] flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Reatribuir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Nenhum veículo em andamento com este profissional no momento.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Extrato de Comissões & Diárias */}
      {activeTab === 'comissoes' && (
        <div className="space-y-4">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 sm:p-5 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" /> Relatório Detalhado de Comissões, Diárias & Empreitas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cálculo automático baseado no vínculo do colaborador (Fixos CLT, Diaristas e Empreiteiros informais).
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-[#23314a] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-3">OS</th>
                  <th className="py-3 px-3">Veículo / Placa</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Profissional / Vínculo</th>
                  <th className="py-3 px-3 text-right">Valor OS</th>
                  <th className="py-3 px-3 text-center">Regra Aplicada</th>
                  <th className="py-3 px-3 text-right">Valor a Pagar (R$)</th>
                  <th className="py-3 px-3 text-center">Status OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {orders.map((order) => {
                  const assignedStaff = staffList.find((s) => s.name === order.assignedDetailer);
                  
                  let commissionVal = 0;
                  let ruleText = 'Sem regra';

                  if (assignedStaff) {
                    if (assignedStaff.commissionType === 'Porcentagem') {
                      commissionVal = order.totalValue * (assignedStaff.commissionRate / 100);
                      ruleText = `${assignedStaff.commissionRate}%`;
                    } else if (assignedStaff.commissionType === 'Diária Fixa') {
                      commissionVal = assignedStaff.dailyRate || 0;
                      ruleText = `Diária R$ ${assignedStaff.dailyRate}`;
                    } else if (assignedStaff.commissionType === 'Valor de Empreita por OS') {
                      commissionVal = assignedStaff.fixedCommissionValue || 0;
                      ruleText = `Empreita R$ ${assignedStaff.fixedCommissionValue}`;
                    } else {
                      commissionVal = assignedStaff.fixedCommissionValue || 0;
                      ruleText = `Fixo R$ ${assignedStaff.fixedCommissionValue}`;
                    }
                  } else if (order.assignedDetailer) {
                    commissionVal = order.totalValue * 0.15; // default 15% fallback
                    ruleText = '15% (Padrão)';
                  }

                  return (
                    <tr key={order.id} className="hover:bg-[#1a2436] transition-colors">
                      <td className="py-3.5 px-3 font-extrabold text-blue-400">
                        OS #{order.osNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block">{order.brand} {order.model}</span>
                        <span className="text-[10px] font-mono text-slate-400">{order.plate}</span>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-300">
                        {order.clientName}
                      </td>

                      <td className="py-3.5 px-3">
                        {order.assignedDetailer ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] flex items-center justify-center shrink-0">
                                {order.assignedDetailer.charAt(0)}
                              </span>
                              <span>{order.assignedDetailer}</span>
                            </div>
                            {assignedStaff?.contractType && (
                              <span className="text-[10px] text-amber-300/80 font-medium block pl-6">
                                {assignedStaff.contractType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">Nenhum atribuído</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-white">
                        R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="bg-[#1f2d42] text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                          {ruleText}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-black text-amber-400">
                        R$ {commissionVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'Finalizado'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Resumo de Presenças & Diárias Trabalhadas */}
      {activeTab === 'presencas' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Presenças Registradas</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">
                  {staffWorkLogs.filter((l) => l.status === 'Presente' || l.status === 'Meio Período').length}
                </h3>
                <p className="text-[11px] text-emerald-400/80 font-medium mt-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Dias trabalhados
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Faltas Registradas</p>
                <h3 className="text-2xl font-black text-rose-400 mt-1">
                  {staffWorkLogs.filter((l) => l.status === 'Falta').length}
                </h3>
                <p className="text-[11px] text-rose-400/80 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Ausências sem diária
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Folgas Programadas</p>
                <h3 className="text-2xl font-black text-blue-400 mt-1">
                  {staffWorkLogs.filter((l) => l.status === 'Folga').length}
                </h3>
                <p className="text-[11px] text-blue-400/80 font-medium mt-1 flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3" /> Escalas de descanso
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total em Diárias Pagas</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">
                  R$ {staffWorkLogs.reduce((sum, l) => sum + (l.dailyRateCharged || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-amber-400/80 font-medium mt-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Valor total acumulado
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Table: Resumo por Colaborador */}
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" /> Resumo do Mês: Dias Trabalhados, Faltas & Folgas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidado da frequência da equipe e cálculo automatizado de diárias por colaborador.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-[#23314a] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-3">Colaborador</th>
                    <th className="py-3 px-3">Vínculo</th>
                    <th className="py-3 px-3 text-center">Presenças</th>
                    <th className="py-3 px-3 text-center">Faltas</th>
                    <th className="py-3 px-3 text-center">Folgas</th>
                    <th className="py-3 px-3 text-right">Valor Diária</th>
                    <th className="py-3 px-3 text-right">Total Acumulado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {staffList.map((staff) => {
                    const logs = staffWorkLogs.filter((l) => l.staffId === staff.id || l.staffName === staff.name);
                    const presencesCount = logs.filter((l) => l.status === 'Presente' || l.status === 'Meio Período').length;
                    const faltasCount = logs.filter((l) => l.status === 'Falta').length;
                    const folgasCount = logs.filter((l) => l.status === 'Folga').length;
                    const totalDiariasVal = logs.reduce((sum, l) => sum + (l.dailyRateCharged || 0), 0);

                    return (
                      <tr key={staff.id} className="hover:bg-[#1a2436] transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-[10px] flex items-center justify-center font-black">
                            {staff.name.charAt(0)}
                          </div>
                          <span>{staff.name}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[10px] bg-[#1f2d42] text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                            {staff.contractType || 'Fixo / CLT'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="bg-emerald-500/20 text-emerald-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            {presencesCount} dias
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            faltasCount > 0 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : 'text-slate-500'
                          }`}>
                            {faltasCount}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            folgasCount > 0 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'text-slate-500'
                          }`}>
                            {folgasCount}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right text-slate-300 font-medium">
                          {staff.dailyRate ? `R$ ${staff.dailyRate.toFixed(2)}` : 'Salário Fixo'}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                          R$ {totalDiariasVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feed de Histórico de Lançamentos */}
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#23314a] pb-2.5">
              <Clock className="w-4 h-4 text-blue-400" /> Histórico de Lançamentos Diários de Mão de Obra
            </h4>

            {staffWorkLogs.length > 0 ? (
              <div className="divide-y divide-[#1f293d]">
                {staffWorkLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-[11px] bg-[#111827] px-2 py-1 rounded-md border border-[#23314a]">
                        {log.date}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{log.staffName}</span>
                        {log.notes && <span className="text-[11px] text-slate-400 italic">{log.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          log.status === 'Presente'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.status === 'Meio Período'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.status === 'Folga'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="font-bold text-amber-400">
                        R$ {(log.dailyRateCharged || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-500 text-xs">
                Nenhum lançamento de presença ou folga registrado até o momento.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#23314a] flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingStaff ? 'Editar Colaborador' : 'Novo Colaborador / Freelancer'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mateus (Diarista) ou Carlos Eduardo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Vínculo / Tipo de Contrato (Informal vs Fixo) */}
              <div className="bg-[#111827] border border-[#23314a] p-3.5 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Vínculo / Regime de Trabalho
                </label>
                <p className="text-[11px] text-slate-400">
                  Defina se o profissional é fixo da estética ou prestador informal (diarista/empreita).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      contractType: 'Fixo / CLT',
                      commissionType: 'Porcentagem'
                    })}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                      (formData.contractType || 'Fixo / CLT') === 'Fixo / CLT'
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/60 shadow-sm'
                        : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                    }`}
                  >
                    <span className="block font-bold">Fixo / CLT</span>
                    <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Mensalista fixo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      contractType: 'Diarista (Diária Fixa)',
                      commissionType: 'Diária Fixa',
                      dailyRate: formData.dailyRate || 180,
                      role: 'Freelancer / Diarista'
                    })}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                      formData.contractType === 'Diarista (Diária Fixa)'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                    }`}
                  >
                    <span className="block font-bold">Diarista</span>
                    <span className="text-[10px] font-normal text-amber-300/80 block mt-0.5">Diária por dia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      contractType: 'Empreiteiro / Freelancer (por Serviço)',
                      commissionType: 'Valor de Empreita por OS',
                      fixedCommissionValue: formData.fixedCommissionValue || 200,
                      role: 'Empreiteiro'
                    })}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                      formData.contractType === 'Empreiteiro / Freelancer (por Serviço)'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                        : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                    }`}
                  >
                    <span className="block font-bold">Empreiteiro</span>
                    <span className="text-[10px] font-normal text-purple-300/80 block mt-0.5">Acordo por serviço</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Função / Cargo
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Master Detailer">Master Detailer</option>
                    <option value="Polidor Especialista">Polidor Especialista</option>
                    <option value="Higienizador">Higienizador</option>
                    <option value="Lavador Técnico">Lavador Técnico</option>
                    <option value="Freelancer / Diarista">Freelancer / Diarista</option>
                    <option value="Empreiteiro">Empreiteiro</option>
                    <option value="Ajudante / Aprendiz">Ajudante / Aprendiz</option>
                    <option value="Gerente de Pátio">Gerente de Pátio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Remuneration Rule Input */}
              <div className="bg-[#111827] border border-[#23314a] p-3.5 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Forma de Pagamento / Comissão
                </label>

                {formData.contractType === 'Diarista (Diária Fixa)' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Valor da Diária Fixa (R$/dia)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber-400">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="180,00"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                        className="w-full bg-[#151e30] border border-[#23314a] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      O pagamento será calculado por diária trabalhada no pátio.
                    </p>
                  </div>
                ) : formData.contractType === 'Empreiteiro / Freelancer (por Serviço)' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Valor da Empreita por Serviço / OS Fechada (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-purple-400">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="250,00"
                        value={formData.fixedCommissionValue}
                        onChange={(e) => setFormData({ ...formData, fixedCommissionValue: Number(e.target.value) })}
                        className="w-full bg-[#151e30] border border-[#23314a] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Valor fixo acordado previamente para a execução completa de cada veículo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, commissionType: 'Porcentagem' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.commissionType === 'Porcentagem'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                        }`}
                      >
                        Porcentagem (%)
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, commissionType: 'Valor Fixo por OS' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.commissionType === 'Valor Fixo por OS'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                        }`}
                      >
                        Valor Fixo por OS (R$)
                      </button>
                    </div>

                    {formData.commissionType === 'Porcentagem' ? (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Porcentagem da OS (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.commissionRate}
                            onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                            className="w-full bg-[#151e30] border border-[#23314a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute right-3.5 top-2 text-xs font-bold text-amber-400">%</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Valor Fixo por OS Finalizada (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fixedCommissionValue}
                          onChange={(e) => setFormData({ ...formData, fixedCommissionValue: Number(e.target.value) })}
                          className="w-full bg-[#151e30] border border-[#23314a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Status & Pix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status Atual
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Chave PIX (Para Pagamento)
                  </label>
                  <input
                    type="text"
                    placeholder="CPF, e-mail ou celular"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Specialties Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Especialidades do Profissional
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SPECIALTIES.map((spec) => {
                    const isSelected = (formData.specialties || []).includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => handleToggleSpecialty(spec)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/60'
                            : 'bg-[#111827] text-slate-400 border-[#23314a] hover:text-slate-200'
                        }`}
                      >
                        {spec} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#111827] hover:bg-[#1a2333] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/40 cursor-pointer"
                >
                  {editingStaff ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassigningOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <h3 className="font-bold text-white text-base">
                Atribuir OS #{reassigningOrder.osNumber}
              </h3>
              <button
                onClick={() => setReassigningOrder(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-300 font-bold">
                {reassigningOrder.brand} {reassigningOrder.model} ({reassigningOrder.plate})
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Selecione qual profissional (fixo, diarista ou empreiteiro) será responsável pela execução deste veículo:
              </p>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {staffList.filter((s) => s.status === 'Ativo').map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => {
                    onReassignOrder(reassigningOrder.id, staff.name);
                    setReassigningOrder(null);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                    reassigningOrder.assignedDetailer === staff.name
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 font-bold'
                      : 'bg-[#111827] text-slate-300 border-[#1f293d] hover:bg-[#1a2436]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 font-extrabold text-xs flex items-center justify-center">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">{staff.name}</span>
                      <span className="text-[10px] text-amber-300/80">{staff.contractType || 'Fixo / CLT'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{staff.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
