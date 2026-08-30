import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';
import { 
  ServiceOrder, 
  ServiceItem, 
  ProductItem,
  ServiceComboItem,
  ShopSettings, 
  OSStatus,
  StaffMember,
  Appointment,
  DailyCalendarNote,
  StaffWorkLog,
  PaymentMethod
} from './types';
import { 
  INITIAL_ORDERS, 
  INITIAL_SERVICES_CATALOG, 
  INITIAL_PRODUCTS_CATALOG,
  INITIAL_COMBOS_CATALOG,
  INITIAL_SHOP_SETTINGS, 
  INITIAL_STAFF,
  DEMO_SAAS_TENANTS,
  INITIAL_APPOINTMENTS,
  INITIAL_DAILY_NOTES,
  INITIAL_STAFF_WORK_LOGS
} from './data/mockData';

import { Header } from './components/Header';
import { AgendaDetailerFooter } from './components/AgendaDetailerBrand';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { NewOSView } from './components/NewOSView';
import { KanbanView } from './components/KanbanView';
import { FinancialView } from './components/FinancialView';
import { StaffView } from './components/StaffView';
import { CustomersView } from './components/CustomersView';
import { CatalogView } from './components/CatalogView';
import { SettingsView } from './components/SettingsView';
import { OSDetailModal } from './components/OSDetailModal';
import { AuthView } from './components/AuthView';
import { QuickStockOutflowModal } from './components/QuickStockOutflowModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';

export default function App() {
  // Auth & Navigation state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
 useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setIsAuthenticated(!!data.session);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsAuthenticated(!!session);
  });

  return () => subscription.unsubscribe();
}, []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core App Data State



  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>(INITIAL_SERVICES_CATALOG);
  const [productsCatalog, setProductsCatalog] = useState<ProductItem[]>(INITIAL_PRODUCTS_CATALOG);
  const [combosCatalog, setCombosCatalog] = useState<ServiceComboItem[]>(INITIAL_COMBOS_CATALOG);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(INITIAL_SHOP_SETTINGS);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  useEffect(() => {
    if (!isAuthenticated || !companyId) return;

    const loadOrdersForCompany = async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          id,
          os_number,
          status,
          custom_description,
          discount,
          total_value,
          payment_method,
          payment_status,
          created_at,
          customer:customers(name, phone),
          vehicle:vehicles(plate, brand, model, color, year),
          services:service_order_services(id, service_name, unit_price, quantity)
        `)
        .eq('company_id', companyId)
        .order('os_number', { ascending: false });

      if (error) {
        console.error('Erro ao carregar Ordens de Serviço.', error);
        return;
      }

      const mappedOrders: ServiceOrder[] = (data ?? []).map((row: any) => {
        const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
        const vehicle = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle;
        const services = Array.isArray(row.services) ? row.services : [];

        return {
          id: row.id,
          osNumber: Number(row.os_number),
          createdAt: row.created_at,
          status: row.status,
          plate: vehicle?.plate ?? '',
          brand: vehicle?.brand ?? '',
          model: vehicle?.model ?? '',
          color: vehicle?.color ?? '',
          year: vehicle?.year ?? '',
          clientName: customer?.name ?? '',
          clientPhone: customer?.phone ?? '',
          fuelLevel: 'Meio Tanque',
          damages: [],
          checklistItems: {
            riscosPintura: false,
            mossasAmassados: false,
            vidroTrincado: false,
            rodasRaladas: false,
            pertencesPessoais: false,
            pneuEstepeOk: false,
          },
          inspectionNotes: '',
          services: services.map((service: any) => ({
            serviceId: service.id,
            name: service.service_name,
            price: Number(service.unit_price ?? 0),
          })),
          discount: Number(row.discount ?? 0),
          totalValue: Number(row.total_value ?? 0),
          customDescription: row.custom_description ?? '',
          projectSteps: [],
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
        };
      });

      setOrders(mappedOrders);
    };

    void loadOrdersForCompany();
  }, [isAuthenticated, companyId]);
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership, error: membershipError } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (membershipError || !membership) {
        console.error('Empresa vinculada não encontrada.', membershipError);
        return;
      }
setCurrentRole(membership.role);
setCompanyId(membership.company_id);
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, subtitle, shop_category, phone, email, address, pix_key, owner_name, logo_url, accent_color, document, instagram')
        .eq('id', membership.company_id)
        .eq('active', true)
        .maybeSingle();

      if (companyError || !company) {
        console.error('Não foi possível carregar a empresa.', companyError);
        return;
      }

      setShopSettings({
        id: company.id,
        name: company.name,
        subtitle: company.subtitle ?? '',
        shopCategory: company.shop_category as ShopSettings['shopCategory'],
        phone: company.phone ?? '',
        address: company.address ?? '',
        pixKey: company.pix_key ?? '',
        ownerName: company.owner_name ?? user.email?.split('@')[0] ?? '',
        email: company.email ?? user.email ?? '',
        logoUrl: company.logo_url ?? '',
        accentColor: (company.accent_color ?? 'blue') as ShopSettings['accentColor'],
        cnpjCpf: company.document ?? '',
        instagram: company.instagram ?? '',
      });
    };

    void loadCompany();
  }, [isAuthenticated]);

  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);

  // Calendar & Scheduling State
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [dailyNotes, setDailyNotes] = useState<DailyCalendarNote[]>(INITIAL_DAILY_NOTES);
  const [staffWorkLogs, setStaffWorkLogs] = useState<StaffWorkLog[]>(INITIAL_STAFF_WORK_LOGS);

  // Modal State
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<ServiceOrder | null>(null);
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState<boolean>(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState<boolean>(false);
  const [autoStockToast, setAutoStockToast] = useState<{ message: string; osNumber: number } | null>(null);

  // Critical stock count
  const lowStockCount = productsCatalog.filter((p) => p.currentStock <= p.minStock).length;

  // Calculate Next OS Number

  useEffect(() => {
    if (!isAuthenticated || !companyId) return;

    const loadAppointmentsForCompany = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          estimated_duration_minutes,
          status,
          notes,
          estimated_value,
          payment_method,
          payment_status,
          customer:customers(name, phone),
          vehicle:vehicles(plate, brand, model),
          staff:staff(name),
          services:appointment_services(id, service_name, unit_price, quantity)

        `)
        .eq('company_id', companyId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar agendamentos.', error);
        return;
      }

      const mappedAppointments: Appointment[] = (data ?? []).map((row: any) => {
        const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
        const vehicle = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle;
        const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;

        const services = Array.isArray(row.services) ? row.services : [];
        const scheduled = new Date(row.scheduled_at);

        const yyyy = scheduled.getFullYear();
        const mm = String(scheduled.getMonth() + 1).padStart(2, '0');
        const dd = String(scheduled.getDate()).padStart(2, '0');
        const hh = String(scheduled.getHours()).padStart(2, '0');
        const min = String(scheduled.getMinutes()).padStart(2, '0');

        return {
          id: row.id,
          clientName: customer?.name ?? '',
          clientPhone: customer?.phone ?? '',
          vehicleModel: [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') || '',
          vehiclePlate: vehicle?.plate ?? '',
          services: services.map((service: any) => service.service_name).filter(Boolean),
          date: `${yyyy}-${mm}-${dd}`,
          time: `${hh}:${min}`,
          estimatedDurationHours: Number(row.estimated_duration_minutes ?? 120) / 60,
          assignedDetailer: staff?.name ?? '',
          notes: row.notes ?? '',
          status: row.status,
          estimatedValue: Number(row.estimated_value ?? 0),
          convertedOSNumber: undefined,
          paymentMethod: row.payment_method ?? 'Pendente',
          paymentStatus: row.payment_status ?? 'Pendente',
        };
      });

      setAppointments(mappedAppointments);
    };

    void loadAppointmentsForCompany();
  }, [isAuthenticated, companyId]);

  const nextOSNumber = orders.length > 0 
    ? Math.max(...orders.map((o) => o.osNumber)) + 1 
    : 1001;

  // Calendar Handlers
  const resolveAppointmentRelations = async (apt: Appointment) => {
    if (!companyId) throw new Error('Empresa não identificada.');

    const cleanName = apt.clientName.trim();
    const cleanPhone = apt.clientPhone.trim();
    const cleanPlate = apt.vehiclePlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    let customerId: string | null = null;

    if (cleanPlate) {
      const { data: currentVehicle, error } = await supabase
        .from('vehicles')
        .select('customer_id')
        .eq('company_id', companyId)
        .eq('plate', cleanPlate)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      customerId = currentVehicle?.customer_id ?? null;
    }

    if (customerId) {
      const { error } = await supabase
        .from('customers')
        .update({
          name: cleanName,
          phone: cleanPhone || null,
        })
        .eq('id', customerId)
        .eq('company_id', companyId);

      if (error) throw error;
    }

    if (!customerId && cleanPhone) {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .eq('phone', cleanPhone)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      customerId = data?.id ?? null;
    }

    if (!customerId && cleanName) {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', cleanName)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      customerId = data?.id ?? null;
    }

    if (!customerId && cleanName) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          company_id: companyId,
          name: cleanName,
          phone: cleanPhone || null,
        })
        .select('id')
        .single();
      if (error || !data) throw error ?? new Error('Cliente não criado.');
      customerId = data.id;
    }

    let vehicleId: string | null = null;
    if (cleanPlate) {
      const { data: existingVehicle, error } = await supabase
        .from('vehicles')
        .select('id')
        .eq('company_id', companyId)
        .eq('plate', cleanPlate)
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      const vehicleParts = apt.vehicleModel.trim().split(/\s+/);
      const brand = vehicleParts.shift() || null;
      const model = vehicleParts.join(' ') || apt.vehicleModel.trim() || null;

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            customer_id: customerId,
            brand,
            model,
            active: true,
          })
          .eq('id', existingVehicle.id)
          .eq('company_id', companyId);
        if (updateError) throw updateError;
      } else {
        const { data: createdVehicle, error: createError } = await supabase
          .from('vehicles')
          .insert({
            company_id: companyId,
            customer_id: customerId,
            plate: cleanPlate,
            brand,
            model,
            active: true,
          })
          .select('id')
          .single();
        if (createError || !createdVehicle) throw createError ?? new Error('Veículo não criado.');
        vehicleId = createdVehicle.id;
      }
    }

    let staffId: string | null = null;
    if (apt.assignedDetailer) {
      const { data, error } = await supabase
        .from('staff')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', apt.assignedDetailer)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      staffId = data?.id ?? null;
    }

    return { companyId, customerId, vehicleId, staffId };
  };

  const saveAppointmentServices = async (appointmentId: string, apt: Appointment) => {
    const { error: deleteError } = await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', appointmentId);
    if (deleteError) throw deleteError;

    if (apt.services.length === 0) return;

    const rows = apt.services.map((serviceName) => {
      const catalogService = servicesCatalog.find((service) => service.name === serviceName);
      const customPriceMatch = serviceName.match(/\(R\$\s*(\d+(?:\.\d+)?)\)/);

      return {
        appointment_id: appointmentId,
        service_id: catalogService?.id && /^[0-9a-f-]{36}$/i.test(catalogService.id) ? catalogService.id : null,
        service_name: serviceName,
        quantity: 1,
        unit_price: catalogService?.defaultPrice ?? (customPriceMatch ? Number(customPriceMatch[1]) : 0),
      };
    });

    const { error } = await supabase.from('appointment_services').insert(rows);
    if (error) throw error;
  };

  const handleAddAppointment = async (apt: Appointment) => {
    try {
      const { companyId, customerId, vehicleId, staffId } = await resolveAppointmentRelations(apt);
      const scheduledAt = new Date(`${apt.date}T${apt.time}:00`).toISOString();

      const { data: created, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          customer_id: customerId,
          vehicle_id: vehicleId,
          staff_id: staffId,
          scheduled_at: scheduledAt,
          estimated_duration_minutes: Math.round(apt.estimatedDurationHours * 60),
          status: apt.status,
          notes: apt.notes || null,
          source: 'Agenda Detailer',
          estimated_value: apt.estimatedValue,
          payment_method: apt.paymentMethod || 'Pendente',
          payment_status: apt.paymentStatus || 'Pendente',
        })
        .select('id')
        .single();

      if (error || !created) throw error ?? new Error('Agendamento não criado.');

      await saveAppointmentServices(created.id, apt);
      setAppointments([{ ...apt, id: created.id }, ...appointments]);
    } catch (error) {
      console.error('Erro ao criar agendamento.', error);
    }
  };

  const handleUpdateAppointment = async (updatedApt: Appointment) => {
    try {
      const { companyId, customerId, vehicleId, staffId } = await resolveAppointmentRelations(updatedApt);
      const scheduledAt = new Date(`${updatedApt.date}T${updatedApt.time}:00`).toISOString();

      const { error } = await supabase
        .from('appointments')
        .update({
          customer_id: customerId,
          vehicle_id: vehicleId,
          staff_id: staffId,
          scheduled_at: scheduledAt,
          estimated_duration_minutes: Math.round(updatedApt.estimatedDurationHours * 60),
          status: updatedApt.status,
          notes: updatedApt.notes || null,
          estimated_value: updatedApt.estimatedValue,
          payment_method: updatedApt.paymentMethod || 'Pendente',
          payment_status: updatedApt.paymentStatus || 'Pendente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedApt.id)
        .eq('company_id', companyId);

      if (error) throw error;

      await saveAppointmentServices(updatedApt.id, updatedApt);
      setAppointments(appointments.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    } catch (error) {
      console.error('Erro ao atualizar agendamento.', error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);

      if (error) throw error;
      setAppointments(appointments.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Erro ao excluir agendamento.', error);
    }
  };

  const handleConvertAppointmentToOS = (apt: Appointment) => {
    // Build ServiceOrder from Appointment
    const newOS: ServiceOrder = {
      id: 'os_' + Date.now(),
      osNumber: nextOSNumber,
      createdAt: `${apt.date} 08:00`,
      deliveryEstimatedDate: apt.date,
      status: 'Aguardando',
      plate: apt.vehiclePlate || 'ABC-1234',
      brand: apt.vehicleModel.split(' ')[0] || 'Veículo',
      model: apt.vehicleModel,
      color: 'Cor Padrão',
      year: '2023/2024',
      clientName: apt.clientName,
      clientPhone: apt.clientPhone || '(11) 99999-9999',
      fuelLevel: '1/4',
      damages: [],
      checklistItems: {
        riscosPintura: false,
        mossasAmassados: false,
        vidroTrincado: false,
        rodasRaladas: false,
        pertencesPessoais: true,
        pneuEstepeOk: true,
      },
      inspectionNotes: apt.notes ? `Agendamento prévio: ${apt.notes}` : 'Agendamento convertido da agenda.',
      services: apt.services.map((sName, idx) => ({
        serviceId: 's_' + idx,
        name: sName,
        price: apt.estimatedValue / (apt.services.length || 1),
      })),
      discount: 0,
      totalValue: apt.estimatedValue,
      customDescription: `Agendamento do dia ${apt.date} às ${apt.time}h`,
      projectSteps: [
        { id: 'step_1', title: 'Recepção e Vistoria', completed: true },
        { id: 'step_2', title: 'Lavagem Técnica Inicial', completed: false },
        { id: 'step_3', title: 'Execução de Serviços', completed: false },
        { id: 'step_4', title: 'Inspeção Final e Entrega', completed: false },
      ],
      paymentMethod: apt.paymentMethod || 'Pendente',
      paymentStatus: apt.paymentStatus || 'Pendente',
      assignedDetailer: apt.assignedDetailer,
    };

    // Update appointment status to Concluído with converted OS Number
    setAppointments(appointments.map((a) => a.id === apt.id ? { ...a, status: 'Concluído', convertedOSNumber: nextOSNumber } : a));
    
    // Save to Orders and redirect to Pátio
    setOrders([newOS, ...orders]);
    setActiveTab('patio');
    setSelectedOrderForModal(newOS);

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (e) {
      // Fallback
    }
  };

  const handleAddDailyNote = (note: DailyCalendarNote) => {
    setDailyNotes([note, ...dailyNotes]);
  };

  const handleDeleteDailyNote = (id: string) => {
    setDailyNotes(dailyNotes.filter((n) => n.id !== id));
  };

  const handleSaveStaffWorkLog = (log: StaffWorkLog) => {
    // Replace existing log for same staff on same date or add new
    const existingIndex = staffWorkLogs.findIndex((w) => w.staffId === log.staffId && w.date === log.date);
    if (existingIndex >= 0) {
      const updated = [...staffWorkLogs];
      updated[existingIndex] = log;
      setStaffWorkLogs(updated);
    } else {
      setStaffWorkLogs([log, ...staffWorkLogs]);
    }
  };

  const handleDeleteStaffWorkLog = (id: string) => {
    setStaffWorkLogs(staffWorkLogs.filter((w) => w.id !== id));
  };

  // Handlers
  const handleLoginSuccess = (email: string, customTenant?: { name: string; category?: any }) => {
    // Check if matching a demo tenant
    const matchedTenant = DEMO_SAAS_TENANTS.find((t) => t.email.toLowerCase() === email.toLowerCase());
    
    if (matchedTenant) {
      setShopSettings(matchedTenant.shopSettings);
    } else if (customTenant) {
      setShopSettings({
        ...INITIAL_SHOP_SETTINGS,
        id: 'tenant_' + Date.now(),
        name: customTenant.name,
        subtitle: `${customTenant.category || 'Estética Automotiva'} VIP`,
        shopCategory: customTenant.category || 'Estética Automotiva',
        email: email,
        ownerName: email.split('@')[0],
      });
    } else {
      setShopSettings({
        ...shopSettings,
        email: email,
      });
    }
    
    setIsAuthenticated(true);
  };

  const handleSaveNewOS = (newOrder: ServiceOrder) => {
    setOrders([newOrder, ...orders]);
    
    // Trigger celebratory confetti on OS creation
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // Fallback ignore
    }

    // Redirect to Kanban Pátio and open modal for instant review & WhatsApp link!
    setActiveTab('patio');
    setSelectedOrderForModal(newOrder);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OSStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const wasAlreadyFinalized = targetOrder?.status === 'Finalizado';

    const { error } = await supabase
      .from('service_orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao atualizar status da OS.', error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      setSelectedOrderForModal({ ...selectedOrderForModal, status: newStatus });
    }

    // Auto Deduct Supplies when moving to Finalizado (if not already finalized)
    if (newStatus === 'Finalizado' && !wasAlreadyFinalized && targetOrder) {
      // Find matching products based on services in this OS
      const servicesNames = targetOrder.services.map((s) => s.name.toLowerCase()).join(' ');

      // Deduct corresponding stock units
      setProductsCatalog((prev) =>
        prev.map((product) => {
          const pName = product.name.toLowerCase();
          let deduction = 0;

          if (servicesNames.includes('polimento') && (pName.includes('composto') || pName.includes('boina'))) {
            deduction = 1;
          } else if (servicesNames.includes('vitrific') && (pName.includes('vitrific') || pName.includes('coating'))) {
            deduction = 1;
          } else if (servicesNames.includes('lavagem') && (pName.includes('shampoo') || pName.includes('v-floc'))) {
            deduction = 1;
          } else if (servicesNames.includes('cera') && pName.includes('cera')) {
            deduction = 1;
          } else if (servicesNames.includes('higieniz') && (pName.includes('sintra') || pName.includes('interior'))) {
            deduction = 1;
          }

          if (deduction > 0) {
            return {
              ...product,
              currentStock: Math.max(0, product.currentStock - deduction),
            };
          }
          return product;
        })
      );

      // Show friendly auto-deduction toast
      setAutoStockToast({
        message: `🚗 OS #${targetOrder.osNumber} finalizada! Insumos consumidos baixados automaticamente do estoque.`,
        osNumber: targetOrder.osNumber,
      });

      // Auto dismiss toast after 5s
      setTimeout(() => {
        setAutoStockToast(null);
      }, 5000);
    }
  };

  const handleUpdateDetailer = (orderId: string, detailer: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedDetailer: detailer } : o))
    );
  };

  const handleToggleProjectStep = (orderId: string, stepId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedSteps = o.projectSteps.map((step) =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        );
        return { ...o, projectSteps: updatedSteps };
      })
    );

    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      const updatedSteps = selectedOrderForModal.projectSteps.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );
      setSelectedOrderForModal({ ...selectedOrderForModal, projectSteps: updatedSteps });
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado') => {
    const { error } = await supabase
      .from('service_orders')
      .update({ payment_status: status })
      .eq('id', orderId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao atualizar status do pagamento.', error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      setSelectedOrderForModal({ ...selectedOrderForModal, paymentStatus: status });
    }
  };

  const handleUpdatePaymentMethod = async (orderId: string, method: PaymentMethod) => {
    const { error } = await supabase
      .from('service_orders')
      .update({ payment_method: method })
      .eq('id', orderId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao atualizar forma de pagamento.', error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentMethod: method } : o))
    );
    if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
      setSelectedOrderForModal({ ...selectedOrderForModal, paymentMethod: method });
    }
  };

  const handleSendWhatsApp = (order: ServiceOrder) => {
    setSelectedOrderForModal(order);
  };

  // Catalog Handlers
  const handleAddCatalogService = (service: ServiceItem) => {
    setServicesCatalog([service, ...servicesCatalog]);
  };

  const handleUpdateCatalogService = (updated: ServiceItem) => {
    setServicesCatalog(servicesCatalog.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleRemoveCatalogService = (id: string) => {
    setServicesCatalog(servicesCatalog.filter((s) => s.id !== id));
  };

  const handleAddCatalogProduct = (product: ProductItem) => {
    setProductsCatalog([product, ...productsCatalog]);
  };

  const handleUpdateCatalogProduct = (updated: ProductItem) => {
    setProductsCatalog(productsCatalog.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleRemoveCatalogProduct = (id: string) => {
    setProductsCatalog(productsCatalog.filter((p) => p.id !== id));
  };

  const handleAdjustProductStock = (id: string, delta: number) => {
    setProductsCatalog(
      productsCatalog.map((p) =>
        p.id === id ? { ...p, currentStock: Math.max(0, p.currentStock + delta) } : p
      )
    );
  };

  const handleAddCatalogCombo = (combo: ServiceComboItem) => {
    setCombosCatalog([combo, ...combosCatalog]);
  };

  const handleUpdateCatalogCombo = (updated: ServiceComboItem) => {
    setCombosCatalog(combosCatalog.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleRemoveCatalogCombo = (id: string) => {
    setCombosCatalog(combosCatalog.filter((c) => c.id !== id));
  };

  // If not authenticated, render Login view with tenant selection
  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Yard active cars count
  const carsInYardCount = orders.filter((o) => o.status !== 'Pronto para Entrega').length;

  return (
    <div className="min-h-screen bg-[#0d121f] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      <div className="flex flex-1 min-h-screen">
        {/* Left Sidebar Navigation & Mobile Drawer / Bottom Nav */}
        <Sidebar
          settings={shopSettings}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          onLogout={() => setIsAuthenticated(false)}
          pendingCount={carsInYardCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d121f] overflow-y-auto">
          {/* Top Header */}
          <Header
            settings={shopSettings}
            activeViewTitle={
              activeTab === 'dashboard'
                ? 'Dashboard'
                : activeTab === 'agendamento'
                ? 'Agenda & Agendamentos'
                : activeTab === 'nova-os'
                ? 'Nova Ordem de Serviço'
                : activeTab === 'patio'
                ? 'Pátio (Kanban)'
                : activeTab === 'financeiro'
                ? 'Financeiro'
                : activeTab === 'mao-de-obra'
                ? 'Equipe'
                : activeTab === 'catalogo'
                ? 'Catálogo de Serviços & Matéria-Prima'
                : activeTab === 'combos'
                ? 'Combos & Pacotes Promocionais'
                : 'Configurações do Perfil'
            }
            activeViewSubtitle={
              activeTab === 'dashboard'
                ? 'Visão rápida da operação da sua estética'
                : activeTab === 'agendamento'
                ? 'Calendário de serviços, observações de pátio e presenças/diárias da equipe'
                : activeTab === 'nova-os'
                ? 'A OS recebe numeração sequencial e entra no pátio'
                : activeTab === 'patio'
                ? 'Acompanhamento do fluxo dos veículos'
                : activeTab === 'financeiro'
                ? 'Faturamento, entradas e despesas'
                : activeTab === 'mao-de-obra'
                ? 'Cadastro de equipe, distribuição de pátio e controle de comissões'
                : activeTab === 'catalogo'
                ? 'Gerencie os serviços oferecidos e o estoque de insumos, químicos e matérias-primas'
                : activeTab === 'combos'
                ? 'Crie pacotes com desconto, gere propagandas para WhatsApp e divulgue nas redes sociais'
                : 'Configurações de identidade visual, logo e dados cadastrais'
            }
            onNewOSClick={() => setActiveTab('nova-os')}
            carsInYardCount={carsInYardCount}
            lowStockCount={lowStockCount}
            onOpenQuickStockOutflow={() => setIsQuickStockModalOpen(true)}
            onOpenPurchaseOrder={() => setIsPurchaseOrderModalOpen(true)}
            isMobileMenuOpen={isMobileMenuOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Auto Stock Deduction Global Toast Banner */}
          {autoStockToast && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-lg animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{autoStockToast.message}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('catalogo')}
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer"
                >
                  Conferir Estoque
                </button>
                <button
                  onClick={() => setAutoStockToast(null)}
                  className="text-white/80 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Shared footer below the views reserves space for mobile navigation. */}
          <div className="flex-1 pb-6 md:pb-10">
            {activeTab === 'dashboard' && (
              <DashboardView
                orders={orders}
                products={productsCatalog}
                onOpenOSModal={(order) => setSelectedOrderForModal(order)}
                onNewOSClick={() => setActiveTab('nova-os')}
                onOpenQuickStockOutflow={() => setIsQuickStockModalOpen(true)}
                onOpenPurchaseOrder={() => setIsPurchaseOrderModalOpen(true)}
                onAdjustStock={handleAdjustProductStock}
                onNavigateToCatalog={() => setActiveTab('catalogo')}
              />
            )}

            {activeTab === 'agendamento' && (
              <CalendarView
                companyId={companyId}
                appointments={appointments}
                dailyNotes={dailyNotes}
                staffWorkLogs={staffWorkLogs}
                staffList={staffList}
                servicesCatalog={servicesCatalog}
                orders={orders}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                onConvertAppointmentToOS={handleConvertAppointmentToOS}
                onAddDailyNote={handleAddDailyNote}
                onDeleteDailyNote={handleDeleteDailyNote}
                onSaveStaffWorkLog={handleSaveStaffWorkLog}
                onDeleteStaffWorkLog={handleDeleteStaffWorkLog}
              />
            )}

            {activeTab === 'nova-os' && (
              <NewOSView
                companyId={companyId}
                servicesCatalog={servicesCatalog}
                nextOSNumber={nextOSNumber}
                onSaveOS={handleSaveNewOS}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'patio' && (
              <KanbanView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdateDetailer={handleUpdateDetailer}
                onOpenOSModal={(order) => setSelectedOrderForModal(order)}
                onNewOSClick={() => setActiveTab('nova-os')}
                onSendWhatsApp={handleSendWhatsApp}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
                onUpdatePaymentMethod={handleUpdatePaymentMethod}
              />
            )}

            {activeTab === 'clientes' && (
              <CustomersView companyId={companyId} />
            )}

            {activeTab === 'financeiro' && (
              <FinancialView
                key={companyId}
                companyId={companyId}
                orders={orders}
                appointments={appointments}
                role={currentRole}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            )}

            {activeTab === 'mao-de-obra' && (
              <StaffView
                staffList={staffList}
                orders={orders}
                staffWorkLogs={staffWorkLogs}
                onAddStaff={(staff) => setStaffList([...staffList, staff])}
                onUpdateStaff={(staff) => setStaffList(staffList.map((s) => (s.id === staff.id ? staff : s)))}
                onRemoveStaff={(id) => setStaffList(staffList.filter((s) => s.id !== id))}
                onReassignOrder={handleUpdateDetailer}
                onOpenOSModal={(order) => setSelectedOrderForModal(order)}
              />
            )}

            {activeTab === 'catalogo' && (
              <CatalogView
                servicesCatalog={servicesCatalog}
                productsCatalog={productsCatalog}
                combosCatalog={combosCatalog}
                shopSettings={shopSettings}
                staffList={staffList}
                initialTab="servicos"
                onAddService={handleAddCatalogService}
                onUpdateService={handleUpdateCatalogService}
                onRemoveService={handleRemoveCatalogService}
                onAddProduct={handleAddCatalogProduct}
                onUpdateProduct={handleUpdateCatalogProduct}
                onRemoveProduct={handleRemoveCatalogProduct}
                onAdjustProductStock={handleAdjustProductStock}
                onAddCombo={handleAddCatalogCombo}
                onUpdateCombo={handleUpdateCatalogCombo}
                onRemoveCombo={handleRemoveCatalogCombo}
                onOpenQuickStockOutflow={() => setIsQuickStockModalOpen(true)}
                onOpenPurchaseOrder={() => setIsPurchaseOrderModalOpen(true)}
              />
            )}

            {activeTab === 'combos' && (
              <CatalogView
                servicesCatalog={servicesCatalog}
                productsCatalog={productsCatalog}
                combosCatalog={combosCatalog}
                shopSettings={shopSettings}
                staffList={staffList}
                initialTab="combos"
                onAddService={handleAddCatalogService}
                onUpdateService={handleUpdateCatalogService}
                onRemoveService={handleRemoveCatalogService}
                onAddProduct={handleAddCatalogProduct}
                onUpdateProduct={handleUpdateCatalogProduct}
                onRemoveProduct={handleRemoveCatalogProduct}
                onAdjustProductStock={handleAdjustProductStock}
                onAddCombo={handleAddCatalogCombo}
                onUpdateCombo={handleUpdateCatalogCombo}
                onRemoveCombo={handleRemoveCatalogCombo}
                onOpenQuickStockOutflow={() => setIsQuickStockModalOpen(true)}
                onOpenPurchaseOrder={() => setIsPurchaseOrderModalOpen(true)}
              />
            )}

            {activeTab === 'configuracoes' && (
              <SettingsView
                settings={shopSettings}
                onSaveSettings={setShopSettings}
                servicesCatalog={servicesCatalog}
                onAddCatalogService={handleAddCatalogService}
                onRemoveCatalogService={handleRemoveCatalogService}
              />
            )}
          </div>
          <AgendaDetailerFooter />
        </main>
      </div>

      {/* OS Detail Modal */}
      {selectedOrderForModal && (
        <OSDetailModal
          order={selectedOrderForModal}
          settings={shopSettings}
          onClose={() => setSelectedOrderForModal(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          onToggleProjectStep={handleToggleProjectStep}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onUpdatePaymentMethod={handleUpdatePaymentMethod}
        />
      )}

      {/* Quick Stock Outflow Modal (Baixa Flash em 3 Cliques) */}
      {isQuickStockModalOpen && (
        <QuickStockOutflowModal
          products={productsCatalog}
          shopSettings={shopSettings}
          onAdjustStock={handleAdjustProductStock}
          onOpenPurchaseOrder={() => setIsPurchaseOrderModalOpen(true)}
          onClose={() => setIsQuickStockModalOpen(false)}
        />
      )}

      {/* Purchase Order & Supplier WhatsApp Generator Modal */}
      {isPurchaseOrderModalOpen && (
        <PurchaseOrderModal
          products={productsCatalog}
          shopSettings={shopSettings}
          onClose={() => setIsPurchaseOrderModalOpen(false)}
        />
      )}
    </div>
  );
}

