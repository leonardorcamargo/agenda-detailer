export type OSStatus = 'Aguardando' | 'Em Execução' | 'Pronto para Entrega' | 'Finalizado';

export type PaymentMethod = 'Cartão de Crédito' | 'Cartão de Débito' | 'Pix' | 'Dinheiro' | 'Crédito Parcelado' | 'Boleto Parcelado' | 'Fiado' | 'Pendente';

export interface DamagePoint {
  id: string;
  part: 'Frente' | 'Traseira' | 'Lateral Esquerda' | 'Lateral Direita' | 'Teto' | 'Vidros' | 'Rodas' | 'Interior';
  type: 'Risco' | 'Amassado' | 'Mancha' | 'Trincado' | 'Outro';
  severity: 'Leve' | 'Médio' | 'Grave';
  notes?: string;
  x: number; // percentage on diagram
  y: number; // percentage on diagram
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  category: string;
  estimatedHours: number;
  costPrice?: number;
  tags?: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  sku?: string;
  brand?: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice?: number;
  currentStock: number;
  minStock: number;
  description?: string;
  supplier?: string;
  location?: string; // Prateleira / Armário
  tags?: string[];
}

export interface ServiceComboItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  includedServices: string[]; // names or IDs
  originalPrice: number;
  comboPrice: number;
  estimatedHours: number;
  badge?: string;
}

export interface OSService {
  serviceId: string;
  name: string;
  price: number;
}

export interface OSProjectStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface ServiceOrder {
  id: string; // e.g. #1004
  osNumber: number;
  createdAt: string; // ISO or YYYY-MM-DD HH:mm
  deliveryEstimatedDate?: string;
  status: OSStatus;
  
  // Vehicle Info
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  
  // Customer Info
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  
  // Checklist Vistoria
  fuelLevel: 'Reserva' | '1/4' | 'Meio Tanque' | '3/4' | 'Cheio';
  damages: DamagePoint[];
  checklistItems: {
    riscosPintura: boolean;
    mossasAmassados: boolean;
    vidroTrincado: boolean;
    rodasRaladas: boolean;
    pertencesPessoais: boolean;
    pneuEstepeOk: boolean;
  };
  inspectionNotes: string;
  
  // Services & Values
  services: OSService[];
  discount: number;
  totalValue: number;
  
  // Details & Steps
  customDescription: string;
  projectSteps: OSProjectStep[];
  
  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado';
  
  // Detailer / Staff assigned
  assignedDetailer?: string;
}

export interface ShopExpense {
  id: string;
  date: string;
  description: string;
  category: 'Produtos' | 'Equipamentos' | 'Contas / Fixo' | 'Comissão' | 'Outros';
  value: number;
}

export interface VehicleHistoryItem {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  clientName: string;
  clientPhone: string;
  totalVisits: number;
  lastVisit: string;
}

export interface ShopSettings {
  id?: string;
  name: string;
  subtitle: string;
  shopCategory?: 'Estética Automotiva' | 'Studio Detailer' | 'Lava Rápido Premium' | 'Oficina Mecânica' | 'Funilaria e Pintura' | 'Lava Jato & Estética' | 'Centro Automotivo' | 'Loja de Acessórios' | 'Pneus e Alinhamento' | 'Operação Híbrida';
  phone: string;
  address: string;
  pixKey: string;
  ownerName: string;
  email?: string;
  logoUrl?: string; // Image URL or Base64 uploaded logo
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  cnpjCpf?: string;
  instagram?: string;
  businessAreas?: string[];
  enabledModules?: import('./lib/businessProfile').BusinessModule[];
  onboardingCompleted?: boolean;
}

export interface SaaSUserTenant {
  id: string;
  email: string;
  shopSettings: ShopSettings;
}

export interface StaffMember {
  workDays?: number[]; // 0 = domingo; undefined = escala não definida
  workScheduleFrom?: string; // Vigência da escala atual
  id: string;
  name: string;
  role: 'Master Detailer' | 'Polidor Especialista' | 'Higienizador' | 'Lavador Técnico' | 'Ajudante / Aprendiz' | 'Gerente de Pátio' | 'Freelancer / Diarista' | 'Empreiteiro';
  phone: string;
  contractType: 'Fixo / CLT' | 'Diarista (Diária Fixa)' | 'Empreiteiro / Freelancer (por Serviço)';
  dailyRate?: number; // Valor da diária para diarista (ex: R$ 150/dia)
  commissionRate: number; // e.g. 15 for 15%
  commissionType: 'Porcentagem' | 'Valor Fixo por OS' | 'Diária Fixa' | 'Valor de Empreita por OS';
  fixedCommissionValue?: number;
  status: 'Ativo' | 'Inativo' | 'Férias';
  avatarUrl?: string;
  specialties?: string[];
  pixKey?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicleModel: string; // e.g. "Porsche 911 Carrera S"
  vehiclePlate: string;
  services: string[]; // e.g. ["Vitrificação 9H", "Higienização Interna"]
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00"
  estimatedDurationHours: number;
  assignedDetailer?: string;
  notes?: string;
  status: 'Agendado' | 'Confirmado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  estimatedValue: number;
  convertedOSNumber?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado';
}

export interface DailyCalendarNote {
  id: string;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string;
  category?: 'Geral' | 'Pátio' | 'Insumos' | 'Cliente VIP' | 'Aviso';
}

export interface StaffWorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  status: 'Presente' | 'Meio Período' | 'Falta' | 'Folga' | 'Atraso' | 'Saída antecipada' | 'Atraso e saída antecipada' | 'Por horário';
  arrivalTime?: string;
  departureTime?: string;
  departureNextDay?: boolean;
  dailyRateCharged?: number;
  notes?: string;
}
