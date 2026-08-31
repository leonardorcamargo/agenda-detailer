import React, { useState } from 'react';
import { brazilDate } from '../lib/financialPeriod';
import { StaffAttendance } from './StaffAttendance';
import { supabase } from '../lib/supabase';
import { 
  Appointment, 
  DailyCalendarNote, 
  StaffWorkLog, 
  StaffMember, 
  ServiceOrder, 
  ServiceItem,
  PaymentMethod
} from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Car, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  Check, 
  Trash2, 
  Edit3, 
  Users, 
  DollarSign, 
  StickyNote, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  CalendarDays,
  Tag,
  Search,
  Filter
} from 'lucide-react';

interface CalendarViewProps {
  attendanceBusy: boolean;
  canManageAttendance: boolean;
  canDeleteAttendance: boolean;
  companyId: string;
  initialAttendanceDate?: string;
  appointments: Appointment[];
  dailyNotes: DailyCalendarNote[];
  staffWorkLogs: StaffWorkLog[];
  staffList: StaffMember[];
  servicesCatalog: ServiceItem[];
  orders: ServiceOrder[];
  onAddAppointment: (apt: Appointment) => void;
  onUpdateAppointment: (apt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onConvertAppointmentToOS: (apt: Appointment) => void;
  onAddDailyNote: (note: DailyCalendarNote) => void;
  onDeleteDailyNote: (id: string) => void;
  onSaveStaffWorkLog: (log: StaffWorkLog) => Promise<boolean>;
  onDeleteStaffWorkLog: (id: string) => Promise<boolean>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  attendanceBusy, canManageAttendance, canDeleteAttendance,
  companyId,
  initialAttendanceDate,
  appointments,
  dailyNotes,
  staffWorkLogs,
  staffList,
  servicesCatalog,
  orders,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onConvertAppointmentToOS,
  onAddDailyNote,
  onDeleteDailyNote,
  onSaveStaffWorkLog,
  onDeleteStaffWorkLog,
}) => {
  // Calendar navigation state (Year, Month 0-indexed)
  const todayISO = brazilDate(new Date())!;
  const initialDay = initialAttendanceDate || todayISO;
  const [currentYear, setCurrentYear] = useState<number>(Number(initialDay.slice(0, 4)));
  const [currentMonth, setCurrentMonth] = useState<number>(Number(initialDay.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState<string>(initialDay);

  // Selected Date Panel sub-tab
  const [dateDetailTab, setDateDetailTab] = useState<'agendamentos' | 'observacoes' | 'presenca'>(initialAttendanceDate ? 'presenca' : 'agendamentos');

  // Modals state
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Filter for appointment search
  const [searchTerm, setSearchTerm] = useState('');
  const [plateLookupMessage, setPlateLookupMessage] = useState<string | null>(null);
  const [isPlateLookupLoading, setIsPlateLookupLoading] = useState(false);

  // Form states
  const [aptForm, setAptForm] = useState<Partial<Appointment>>({
    clientName: '',
    clientPhone: '',
    vehicleModel: '',
    vehiclePlate: '',
    services: [],
    date: selectedDate,
    time: '09:00',
    estimatedDurationHours: 2,
    assignedDetailer: staffList[0]?.name || '',
    notes: '',
    status: 'Agendado',
    estimatedValue: 250,
    paymentMethod: 'Pix',
    paymentStatus: 'Pendente',
  });

  const [noteForm, setNoteForm] = useState<{ note: string; category: DailyCalendarNote['category'] }>({
    note: '',
    category: 'Geral',
  });

  const [customAptServiceName, setCustomAptServiceName] = useState('');
  const [customAptServicePrice, setCustomAptServicePrice] = useState<number | ''>('');

  const handleLookupAppointmentPlate = async () => {
    const cleanPlate = (aptForm.vehiclePlate || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!cleanPlate) {
      setPlateLookupMessage('Informe uma placa para consultar.');
      return;
    }

    if (!companyId) {
      setPlateLookupMessage('Empresa não identificada.');
      return;
    }

    setIsPlateLookupLoading(true);
    setPlateLookupMessage(null);

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('plate, brand, model, customer:customers(name, phone)')
      .eq('company_id', companyId)
      .eq('plate', cleanPlate)
      .eq('active', true)
      .maybeSingle();

    setIsPlateLookupLoading(false);

    if (error) {
      console.error('Erro ao consultar placa no agendamento.', error);
      setPlateLookupMessage('Não foi possível consultar a placa agora.');
      return;
    }

    if (!vehicle) {
      setAptForm({
        ...aptForm,
        vehiclePlate: cleanPlate,
      });
      setPlateLookupMessage('Veículo não encontrado. Preencha os dados manualmente.');
      return;
    }

    const customer = Array.isArray(vehicle.customer)
      ? vehicle.customer[0]
      : vehicle.customer;

    setAptForm({
      ...aptForm,
      vehiclePlate: vehicle.plate ?? cleanPlate,
      vehicleModel: [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
      clientName: customer?.name ?? '',
      clientPhone: customer?.phone ?? '',
    });

    setPlateLookupMessage('Veículo e cliente encontrados no cadastro.');
  };

  const handleAddCustomAptService = () => {
    if (!customAptServiceName.trim()) return;
    const priceVal = typeof customAptServicePrice === 'number' ? customAptServicePrice : 0;
    const displayName = `${customAptServiceName.trim()} (R$ ${priceVal})`;
    const currentServices = aptForm.services || [];
    const newServices = [...currentServices, displayName];

    const sumCatalog = newServices.reduce((acc, sName) => {
      const found = servicesCatalog.find((x) => x.name === sName);
      if (found) return acc + found.defaultPrice;
      const match = sName.match(/\(R\$\s*(\d+(?:\.\d+)?)\)/);
      return acc + (match ? parseFloat(match[1]) : 0);
    }, 0);

    setAptForm({
      ...aptForm,
      services: newServices,
      estimatedValue: sumCatalog || ((aptForm.estimatedValue || 0) + priceVal),
    });

    setCustomAptServiceName('');
    setCustomAptServicePrice('');
  };

  // Calendar Math Helpers
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Previous month fill days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatMonthYearString = () => `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const formatISO = (year: number, monthZeroIdx: number, dayNum: number) => {
    const m = String(monthZeroIdx + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Open Add Appointment Modal
  const handleOpenAddApt = (dateStr?: string) => {
    setEditingApt(null);
    setPlateLookupMessage(null);
    setAptForm({
      clientName: '',
      clientPhone: '',
      vehicleModel: '',
      vehiclePlate: '',
      services: [servicesCatalog[0]?.name || 'Lavagem Detalhada'],
      date: dateStr || selectedDate,
      time: '09:00',
      estimatedDurationHours: 2,
      assignedDetailer: staffList[0]?.name || '',
      notes: '',
      status: 'Agendado',
      estimatedValue: servicesCatalog[0]?.defaultPrice || 200,
      paymentMethod: 'Pix',
      paymentStatus: 'Pendente',
    });
    setIsAptModalOpen(true);
  };

  const handleOpenEditApt = (apt: Appointment) => {
    setEditingApt(apt);
    setAptForm({ 
      ...apt,
      paymentMethod: apt.paymentMethod || 'Pix',
      paymentStatus: apt.paymentStatus || 'Pendente',
    });
    setIsAptModalOpen(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptForm.clientName?.trim() || !aptForm.vehicleModel?.trim()) return;

    if (editingApt) {
      onUpdateAppointment({
        ...editingApt,
        clientName: aptForm.clientName.trim(),
        clientPhone: aptForm.clientPhone || '',
        vehicleModel: aptForm.vehicleModel.trim(),
        vehiclePlate: (aptForm.vehiclePlate || '').toUpperCase(),
        services: aptForm.services && aptForm.services.length > 0 ? aptForm.services : ['Serviço Detalhado'],
        date: aptForm.date || selectedDate,
        time: aptForm.time || '09:00',
        estimatedDurationHours: Number(aptForm.estimatedDurationHours) || 2,
        assignedDetailer: aptForm.assignedDetailer || '',
        notes: aptForm.notes || '',
        status: aptForm.status || 'Agendado',
        estimatedValue: Number(aptForm.estimatedValue) || 0,
        paymentMethod: aptForm.paymentMethod || 'Pix',
        paymentStatus: aptForm.paymentStatus || 'Pendente',
      });
    } else {
      const newApt: Appointment = {
        id: 'apt-' + Date.now(),
        clientName: aptForm.clientName.trim(),
        clientPhone: aptForm.clientPhone || '',
        vehicleModel: aptForm.vehicleModel.trim(),
        vehiclePlate: (aptForm.vehiclePlate || '').toUpperCase(),
        services: aptForm.services && aptForm.services.length > 0 ? aptForm.services : ['Serviço Detalhado'],
        date: aptForm.date || selectedDate,
        time: aptForm.time || '09:00',
        estimatedDurationHours: Number(aptForm.estimatedDurationHours) || 2,
        assignedDetailer: aptForm.assignedDetailer || '',
        notes: aptForm.notes || '',
        status: aptForm.status || 'Agendado',
        estimatedValue: Number(aptForm.estimatedValue) || 0,
        paymentMethod: aptForm.paymentMethod || 'Pix',
        paymentStatus: aptForm.paymentStatus || 'Pendente',
      };
      onAddAppointment(newApt);
    }

    setIsAptModalOpen(false);
  };

  // Add Note Handler
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.note.trim()) return;

    const newNote: DailyCalendarNote = {
      id: 'note-' + Date.now(),
      date: selectedDate,
      note: noteForm.note.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: noteForm.category || 'Geral',
    };

    onAddDailyNote(newNote);
    setNoteForm({ note: '', category: 'Geral' });
    setIsNoteModalOpen(false);
  };

  // WhatsApp Message Launcher
  const handleSendWhatsAppApt = (apt: Appointment) => {
    const cleanPhone = apt.clientPhone.replace(/\D/g, '');
    if (!cleanPhone) return;

    const [yyyy, mm, dd] = apt.date.split('-');
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    const text = `Olá, *${apt.clientName}*! Tudo bem? 🚗✨\n\nConfirmamos o seu agendamento no *Auto Shine Studio*:\n\n📅 *Data:* ${formattedDate} às ${apt.time}h\n🚘 *Veículo:* ${apt.vehicleModel} (${apt.vehiclePlate || 'A definir'})\n🛠 *Serviços:* ${apt.services.join(', ')}\n👤 *Responsável:* ${apt.assignedDetailer || 'Equipe'}\n\nSe precisar alterar o horário, nos avise por aqui!`;

    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Data helpers for the selected date
  const selectedDateAppointments = appointments.filter((a) => a.date === selectedDate);
  const selectedDateNotes = dailyNotes.filter((n) => n.date === selectedDate);
  const selectedDateStaffLogs = staffWorkLogs.filter((w) => w.date === selectedDate);
  const selectedDateOrders = orders.filter((o) => o.createdAt.startsWith(selectedDate) || o.deliveryEstimatedDate === selectedDate);

  // Month Statistics
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthAppointments = appointments.filter((a) => a.date.startsWith(monthPrefix));
  const monthTotalRevenueEstimated = monthAppointments.reduce((sum, a) => sum + a.estimatedValue, 0);
  const monthStaffWorkLogs = staffWorkLogs.filter((w) => w.date.startsWith(monthPrefix));
  const monthTotalDiariasPaid = monthStaffWorkLogs.reduce((sum, w) => sum + (w.dailyRateCharged || 0), 0);

  // Build Grid Days
  const calendarGrid = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = formatISO(prevY, prevM, dayNum);
    calendarGrid.push({ dayNum, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatISO(currentYear, currentMonth, d);
    calendarGrid.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete 35 or 42 cells
  const remaining = (7 - (calendarGrid.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = formatISO(nextY, nextM, i);
    calendarGrid.push({ dayNum: i, dateStr, isCurrentMonth: false });
  }

  // Formatted Selected Date Label
  const getFormattedSelectedDate = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeekName = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dt.getDay()];
    return `${dayOfWeekName}, ${d} de ${MONTH_NAMES[m - 1]} de ${y}`;
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Agendamentos no Mês</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {monthAppointments.length} <span className="text-xs text-slate-400 font-normal">serviços</span>
            </h3>
            <p className="text-[11px] text-blue-400 font-medium mt-1 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> {MONTH_NAMES[currentMonth]} {currentYear}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Faturamento Previsto</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              R$ {monthTotalRevenueEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Total agendado
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Diárias / Presenças Registradas</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {monthStaffWorkLogs.length} <span className="text-xs text-slate-400 font-normal">registros</span>
            </h3>
            <p className="text-[11px] text-amber-400/90 font-medium mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> R$ {monthTotalDiariasPaid.toLocaleString('pt-BR')} acumulados
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#151e30] border border-[#23314a] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Notas & Alertas de Pátio</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">
              {dailyNotes.length} <span className="text-xs text-slate-400 font-normal">anotações</span>
            </h3>
            <p className="text-[11px] text-purple-300/80 font-medium mt-1 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Lembretes diários
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <StickyNote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout: Calendar Grid + Selected Date Drawer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / TOP: Interactive Monthly Calendar Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#23314a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{formatMonthYearString()}</h2>
                  <p className="text-xs text-slate-400">Clique em qualquer dia para ver ou criar agendamentos</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 bg-[#1f2a3e] hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl transition-all border border-[#2e3e59] cursor-pointer"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setCurrentYear(Number(todayISO.slice(0, 4)));
                    setCurrentMonth(Number(todayISO.slice(5, 7)) - 1);
                    setSelectedDate(todayISO);
                  }}
                  className="px-3 py-2 bg-[#1f2a3e] hover:bg-[#283854] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-[#2e3e59] cursor-pointer"
                >
                  Hoje
                </button>

                <button
                  onClick={handleNextMonth}
                  className="p-2 bg-[#1f2a3e] hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl transition-all border border-[#2e3e59] cursor-pointer"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleOpenAddApt(selectedDate)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-900/40 flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agendar</span>
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs py-1">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* 35-Day Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayISO;

                // Day badges
                const dayApts = appointments.filter((a) => a.date === cell.dateStr);
                const dayNotes = dailyNotes.filter((n) => n.date === cell.dateStr);
                const dayStaffLogs = staffWorkLogs.filter((w) => w.date === cell.dateStr);

                return (
                  <button
                    key={cell.dateStr + '_' + idx}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[72px] sm:min-h-[85px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500 shadow-md shadow-blue-950/60 ring-2 ring-blue-500/50'
                        : isToday
                        ? 'bg-[#1b2538] border-amber-500/60'
                        : cell.isCurrentMonth
                        ? 'bg-[#111827] border-[#1f293d] hover:border-slate-500/50 hover:bg-[#182234]'
                        : 'bg-[#0d121f]/50 border-[#182133]/50 text-slate-600'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black rounded-md px-1.5 py-0.5 ${
                          isToday
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isSelected
                            ? 'bg-blue-500 text-white font-extrabold'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Indicator Icons */}
                      <div className="flex items-center gap-0.5">
                        {dayNotes.length > 0 && (
                          <div className="w-2 h-2 rounded-full bg-purple-400" title="Possui anotação" />
                        )}
                        {dayStaffLogs.length > 0 && (
                          <div className="w-2 h-2 rounded-full bg-amber-400" title="Possui presenças" />
                        )}
                      </div>
                    </div>

                    {/* Day Content Badges Preview */}
                    <div className="space-y-1 mt-1 overflow-hidden w-full">
                      {dayApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate leading-tight ${
                            apt.status === 'Confirmado'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : apt.status === 'Em Andamento'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {apt.time} - {apt.vehicleModel.split(' ')[0]}
                        </div>
                      ))}

                      {dayApts.length > 2 && (
                        <span className="text-[9px] text-blue-400 font-extrabold block text-center">
                          +{dayApts.length - 2} agendamento(s)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Grid Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#23314a] text-[11px] text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Agendamento Confirmado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Agendado / Pendente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Nota de Pátio
                </span>
              </div>
              <span className="font-bold text-slate-300">Data Selecionada: {selectedDate}</span>
            </div>
          </div>
        </div>

        {/* RIGHT / BOTTOM: Selected Date Inspector Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg sticky top-4">
            {/* Panel Date Header */}
            <div className="bg-[#111827] border border-[#23314a] p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 block">
                  Detalhamento do Dia
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {getFormattedSelectedDate()}
                </h3>
              </div>
              <button
                onClick={() => handleOpenAddApt(selectedDate)}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-blue-900/30"
                title="Novo Agendamento para este dia"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs inside Day Inspector */}
            <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-[#23314a]">
              <button
                onClick={() => setDateDetailTab('agendamentos')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  dateDetailTab === 'agendamentos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Agendamentos ({selectedDateAppointments.length})</span>
              </button>

              <button
                onClick={() => setDateDetailTab('observacoes')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  dateDetailTab === 'observacoes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Notas ({selectedDateNotes.length})</span>
              </button>

              <button
                onClick={() => setDateDetailTab('presenca')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  dateDetailTab === 'presenca'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Equipe ({selectedDateStaffLogs.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Agendamentos de Serviços */}
            {dateDetailTab === 'agendamentos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300">
                    Serviços Programados ({selectedDateAppointments.length})
                  </h4>
                  <button
                    onClick={() => handleOpenAddApt(selectedDate)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agendar Veículo
                  </button>
                </div>

                {selectedDateAppointments.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {selectedDateAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-[#111827] border border-[#23314a] hover:border-blue-500/40 rounded-xl p-3.5 space-y-3 transition-all"
                      >
                        {/* Apt Top Bar */}
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-600/20 text-blue-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border border-blue-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" /> {apt.time}h ({apt.estimatedDurationHours}h est.)
                          </span>

                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              apt.status === 'Confirmado'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : apt.status === 'Em Andamento'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : apt.status === 'Concluído'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        {/* Customer & Vehicle Info */}
                        <div>
                          <h4 className="font-extrabold text-white text-sm flex items-center justify-between">
                            <span>{apt.vehicleModel}</span>
                            <span className="font-mono text-xs text-slate-400 bg-[#1e293b] px-2 py-0.5 rounded">
                              {apt.vehiclePlate || 'S/ PLACA'}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5 text-blue-400" /> {apt.clientName}
                            {apt.clientPhone && (
                              <span className="text-slate-400 text-[11px]">({apt.clientPhone})</span>
                            )}
                          </p>
                        </div>

                        {/* Services List */}
                        <div className="bg-[#172033] border border-[#263752] p-2.5 rounded-lg space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                            Serviços Agendados:
                          </span>
                          <p className="text-xs text-amber-300 font-bold">
                            {apt.services.join(' • ')}
                          </p>
                        </div>

                        {/* Assigned Staff & Price */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1f293d]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-400" /> {apt.assignedDetailer || 'Sem responsável'}
                          </span>
                          <span className="font-black text-emerald-400 text-sm">
                            R$ {apt.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Notes if present */}
                        {apt.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-[#151e30] p-2 rounded-lg border border-[#23314a]">
                            "{apt.notes}"
                          </p>
                        )}

                        {/* Payment Quick Control */}
                        <div className="bg-[#141d2f] border border-[#23314a] p-2 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-extrabold text-slate-300 uppercase">Pagamento:</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <select
                              value={apt.paymentMethod || 'Pix'}
                              onChange={(e) => onUpdateAppointment({ ...apt, paymentMethod: e.target.value as PaymentMethod })}
                              className="bg-[#0f172a] border border-[#2c3f63] text-white font-bold text-[10px] px-2 py-0.5 rounded focus:outline-none cursor-pointer"
                            >
                              <option value="Pix">Pix</option>
                              <option value="Cartão de Crédito">Crédito à vista (1x)</option>
                              <option value="Crédito Parcelado">Crédito Parcelado</option>
                              <option value="Boleto Parcelado">Boleto Parcelado</option>
                              <option value="Cartão de Débito">Cartão de Débito</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Fiado">Fiado / A Prazo</option>
                            </select>

                            <select
                              value={apt.paymentStatus || 'Pendente'}
                              onChange={(e) => onUpdateAppointment({ ...apt, paymentStatus: e.target.value as any })}
                              className={`font-bold text-[10px] px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                                apt.paymentStatus === 'Pago'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : apt.paymentStatus === 'Fiado'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="Pendente" className="bg-[#121929] text-amber-400">Pendente</option>
                              <option value="Pago" className="bg-[#121929] text-emerald-400">Pago</option>
                              <option value="Parcial" className="bg-[#121929] text-blue-400">Sinal / Parcial</option>
                              <option value="Fiado" className="bg-[#121929] text-purple-300">Fiado / A Prazo</option>
                            </select>
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f293d]">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSendWhatsAppApt(apt)}
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Enviar confirmação por WhatsApp"
                            >
                              <Send className="w-3 h-3" /> WhatsApp
                            </button>

                            <button
                              onClick={() => handleOpenEditApt(apt)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-[#1f2a3e] rounded-lg transition-colors cursor-pointer"
                              title="Editar Agendamento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Deseja cancelar o agendamento de ${apt.clientName}?`)) {
                                  onDeleteAppointment(apt.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remover Agendamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Convert to OS Button */}
                          <button
                            onClick={() => onConvertAppointmentToOS(apt)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg shadow-md shadow-blue-900/30 flex items-center gap-1 transition-all cursor-pointer"
                            title="Entrar no Pátio e gerar Ordem de Serviço"
                          >
                            <span>Criar OS no Pátio</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-[#23314a] rounded-xl space-y-2">
                    <Car className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Nenhum agendamento para este dia.</p>
                    <button
                      onClick={() => handleOpenAddApt(selectedDate)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agendar Novo Veículo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Observações do Dia */}
            {dateDetailTab === 'observacoes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300">Anotações do Dia</h4>
                  <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova Anotação
                  </button>
                </div>

                {selectedDateNotes.length > 0 ? (
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                    {selectedDateNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-[#111827] border border-purple-500/30 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                            {note.category || 'Geral'}
                          </span>
                          <span className="text-[10px] text-slate-500">{note.createdAt}</span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {note.note}
                        </p>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => onDeleteDailyNote(note.id)}
                            className="text-slate-500 hover:text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-[#23314a] rounded-xl space-y-2">
                    <StickyNote className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Nenhuma observação registrada para este dia.</p>
                    <button
                      onClick={() => setIsNoteModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Lembrete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Registro por vínculo, compartilhado com Equipe */}
            {dateDetailTab === 'presenca' && <div className="space-y-3">
              <p className="text-sm text-slate-300">Fixos: somente ocorrências. Demais: trabalho realizado.</p>
              {!staffList.length && <p className="text-sm text-slate-400">Cadastre uma pessoa em Equipe.</p>}
              {staffList.map(staff => <div key={staff.id} className="min-w-0">
                <h4 className="mb-2 text-sm font-bold text-white">{staff.name}</h4>
                <StaffAttendance staff={staff} logs={staffWorkLogs} date={selectedDate} busy={attendanceBusy}
                  canManage={canManageAttendance} canDelete={canDeleteAttendance}
                  onSave={onSaveStaffWorkLog} onDelete={onDeleteStaffWorkLog} />
              </div>)}
            </div>}
          </div>
        </div>
      </div>

      {/* MODAL 1: Create / Edit Appointment */}
      {isAptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            <div className="p-4 sm:p-5 border-b border-[#23314a] flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingApt ? 'Editar Agendamento' : 'Novo Agendamento de Serviço'}
                </h3>
              </div>
              <button
                onClick={() => setIsAptModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberto Alves"
                    value={aptForm.clientName}
                    onChange={(e) => setAptForm({ ...aptForm, clientName: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99123-4455"
                    value={aptForm.clientPhone}
                    onChange={(e) => setAptForm({ ...aptForm, clientPhone: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Veículo (Marca e Modelo) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Porsche 911 Carrera"
                    value={aptForm.vehicleModel}
                    onChange={(e) => setAptForm({ ...aptForm, vehicleModel: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Placa do Veículo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: ABC-1234"
                      value={aptForm.vehiclePlate}
                      onChange={(e) => {
                        setAptForm({ ...aptForm, vehiclePlate: e.target.value.toUpperCase() });
                        setPlateLookupMessage(null);
                      }}
                      className="min-w-0 flex-1 bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleLookupAppointmentPlate}
                      disabled={isPlateLookupLoading}
                      className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      {isPlateLookupLoading ? 'Consultando...' : 'Consultar placa'}
                    </button>
                  </div>
                  {plateLookupMessage && (
                    <p className="text-[11px] text-blue-400 mt-1.5">
                      {plateLookupMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data do Serviço *
                  </label>
                  <input
                    type="date"
                    required
                    value={aptForm.date}
                    onChange={(e) => setAptForm({ ...aptForm, date: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={aptForm.time}
                    onChange={(e) => setAptForm({ ...aptForm, time: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Duração Est. (Horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={aptForm.estimatedDurationHours}
                    onChange={(e) => setAptForm({ ...aptForm, estimatedDurationHours: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Selecione os Serviços do Catálogo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#111827] p-2.5 rounded-xl border border-[#23314a] max-h-36 overflow-y-auto">
                  {servicesCatalog.map((svc) => {
                    const isChecked = (aptForm.services || []).includes(svc.name);
                    return (
                      <label
                        key={svc.id}
                        className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${
                          isChecked
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                            : 'bg-[#151e30] text-slate-400 border-[#23314a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = aptForm.services || [];
                              let newServices: string[];
                              if (e.target.checked) {
                                newServices = [...current, svc.name];
                              } else {
                                newServices = current.filter((s) => s !== svc.name);
                              }
                              const sumValue = newServices.reduce((acc, sName) => {
                                const found = servicesCatalog.find((x) => x.name === sName);
                                if (found) return acc + found.defaultPrice;
                                const match = sName.match(/\(R\$\s*(\d+(?:\.\d+)?)\)/);
                                return acc + (match ? parseFloat(match[1]) : 0);
                              }, 0);
                              setAptForm({ ...aptForm, services: newServices, estimatedValue: sumValue });
                            }}
                            className="rounded border-slate-700 text-blue-600"
                          />
                          <span className="truncate">{svc.name}</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-extrabold shrink-0">
                          R$ {svc.defaultPrice}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Form para Serviço Avulso / Fora do Catálogo */}
                <div className="bg-[#111827] border border-[#23314a] p-3 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 block flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Serviço Avulso (Fora do Catálogo)
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Tipo / Nome do Serviço"
                      value={customAptServiceName}
                      onChange={(e) => setCustomAptServiceName(e.target.value)}
                      className="flex-1 bg-[#151e30] border border-[#23314a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      placeholder="Valor R$"
                      value={customAptServicePrice}
                      onChange={(e) => setCustomAptServicePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-24 bg-[#151e30] border border-[#23314a] rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAptService}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      + Incluir
                    </button>
                  </div>

                  {/* List of custom services included in aptForm.services */}
                  {(aptForm.services || []).filter((s) => !servicesCatalog.some((sc) => sc.name === s)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(aptForm.services || [])
                        .filter((s) => !servicesCatalog.some((sc) => sc.name === s))
                        .map((customSvcName, idx) => (
                          <span
                            key={idx}
                            className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <span>{customSvcName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newServices = (aptForm.services || []).filter((s) => s !== customSvcName);
                                const sumValue = newServices.reduce((acc, sName) => {
                                  const found = servicesCatalog.find((x) => x.name === sName);
                                  if (found) return acc + found.defaultPrice;
                                  const match = sName.match(/\(R\$\s*(\d+(?:\.\d+)?)\)/);
                                  return acc + (match ? parseFloat(match[1]) : 0);
                                }, 0);
                                setAptForm({ ...aptForm, services: newServices, estimatedValue: sumValue });
                              }}
                              className="text-amber-400 hover:text-rose-400 ml-1 cursor-pointer font-black"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Profissional Responsável
                  </label>
                  <select
                    value={aptForm.assignedDetailer}
                    onChange={(e) => setAptForm({ ...aptForm, assignedDetailer: e.target.value })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Selecione da equipe...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={aptForm.estimatedValue}
                    onChange={(e) => setAptForm({ ...aptForm, estimatedValue: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#111827] border border-[#23314a] p-3 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={aptForm.paymentMethod || 'Pix'}
                    onChange={(e) => setAptForm({ ...aptForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full bg-[#151e30] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Débito">Débito</option>
                    <option value="Cartão de Crédito">Crédito à vista (1x)</option>
                    <option value="Crédito Parcelado">Crédito Parcelado</option>
                    <option value="Boleto Parcelado">Boleto Parcelado</option>
                    <option value="Fiado">Fiado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status do Pagamento / Sinal
                  </label>
                  <select
                    value={aptForm.paymentStatus || 'Pendente'}
                    onChange={(e) => setAptForm({ ...aptForm, paymentStatus: e.target.value as any })}
                    className="w-full bg-[#151e30] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago (Quitado)</option>
                    <option value="Parcial">Sinal / Parcial</option>
                    <option value="Fiado">Fiado / A Prazo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observações / Recomendações
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente virá após o almoço. Deixar vaga de entrada reservada."
                  value={aptForm.notes}
                  onChange={(e) => setAptForm({ ...aptForm, notes: e.target.value })}
                  className="w-full bg-[#111827] border border-[#23314a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsAptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#111827] border border-[#23314a] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/40 cursor-pointer"
                >
                  {editingApt ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Daily Note */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#151e30] border border-[#23314a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#23314a] flex items-center justify-between bg-[#111827]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-purple-400" /> Observação para {selectedDate}
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Categoria</label>
                <select
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as any })}
                  className="w-full bg-[#111827] border border-[#23314a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Geral">Geral</option>
                  <option value="Insumos">Insumos & Produtos</option>
                  <option value="Pátio">Manutenção no Pátio</option>
                  <option value="Cliente VIP">Cliente VIP</option>
                  <option value="Aviso">Aviso / Importante</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Anotação / Lembrete *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escreva detalhes ou alertas para a equipe sobre este dia..."
                  value={noteForm.note}
                  onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                  className="w-full bg-[#111827] border border-[#23314a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  Salvar Observação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
