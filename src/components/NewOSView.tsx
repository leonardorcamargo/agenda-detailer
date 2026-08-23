import React, { useState, useMemo } from 'react';
import { ServiceOrder, ServiceItem, DamagePoint, OSService, OSProjectStep, PaymentMethod } from '../types';
import { supabase } from '../lib/supabase';
import { VehicleInspectionDiagram } from './VehicleInspectionDiagram';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FileCheck, 
  AlertCircle,
  Car,
  User,
  Phone,
  Wrench,
  Fuel,
  X,
  Filter,
  Tag
} from 'lucide-react';

interface NewOSViewProps {
  companyId: string;
  servicesCatalog: ServiceItem[];
  nextOSNumber: number;
  onSaveOS: (order: ServiceOrder) => void;
  onCancel: () => void;
}

export const NewOSView: React.FC<NewOSViewProps> = ({
  companyId,
  servicesCatalog,
  nextOSNumber,
  onSaveOS,
  onCancel,
}) => {
  // 1. Vehicle State
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('Honda');
  const [model, setModel] = useState('Civic');
  const [color, setColor] = useState('Preto');
  const [year, setYear] = useState('2020');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // 2. Inspection State
  const [fuelLevel, setFuelLevel] = useState<'Reserva' | '1/4' | 'Meio Tanque' | '3/4' | 'Cheio'>('Meio Tanque');
  const [damages, setDamages] = useState<DamagePoint[]>([]);
  const [checklistItems, setChecklistItems] = useState({
    riscosPintura: false,
    mossasAmassados: false,
    vidroTrincado: false,
    rodasRaladas: false,
    pertencesPessoais: true,
    pneuEstepeOk: true,
  });
  const [inspectionNotes, setInspectionNotes] = useState('');

  // 3. Services State
  const [selectedServices, setSelectedServices] = useState<OSService[]>([
    { serviceId: 's1', name: 'Lavagem Simples', price: 80 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('Todas');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState<number | ''>('');

  // 4. Details State
  const [customDescription, setCustomDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pendente');
  const [paymentStatus, setPaymentStatus] = useState<'Pago' | 'Pendente' | 'Parcial' | 'Fiado'>('Pendente');

  const handleAddCustomService = () => {
    if (!customServiceName.trim()) return;
    const priceVal = typeof customServicePrice === 'number' ? customServicePrice : 0;
    const newCustomService: OSService = {
      serviceId: 'custom-' + Date.now(),
      name: customServiceName.trim(),
      price: priceVal,
    };
    setSelectedServices([...selectedServices, newCustomService]);
    setCustomServiceName('');
    setCustomServicePrice('');
  };

  const handleRemoveCustomService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter((s) => s.serviceId !== serviceId));
  };

  // Consulta a placa no cadastro real da empresa
  const handleConsultarPlaca = async () => {
    const cleanPlate = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanPlate) {
      setLookupMessage('Por favor, informe uma placa para consultar.');
      return;
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, color, year, customer:customers(name, phone)')
      .eq('company_id', companyId)
      .eq('plate', cleanPlate)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Erro ao consultar veículo.', error);
      setLookupMessage('Não foi possível consultar a placa agora.');
      return;
    }

    if (!vehicle) {
      setBrand('');
      setModel('');
      setColor('');
      setYear('');
      setClientName('');
      setClientPhone('');
      setLookupMessage('Veículo não encontrado no cadastro. Preencha os dados para um novo veículo.');
      return;
    }

    setPlate(vehicle.plate);
    setBrand(vehicle.brand ?? '');
    setModel(vehicle.model ?? '');
    setColor(vehicle.color ?? '');
    setYear(vehicle.year ?? '');

    const customer = Array.isArray(vehicle.customer) ? vehicle.customer[0] : vehicle.customer;
    setClientName(customer?.name ?? '');
    setClientPhone(customer?.phone ?? '');
    setLookupMessage('Veículo localizado no cadastro da empresa.');
  };

  // Service toggle selection
  const handleToggleService = (item: ServiceItem) => {
    const exists = selectedServices.some((s) => s.serviceId === item.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.serviceId !== item.id));
    } else {
      setSelectedServices([...selectedServices, { serviceId: item.id, name: item.name, price: item.defaultPrice }]);
    }
  };

  const handleUpdateServicePrice = (serviceId: string, newPrice: number) => {
    setSelectedServices(
      selectedServices.map((s) => (s.serviceId === serviceId ? { ...s, price: newPrice } : s))
    );
  };

  // Categories list for services filter
  const serviceCategories = useMemo(() => {
    const defaultCats = ['Todas'];
    const cats = Array.from(new Set(servicesCatalog.map((s) => s.category).filter(Boolean)));
    return [...defaultCats, ...cats];
  }, [servicesCatalog]);

  // Filtered Services in New OS
  const filteredServicesCatalog = useMemo(() => {
    return servicesCatalog.filter((service) => {
      const q = serviceSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        service.name.toLowerCase().includes(q) ||
        (service.description && service.description.toLowerCase().includes(q)) ||
        (service.category && service.category.toLowerCase().includes(q)) ||
        (service.tags && service.tags.some((t) => t.toLowerCase().includes(q)));
      const matchCategory =
        serviceCategoryFilter === 'Todas' || service.category === serviceCategoryFilter;
      return matchQuery && matchCategory;
    });
  }, [servicesCatalog, serviceSearchQuery, serviceCategoryFilter]);

  // Calculation
  let finalServices = [...selectedServices];
  if (customServiceName.trim()) {
    const priceVal = typeof customServicePrice === 'number' ? customServicePrice : 0;
    // Check if custom service isn't already in selectedServices
    if (!finalServices.some((s) => s.name.toLowerCase() === customServiceName.trim().toLowerCase())) {
      finalServices.push({
        serviceId: 'custom-' + Date.now(),
        name: customServiceName.trim(),
        price: priceVal,
      });
    }
  }

  const subtotal = finalServices.reduce((acc, s) => acc + (s.price || 0), 0);
  const totalValue = Math.max(0, subtotal - discount);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      setLookupMessage('Empresa não identificada. Entre novamente no sistema.');
      return;
    }

    const cleanPlate = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanClientName = clientName.trim();
    const cleanClientPhone = clientPhone.trim();

    if (!cleanPlate || !cleanClientName) {
      setLookupMessage('Informe ao menos a placa e o nome do cliente.');
      return;
    }

    let customerId: string | null = null;

    if (cleanClientPhone) {
      const { data: existingCustomer, error } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .eq('phone', cleanClientPhone)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao localizar cliente.', error);
        setLookupMessage('Não foi possível verificar o cliente.');
        return;
      }

      customerId = existingCustomer?.id ?? null;
    }

    if (!customerId) {
      const { data: existingCustomer, error } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', cleanClientName)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao localizar cliente pelo nome.', error);
        setLookupMessage('Não foi possível verificar o cliente.');
        return;
      }

      customerId = existingCustomer?.id ?? null;
    }

    if (!customerId) {
      const { data: createdCustomer, error } = await supabase
        .from('customers')
        .insert({
          company_id: companyId,
          name: cleanClientName,
          phone: cleanClientPhone || null,
        })
        .select('id')
        .single();

      if (error || !createdCustomer) {
        console.error('Erro ao cadastrar cliente.', error);
        setLookupMessage('Não foi possível cadastrar o cliente.');
        return;
      }

      customerId = createdCustomer.id;
    }

    const { data: existingVehicle, error: vehicleLookupError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', companyId)
      .eq('plate', cleanPlate)
      .limit(1)
      .maybeSingle();

    if (vehicleLookupError) {
      console.error('Erro ao localizar veículo.', vehicleLookupError);
      setLookupMessage('Não foi possível verificar o veículo.');
      return;
    }

    const vehicleData = {
      customer_id: customerId,
      plate: cleanPlate,
      brand: brand.trim() || null,
      model: model.trim() || null,
      color: color.trim() || null,
      year: year.trim() || null,
      active: true,
    };

    let vehicleId: string;

    if (existingVehicle) {
      vehicleId = existingVehicle.id;

      const { error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', existingVehicle.id)
        .eq('company_id', companyId);

      if (error) {
        console.error('Erro ao atualizar veículo.', error);
        setLookupMessage('Não foi possível atualizar o veículo.');
        return;
      }
    } else {
      const { data: createdVehicle, error } = await supabase
        .from('vehicles')
        .insert({ company_id: companyId, ...vehicleData })
        .select('id')
        .single();

      if (error || !createdVehicle) {
        console.error('Erro ao cadastrar veículo.', error);
        setLookupMessage('Não foi possível cadastrar o veículo.');
        return;
      }

      vehicleId = createdVehicle.id;
    }
const { data: lastOrder, error: numberError } = await supabase
.from('service_orders')
.select('os_number')
.eq('company_id', companyId)
.order('os_number', { ascending: false })
.limit(1)
.maybeSingle();

if (numberError) {
console.error('Erro ao calcular número da OS.', numberError);
setLookupMessage('Não foi possível calcular o número da Ordem de Serviço.');
return;
}

const realOSNumber = lastOrder?.os_number
? Number(lastOrder.os_number) + 1
: 1006;
    const { data: createdOrder, error: orderError } = await supabase
      .from('service_orders')
      .insert({
        company_id: companyId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        os_number: realOSNumber,
        status: 'Aguardando',
        custom_description: customDescription.trim() || null,
        discount,
        total_value: totalValue,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      })
      .select('id')
      .single();

    if (orderError || !createdOrder) {
      console.error('Erro ao cadastrar Ordem de Serviço.', orderError);
      setLookupMessage('Não foi possível salvar a Ordem de Serviço.');
      return;
    }

    if (finalServices.length > 0) {
      const { error: servicesError } = await supabase
        .from('service_order_services')
        .insert(
          finalServices.map((service) => ({
            service_order_id: createdOrder.id,
            service_name: service.name,
            unit_price: service.price || 0,
            quantity: 1,
          }))
        );

      if (servicesError) {
        console.error('Erro ao salvar serviços da OS.', servicesError);

        await supabase
          .from('service_orders')
          .delete()
          .eq('id', createdOrder.id)
          .eq('company_id', companyId);

        setLookupMessage('Não foi possível salvar os serviços da Ordem de Serviço.');
        return;
      }
    }

    const newOrder: ServiceOrder = {
     id: createdOrder.id,
      osNumber: realOSNumber,
      createdAt: new Date().toISOString(),
      status: 'Aguardando',
      plate: cleanPlate,
      brand: brand || 'Genérico',
      model: model || 'Veículo',
      color: color || 'Preto',
      year: year || '2020',
      clientName: clientName || 'Cliente Balcão',
      clientPhone: clientPhone || '(11) 99999-9999',
      fuelLevel,
      damages,
      checklistItems,
      inspectionNotes,
      services: finalServices,
      discount,
      totalValue,
      customDescription,
      projectSteps: [],
      paymentMethod,
      paymentStatus,
    };

    onSaveOS(newOrder);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-5xl mx-auto pb-40 md:pb-24">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Nova Ordem de Serviço</h2>
        <p className="text-xs text-slate-400 mt-1">
          A OS recebe numeração sequencial automática (#{nextOSNumber}) e entra no pátio como "Aguardando".
        </p>
      </div>

      {/* SECTION 1: Identificação do veículo (Matching Screenshot 3) */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-400" />
          Identificação do veículo
        </h3>

        {/* Digitar placa & Consultar placa */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Digitar placa
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="ABC1234"
              className="flex-1 bg-[#1a2436] border border-[#283854] text-white px-4 py-2.5 rounded-xl font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleConsultarPlaca}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-900/20 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Consultar placa</span>
            </button>
          </div>
          {lookupMessage && (
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {lookupMessage}
            </p>
          )}
        </div>

        {/* Marca, Modelo, Cor, Ano */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ex: Honda"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Modelo</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex: Civic"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cor</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ex: Preto"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ano</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Ex: 2020"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Client Name & WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#23314a]">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Nome do cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp do cliente
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Checklist de vistoria (Matching Screenshot 4) */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-400" />
          Checklist de vistoria
        </h3>

        {/* Nível de combustível */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-400" /> Nível de combustível
          </label>
          <select
            value={fuelLevel}
            onChange={(e: any) => setFuelLevel(e.target.value)}
            className="w-full md:w-72 bg-[#1a2436] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="Reserva">Reserva (Crítico)</option>
            <option value="1/4">1/4 Tanque</option>
            <option value="Meio Tanque">Meio Tanque</option>
            <option value="3/4">3/4 Tanque</option>
            <option value="Cheio">Cheio</option>
          </select>
        </div>

        {/* Interactive Damage Diagram & Quick Check Buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Avarias aparentes & Inspeção
          </label>
          <VehicleInspectionDiagram
            damages={damages}
            onChangeDamages={setDamages}
            checklistItems={checklistItems}
            onChangeChecklist={setChecklistItems}
          />
        </div>

        {/* Observações gerais da vistoria */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Observações gerais da vistoria
          </label>
          <textarea
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
            rows={3}
            placeholder="Detalhes relevantes sobre o estado do veículo no recebimento..."
            className="w-full bg-[#1a2436] border border-[#283854] text-white p-3 rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>
      </div>

      {/* SECTION 3: Serviços e valores (Matching Screenshot 4 & 5) */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              Serviços e valores
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Selecione os serviços do catálogo ou busque por nome, categoria e procedimentos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              {selectedServices.length} serviço(s) na OS
            </span>
          </div>
        </div>

        {/* Search Field & Category Filter Toolbar */}
        <div className="bg-[#101726] border border-[#1f2b42] p-3 rounded-xl space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              placeholder="Buscar serviço no catálogo (ex: Lavagem, Polimento, Vitrificação, Higienização, Couro, Vidros...)"
              className="w-full bg-[#182338] border border-[#263757] text-white text-xs pl-9 pr-9 py-2 rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {serviceSearchQuery && (
              <button
                type="button"
                onClick={() => setServiceSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Categoria:
            </span>
            {serviceCategories.map((cat) => {
              const count = cat === 'Todas' 
                ? servicesCatalog.length 
                : servicesCatalog.filter(s => s.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setServiceCategoryFilter(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    serviceCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#182338] text-slate-400 hover:text-white hover:bg-[#202f4a] border border-[#263757]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Result Info */}
          {(serviceSearchQuery || serviceCategoryFilter !== 'Todas') && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1a253a]">
              <span>
                Exibindo <strong className="text-white">{filteredServicesCatalog.length}</strong> de {servicesCatalog.length} serviços encontrados
              </span>
              <button
                type="button"
                onClick={() => {
                  setServiceSearchQuery('');
                  setServiceCategoryFilter('Todas');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[10px]"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Services Selectable Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredServicesCatalog.map((service) => {
            const isSelected = selectedServices.some((s) => s.serviceId === service.id);
            const currentSelected = selectedServices.find((s) => s.serviceId === service.id);

            return (
              <div
                key={service.id}
                onClick={() => handleToggleService(service)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-sm'
                    : 'bg-[#182233] border-[#25334d] text-slate-300 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-100">{service.name}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-500 border-blue-400 text-white font-bold text-[10px]' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && '✓'}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                      {service.category}
                    </span>
                    {service.estimatedHours ? (
                      <span className="text-[9px] text-slate-400">
                        ~{service.estimatedHours}h
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Valor padrão: R$ {service.defaultPrice.toFixed(2)}
                  </span>
                  {isSelected && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-blue-400 font-medium">OS: R$</span>
                      <input
                        type="number"
                        value={currentSelected?.price || ''}
                        onChange={(e) =>
                          handleUpdateServicePrice(service.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-[#121929] border border-blue-500/40 text-white text-right px-2 py-0.5 rounded font-bold text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Result Fallback */}
        {filteredServicesCatalog.length === 0 && (
          <div className="bg-[#121929] border border-dashed border-[#25334d] p-6 rounded-xl text-center space-y-2.5">
            <Wrench className="w-8 h-8 text-slate-500 mx-auto" />
            <h5 className="text-xs font-bold text-white">Nenhum serviço encontrado para "{serviceSearchQuery}"</h5>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Você pode limpar a busca ou adicionar este serviço diretamente no formulário avulso abaixo.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setServiceSearchQuery('')}
                className="bg-[#1a2436] hover:bg-[#223049] text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2b3e61] transition-colors cursor-pointer"
              >
                Limpar Busca
              </button>
              {serviceSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomServiceName(serviceSearchQuery);
                    setServiceSearchQuery('');
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar como Avulso
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form de Serviço Avulso / Não existente no catálogo */}
        <div className="bg-[#182233] border border-[#25334d] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar Serviço Avulso / Fora do Catálogo
            </h4>
            <span className="text-[10px] text-slate-400">Preencha o tipo e valor para incluir na OS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Tipo / Nome do Serviço *
              </label>
              <input
                type="text"
                placeholder="Ex: Polimento de Farol, Higienização de Motor..."
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="w-full bg-[#121929] border border-[#2b3e61] text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Valor do Serviço (R$) *
              </label>
              <input
                type="number"
                placeholder="0,00"
                value={customServicePrice}
                onChange={(e) => setCustomServicePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-[#121929] border border-[#2b3e61] text-amber-400 font-bold px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleAddCustomService}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Incluir Serviço
              </button>
            </div>
          </div>
        </div>

        {/* Custom Services Added List */}
        {selectedServices.some((s) => s.serviceId.startsWith('custom-')) && (
          <div className="bg-[#182233] border border-amber-500/30 p-3.5 rounded-xl space-y-2">
            <span className="text-xs font-bold text-amber-400 block">Serviços Avulsos Incluídos:</span>
            <div className="space-y-2">
              {selectedServices
                .filter((s) => s.serviceId.startsWith('custom-'))
                .map((cs) => (
                  <div key={cs.serviceId} className="flex items-center justify-between bg-[#121929] border border-[#283854] px-3 py-2 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                        Avulso
                      </span>
                      <span className="font-bold text-white">{cs.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">R$</span>
                      <input
                        type="number"
                        value={cs.price}
                        onChange={(e) => handleUpdateServicePrice(cs.serviceId, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-[#1a2436] border border-[#2b3e61] text-amber-400 font-bold text-right px-2 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomService(cs.serviceId)}
                        className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Discount & Total Calculation */}
        <div className="bg-[#182233] border border-[#25334d] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Desconto (R$):</span>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              className="bg-[#121929] border border-[#2b3e61] text-white px-3 py-1.5 rounded-lg text-xs w-28 text-right focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
            <span className="text-[11px] text-slate-400 block">Subtotal: R$ {subtotal.toFixed(2)}</span>
            <div className="text-lg font-extrabold text-blue-400">
              Total da OS: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Detalhamento do atendimento & Pagamento */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight">Detalhamento do atendimento e Condições de Pagamento</h3>

        {/* Payment Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#182338] border border-[#263757] p-4 rounded-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Forma de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e: any) => {
                const method = e.target.value as PaymentMethod;
                setPaymentMethod(method);
                if (method === 'Fiado') {
                  setPaymentStatus('Fiado');
                }
              }}
              className="w-full bg-[#121929] border border-[#2c3f63] text-white font-bold text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Pendente">Pendente</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Fiado">Fiado / A Prazo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status do Pagamento
            </label>
            <select
              value={paymentStatus}
              onChange={(e: any) => {
                const status = e.target.value as 'Pago' | 'Pendente' | 'Parcial' | 'Fiado';
                setPaymentStatus(status);
                if (status === 'Fiado' && paymentMethod !== 'Fiado') {
                  setPaymentMethod('Fiado');
                }
              }}
              className="w-full bg-[#121929] border border-[#2c3f63] text-white font-bold text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
              <option value="Parcial">Parcial</option>
              <option value="Fiado">Fiado / A Prazo</option>
            </select>
          </div>
        </div>

        {/* Descrição Personalizada */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Descrição Personalizada / Observações Gerais
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            rows={3}
            placeholder="Discrimine o que foi combinado com o cliente..."
            className="w-full bg-[#1a2436] border border-[#283854] text-white p-3 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-[58px] md:bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur border-t border-[#1f293d] p-3.5 sm:p-4 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </form>
  );
};
