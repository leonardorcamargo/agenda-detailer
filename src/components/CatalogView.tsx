import React, { useState, useMemo } from 'react';
import { ServiceItem, ProductItem, ServiceComboItem, ShopSettings, StaffMember } from '../types';
import { PRESET_CATALOG_IDEAS } from '../data/mockData';
import { ComboPromotionModal } from './ComboPromotionModal';
import { 
  Wrench, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Tag, 
  CheckCircle2, 
  X, 
  Save, 
  Layers, 
  Filter, 
  Boxes, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  Info,
  Copy,
  FolderPlus,
  Zap,
  Percent,
  PlusCircle,
  MapPin,
  Flame,
  Star,
  Download,
  Upload,
  SlidersHorizontal,
  Lightbulb,
  Megaphone,
  Share2
} from 'lucide-react';

interface CatalogViewProps {
  servicesCatalog: ServiceItem[];
  productsCatalog: ProductItem[];
  combosCatalog: ServiceComboItem[];
  shopSettings?: ShopSettings;
  staffList?: StaffMember[];
  initialTab?: 'servicos' | 'produtos' | 'combos' | 'templates';
  onAddService: (service: ServiceItem) => void;
  onUpdateService: (service: ServiceItem) => void;
  onRemoveService: (id: string) => void;
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onRemoveProduct: (id: string) => void;
  onAdjustProductStock: (id: string, delta: number) => void;
  onAddCombo: (combo: ServiceComboItem) => void;
  onUpdateCombo: (combo: ServiceComboItem) => void;
  onRemoveCombo: (id: string) => void;
  onOpenQuickStockOutflow?: () => void;
  onOpenPurchaseOrder?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  servicesCatalog,
  productsCatalog,
  combosCatalog = [],
  shopSettings,
  staffList = [],
  initialTab = 'servicos',
  onAddService,
  onUpdateService,
  onRemoveService,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onAdjustProductStock,
  onAddCombo,
  onUpdateCombo,
  onRemoveCombo,
  onOpenQuickStockOutflow,
  onOpenPurchaseOrder,
}) => {
  // Main sub-tab switcher: 'servicos' | 'produtos' | 'combos' | 'templates'
  const [catalogTab, setCatalogTab] = useState<'servicos' | 'produtos' | 'combos' | 'templates'>(initialTab);

  // Sync tab if initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setCatalogTab(initialTab);
    }
  }, [initialTab]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'nome' | 'preco-desc' | 'preco-asc' | 'estoque-asc'>('nome');

  // Quick Action Modal / Drawer
  const [isQuickCreateMenuOpen, setIsQuickCreateMenuOpen] = useState(false);

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [customServiceCategoryInput, setCustomServiceCategoryInput] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [customProductCategoryInput, setCustomProductCategoryInput] = useState('');
  const [isCustomProductCatMode, setIsCustomProductCatMode] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [isCustomUnitMode, setIsCustomUnitMode] = useState(false);

  // Combo Modal State
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ServiceComboItem | null>(null);
  const [promotingCombo, setPromotingCombo] = useState<ServiceComboItem | null>(null);

  // Feedback Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Service Form State
  const [serviceForm, setServiceForm] = useState<{
    name: string;
    description: string;
    defaultPrice: number;
    category: string;
    estimatedHours: number;
    costPrice: number;
    tags: string;
  }>({
    name: '',
    description: '',
    defaultPrice: 150,
    category: 'Lavagem',
    estimatedHours: 2,
    costPrice: 20,
    tags: 'Popular, Detalhamento',
  });

  // Product Form State
  const [productForm, setProductForm] = useState<{
    name: string;
    sku: string;
    brand: string;
    category: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    currentStock: number;
    minStock: number;
    description: string;
    supplier: string;
    location: string;
    tags: string;
  }>({
    name: '',
    sku: '',
    brand: 'Vonixx',
    category: 'Químicos & Shampoos',
    unit: 'Litros',
    costPrice: 50,
    salePrice: 80,
    currentStock: 5,
    minStock: 2,
    description: '',
    supplier: 'Distribuidora Detailer Brasil',
    location: 'Prateleira A1',
    tags: 'Uso Interno',
  });

  // Combo Form State
  const [comboForm, setComboForm] = useState<{
    name: string;
    category: string;
    description: string;
    includedServices: string[];
    comboPrice: number;
    estimatedHours: number;
    badge: string;
  }>({
    name: '',
    category: 'Combos & Pacotes',
    description: '',
    includedServices: [],
    comboPrice: 450,
    estimatedHours: 4,
    badge: 'Mais Vendido',
  });

  // Collect all unique categories dynamically
  const serviceCategories = useMemo(() => {
    const defaultCats = ['Lavagem', 'Polimento', 'Higienização', 'Proteção', 'Vidros', 'Martelinho & Funilaria', 'PPF & Películas', 'Tapeçaria', 'Outros'];
    const usedCats = servicesCatalog.map(s => s.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...usedCats]));
  }, [servicesCatalog]);

  const productCategories = useMemo(() => {
    const defaultCats = [
      'Químicos & Shampoos',
      'Ceras & Selantes',
      'Compostos Polidores',
      'Boinas & Acessórios',
      'Flanelas & Microfibras',
      'Proteção & Vitrificadores',
      'Aromatizantes & Finalizadores',
      'Equipamentos & EPIs',
      'Outros Insumos'
    ];
    const usedCats = productsCatalog.map(p => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...usedCats]));
  }, [productsCatalog]);

  // Metrics Calculations
  const totalServices = servicesCatalog.length;
  const avgServicePrice = totalServices > 0 
    ? servicesCatalog.reduce((acc, s) => acc + s.defaultPrice, 0) / totalServices 
    : 0;

  const totalProductTypes = productsCatalog.length;
  const totalStockUnits = productsCatalog.reduce((acc, p) => acc + p.currentStock, 0);
  const totalStockValueCost = productsCatalog.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const lowStockCount = productsCatalog.filter((p) => p.currentStock <= p.minStock).length;
  const totalCombos = combosCatalog.length;

  // Filtered Services
  const filteredServices = useMemo(() => {
    return servicesCatalog
      .filter((s) => {
        const query = searchQuery.toLowerCase();
        const matchQuery = s.name.toLowerCase().includes(query) || 
          (s.description && s.description.toLowerCase().includes(query)) ||
          (s.category && s.category.toLowerCase().includes(query)) ||
          (s.tags && s.tags.some(t => t.toLowerCase().includes(query)));
        const matchCategory = selectedCategory === 'Todas' || s.category === selectedCategory;
        return matchQuery && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'preco-desc') return b.defaultPrice - a.defaultPrice;
        if (sortBy === 'preco-asc') return a.defaultPrice - b.defaultPrice;
        return a.name.localeCompare(b.name);
      });
  }, [servicesCatalog, searchQuery, selectedCategory, sortBy]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productsCatalog
      .filter((p) => {
        const query = searchQuery.toLowerCase();
        const matchQuery = p.name.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query)) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.supplier && p.supplier.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(query)));
        const matchCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        const matchLowStock = !onlyLowStock || p.currentStock <= p.minStock;
        return matchQuery && matchCategory && matchLowStock;
      })
      .sort((a, b) => {
        if (sortBy === 'preco-desc') return (b.salePrice || b.costPrice) - (a.salePrice || a.costPrice);
        if (sortBy === 'preco-asc') return (a.salePrice || a.costPrice) - (b.salePrice || b.costPrice);
        if (sortBy === 'estoque-asc') return a.currentStock - b.currentStock;
        return a.name.localeCompare(b.name);
      });
  }, [productsCatalog, searchQuery, selectedCategory, onlyLowStock, sortBy]);

  // Filtered Combos
  const filteredCombos = useMemo(() => {
    return combosCatalog.filter((c) => {
      const query = searchQuery.toLowerCase();
      const matchQuery = c.name.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.includedServices && c.includedServices.some(s => s.toLowerCase().includes(query)));
      return matchQuery;
    });
  }, [combosCatalog, searchQuery]);

  // Service Modal Helpers
  const handleOpenServiceModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || '',
        defaultPrice: service.defaultPrice,
        category: service.category || 'Lavagem',
        estimatedHours: service.estimatedHours || 1,
        costPrice: service.costPrice || 0,
        tags: service.tags ? service.tags.join(', ') : '',
      });
      setIsCustomCategoryMode(false);
    } else {
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        defaultPrice: 150,
        category: 'Lavagem',
        estimatedHours: 2,
        costPrice: 20,
        tags: 'Novo, Destaque',
      });
      setIsCustomCategoryMode(false);
      setCustomServiceCategoryInput('');
    }
    setIsServiceModalOpen(true);
  };

  const handleDuplicateService = (service: ServiceItem) => {
    const duplicated: ServiceItem = {
      ...service,
      id: 'srv_' + Date.now(),
      name: `${service.name} (Cópia / Variação)`,
      defaultPrice: service.defaultPrice,
    };
    onAddService(duplicated);
    showNotification(`Serviço "${duplicated.name}" duplicado! Você pode editá-lo.`);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;

    const finalCategory = isCustomCategoryMode && customServiceCategoryInput.trim()
      ? customServiceCategoryInput.trim()
      : serviceForm.category;

    const tagsArray = serviceForm.tags
      ? serviceForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (editingService) {
      onUpdateService({
        ...editingService,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        defaultPrice: Number(serviceForm.defaultPrice) || 0,
        category: finalCategory,
        estimatedHours: Number(serviceForm.estimatedHours) || 1,
        costPrice: Number(serviceForm.costPrice) || 0,
        tags: tagsArray,
      });
      showNotification(`Serviço "${serviceForm.name}" atualizado com sucesso!`);
    } else {
      const newService: ServiceItem = {
        id: 'srv_' + Date.now(),
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        defaultPrice: Number(serviceForm.defaultPrice) || 0,
        category: finalCategory,
        estimatedHours: Number(serviceForm.estimatedHours) || 1,
        costPrice: Number(serviceForm.costPrice) || 0,
        tags: tagsArray,
      };
      onAddService(newService);
      showNotification(`Novo serviço "${newService.name}" criado no catálogo!`);
    }
    setIsServiceModalOpen(false);
  };

  // Product Modal Helpers
  const handleOpenProductModal = (product?: ProductItem) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        sku: product.sku || '',
        brand: product.brand || '',
        category: product.category || 'Químicos & Shampoos',
        unit: product.unit || 'Unidade',
        costPrice: product.costPrice,
        salePrice: product.salePrice || 0,
        currentStock: product.currentStock,
        minStock: product.minStock,
        description: product.description || '',
        supplier: product.supplier || '',
        location: product.location || '',
        tags: product.tags ? product.tags.join(', ') : '',
      });
      setIsCustomProductCatMode(false);
      setIsCustomUnitMode(false);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: 'Vonixx',
        category: 'Químicos & Shampoos',
        unit: 'Litros',
        costPrice: 45,
        salePrice: 75,
        currentStock: 6,
        minStock: 2,
        description: '',
        supplier: 'Distribuidora Detailer Brasil',
        location: 'Prateleira A',
        tags: 'Uso Interno',
      });
      setIsCustomProductCatMode(false);
      setIsCustomUnitMode(false);
      setCustomProductCategoryInput('');
      setCustomUnitInput('');
    }
    setIsProductModalOpen(true);
  };

  const handleDuplicateProduct = (product: ProductItem) => {
    const duplicated: ProductItem = {
      ...product,
      id: 'prod_' + Date.now(),
      name: `${product.name} (Variação)`,
      sku: `${product.sku || 'SKU'}-VAR`,
      currentStock: 0,
    };
    onAddProduct(duplicated);
    showNotification(`Produto "${duplicated.name}" duplicado! Ajuste o estoque inicial.`);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const finalCategory = isCustomProductCatMode && customProductCategoryInput.trim()
      ? customProductCategoryInput.trim()
      : productForm.category;

    const finalUnit = isCustomUnitMode && customUnitInput.trim()
      ? customUnitInput.trim()
      : productForm.unit;

    const tagsArray = productForm.tags
      ? productForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        brand: productForm.brand.trim(),
        category: finalCategory,
        unit: finalUnit,
        costPrice: Number(productForm.costPrice) || 0,
        salePrice: Number(productForm.salePrice) || 0,
        currentStock: Number(productForm.currentStock) || 0,
        minStock: Number(productForm.minStock) || 0,
        description: productForm.description.trim(),
        supplier: productForm.supplier.trim(),
        location: productForm.location.trim(),
        tags: tagsArray,
      });
      showNotification(`Produto "${productForm.name}" atualizado!`);
    } else {
      const newProduct: ProductItem = {
        id: 'prod_' + Date.now(),
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: productForm.brand.trim(),
        category: finalCategory,
        unit: finalUnit,
        costPrice: Number(productForm.costPrice) || 0,
        salePrice: Number(productForm.salePrice) || 0,
        currentStock: Number(productForm.currentStock) || 0,
        minStock: Number(productForm.minStock) || 0,
        description: productForm.description.trim(),
        supplier: productForm.supplier.trim(),
        location: productForm.location.trim(),
        tags: tagsArray,
      };
      onAddProduct(newProduct);
      showNotification(`Novo produto "${newProduct.name}" cadastrado no estoque!`);
    }
    setIsProductModalOpen(false);
  };

  // Combo Modal Helpers
  const handleOpenComboModal = (combo?: ServiceComboItem) => {
    if (combo) {
      setEditingCombo(combo);
      setComboForm({
        name: combo.name,
        category: combo.category || 'Combos & Pacotes',
        description: combo.description || '',
        includedServices: combo.includedServices || [],
        comboPrice: combo.comboPrice,
        estimatedHours: combo.estimatedHours || 4,
        badge: combo.badge || 'Destaque',
      });
    } else {
      setEditingCombo(null);
      // Select first two services by default if available
      const initialServices = servicesCatalog.slice(0, 2).map(s => s.name);
      const initialSum = servicesCatalog.slice(0, 2).reduce((acc, s) => acc + s.defaultPrice, 0);
      setComboForm({
        name: 'Combo Estética Express',
        category: 'Combos & Pacotes',
        description: 'Pacote promocional com desconto especial para o cliente.',
        includedServices: initialServices,
        comboPrice: Math.round(initialSum * 0.85),
        estimatedHours: 4,
        badge: 'Mais Vendido',
      });
    }
    setIsComboModalOpen(true);
  };

  const handleToggleServiceInCombo = (serviceName: string) => {
    const exists = comboForm.includedServices.includes(serviceName);
    const updated = exists 
      ? comboForm.includedServices.filter(s => s !== serviceName)
      : [...comboForm.includedServices, serviceName];

    // Calculate sum of selected services to suggest discounted price
    const matchedServices = servicesCatalog.filter(s => updated.includes(s.name));
    const sumPrice = matchedServices.reduce((acc, s) => acc + s.defaultPrice, 0);
    const sumHours = matchedServices.reduce((acc, s) => acc + (s.estimatedHours || 1), 0);

    setComboForm({
      ...comboForm,
      includedServices: updated,
      comboPrice: comboForm.comboPrice === 0 || exists ? Math.round(sumPrice * 0.85) : comboForm.comboPrice,
      estimatedHours: sumHours || 2,
    });
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboForm.name.trim() || comboForm.includedServices.length === 0) {
      alert('Selecione ao menos um serviço para compor o combo/pacote.');
      return;
    }

    const matchedServices = servicesCatalog.filter(s => comboForm.includedServices.includes(s.name));
    const sumPrice = matchedServices.reduce((acc, s) => acc + s.defaultPrice, 0);

    if (editingCombo) {
      onUpdateCombo({
        ...editingCombo,
        name: comboForm.name.trim(),
        description: comboForm.description.trim(),
        category: comboForm.category,
        includedServices: comboForm.includedServices,
        originalPrice: sumPrice || comboForm.comboPrice,
        comboPrice: Number(comboForm.comboPrice) || 0,
        estimatedHours: Number(comboForm.estimatedHours) || 2,
        badge: comboForm.badge.trim(),
      });
      showNotification(`Combo "${comboForm.name}" atualizado!`);
    } else {
      const newCombo: ServiceComboItem = {
        id: 'combo_' + Date.now(),
        name: comboForm.name.trim(),
        description: comboForm.description.trim(),
        category: comboForm.category,
        includedServices: comboForm.includedServices,
        originalPrice: sumPrice || comboForm.comboPrice,
        comboPrice: Number(comboForm.comboPrice) || 0,
        estimatedHours: Number(comboForm.estimatedHours) || 2,
        badge: comboForm.badge.trim(),
      };
      onAddCombo(newCombo);
      showNotification(`Novo Combo "${newCombo.name}" adicionado ao catálogo!`);
    }
    setIsComboModalOpen(false);
  };

  // Add Preset Idea Directly
  const handleAddPresetService = (preset: typeof PRESET_CATALOG_IDEAS.services[0]) => {
    const newService: ServiceItem = {
      id: 'srv_' + Date.now(),
      name: preset.name,
      category: preset.category,
      defaultPrice: preset.defaultPrice,
      costPrice: preset.costPrice,
      estimatedHours: preset.estimatedHours,
      description: preset.description,
      tags: ['Sugerido', 'Alta Demanda'],
    };
    onAddService(newService);
    showNotification(`Serviço "${preset.name}" adicionado ao catálogo de serviços!`);
  };

  const handleAddPresetProduct = (preset: typeof PRESET_CATALOG_IDEAS.products[0]) => {
    const newProduct: ProductItem = {
      id: 'prod_' + Date.now(),
      name: preset.name,
      sku: preset.sku,
      brand: preset.brand,
      category: preset.category,
      unit: preset.unit,
      costPrice: preset.costPrice,
      salePrice: preset.salePrice,
      currentStock: preset.currentStock,
      minStock: preset.minStock,
      description: preset.description,
      supplier: preset.supplier,
      tags: ['Insumo Recomendado'],
    };
    onAddProduct(newProduct);
    showNotification(`Produto "${preset.name}" adicionado ao catálogo e estoque!`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Multi-Creation Hub */}
      <div className="bg-[#141c2b] border border-[#23314a] p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Centro de Expansão & Catálogo
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Criação Ilimitada
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Catálogo de Serviços, Matéria-Prima & Combos
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Crie novos serviços personalizados, adicione matérias-primas e químicos ao estoque, monte pacotes com desconto ou use a biblioteca de sugestões prontas para expandir a gama da sua estética automotiva.
            </p>
          </div>

          {/* Quick Creation Buttons Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenServiceModal()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Novo Serviço
            </button>

            <button
              onClick={() => handleOpenProductModal()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" /> + Novo Insumo / Produto
            </button>

            <button
              onClick={() => handleOpenComboModal()}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" /> + Novo Pacote / Combo
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setCatalogTab('servicos')}
          className={`border rounded-2xl p-4 transition-all cursor-pointer ${
            catalogTab === 'servicos' 
              ? 'bg-[#182338] border-blue-500/60 shadow-md ring-1 ring-blue-500/30' 
              : 'bg-[#141c2b] border-[#23314a] hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Serviços Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-white">{totalServices}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Preço médio: R$ {avgServicePrice.toFixed(2)}</p>
          </div>
        </div>

        <div 
          onClick={() => setCatalogTab('produtos')}
          className={`border rounded-2xl p-4 transition-all cursor-pointer ${
            catalogTab === 'produtos' 
              ? 'bg-[#182338] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30' 
              : 'bg-[#141c2b] border-[#23314a] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Insumos & Produtos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-white">{totalProductTypes}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalStockUnits} itens no estoque físico</p>
          </div>
        </div>

        <div 
          onClick={() => setCatalogTab('combos')}
          className={`border rounded-2xl p-4 transition-all cursor-pointer ${
            catalogTab === 'combos' 
              ? 'bg-[#182338] border-amber-500/60 shadow-md ring-1 ring-amber-500/30' 
              : 'bg-[#141c2b] border-[#23314a] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Pacotes & Combos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-400">{totalCombos}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Combinações promocionais</p>
          </div>
        </div>

        <div className={`bg-[#141c2b] border rounded-2xl p-4 transition-colors ${
          lowStockCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-[#23314a]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Alerta de Reposição</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              lowStockCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-black ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Patrimônio: R$ {totalStockValueCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Catalog Switcher Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23314a] pb-3">
        <div className="flex items-center gap-2 bg-[#121929] border border-[#23314a] p-1 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setCatalogTab('servicos'); setSelectedCategory('Todas'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              catalogTab === 'servicos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Serviços ({totalServices})</span>
          </button>

          <button
            onClick={() => { setCatalogTab('produtos'); setSelectedCategory('Todas'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              catalogTab === 'produtos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produtos & Insumos ({totalProductTypes})</span>
            {lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" title="Há produtos em estoque crítico" />
            )}
          </button>

          <button
            onClick={() => { setCatalogTab('combos'); setSelectedCategory('Todas'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              catalogTab === 'combos'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Combos & Pacotes ({totalCombos})</span>
          </button>

          <button
            onClick={() => setCatalogTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              catalogTab === 'templates'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-300" />
            <span>Biblioteca de Ideias (+1 Clique)</span>
          </button>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          {catalogTab === 'servicos' && (
            <button
              onClick={() => handleOpenServiceModal()}
              className="w-full sm:w-auto bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar Novo Serviço
            </button>
          )}

          {catalogTab === 'produtos' && (
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenQuickStockOutflow && (
                <button
                  type="button"
                  onClick={onOpenQuickStockOutflow}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40"
                  title="Dar baixa rápida de insumos em 3 toques"
                >
                  <Zap className="w-4 h-4 fill-slate-950" /> Baixa Flash (3 Toques)
                </button>
              )}

              {onOpenPurchaseOrder && (
                <button
                  type="button"
                  onClick={onOpenPurchaseOrder}
                  className="w-full sm:w-auto bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Gerar Pedido para Fornecedor via WhatsApp"
                >
                  <Package className="w-4 h-4" /> Pedir Reposição (WhatsApp)
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="w-full sm:w-auto bg-[#182338] hover:bg-[#202f4a] text-slate-200 hover:text-white border border-[#263757] text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Novo Insumo/Produto
              </button>
            </div>
          )}

          {catalogTab === 'combos' && (
            <button
              onClick={() => handleOpenComboModal()}
              className="w-full sm:w-auto bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Montar Novo Combo
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR (For Servicos, Produtos, Combos) */}
      {catalogTab !== 'templates' && (
        <div className="bg-[#141c2b] border border-[#23314a] p-3.5 rounded-2xl space-y-3 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, marca, SKU, categoria ou tag..."
                className="w-full bg-[#182338] border border-[#263757] pl-10 pr-8 py-2 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting & Low Stock Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {catalogTab === 'produtos' && (
                <button
                  onClick={() => setOnlyLowStock(!onlyLowStock)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border transition-all cursor-pointer ${
                    onlyLowStock
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                      : 'bg-[#182338] text-slate-300 border-[#263757] hover:bg-[#202f4a]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Estoque Crítico ({lowStockCount})</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-[#182338] border border-[#263757] px-2.5 py-1.5 rounded-xl text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[11px]">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="nome" className="bg-[#141c2b]">Nome (A-Z)</option>
                  <option value="preco-desc" className="bg-[#141c2b]">Maior Preço</option>
                  <option value="preco-asc" className="bg-[#141c2b]">Menor Preço</option>
                  {catalogTab === 'produtos' && (
                    <option value="estoque-asc" className="bg-[#141c2b]">Menor Estoque</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          {(catalogTab === 'servicos' || catalogTab === 'produtos') && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Categorias:
              </span>
              <button
                onClick={() => setSelectedCategory('Todas')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'Todas'
                    ? catalogTab === 'servicos' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    : 'bg-[#182338] text-slate-400 hover:text-white hover:bg-[#202f4a]'
                }`}
              >
                Todas ({catalogTab === 'servicos' ? totalServices : totalProductTypes})
              </button>

              {(catalogTab === 'servicos' ? serviceCategories : productCategories).map((cat) => {
                const count = catalogTab === 'servicos'
                  ? servicesCatalog.filter(s => s.category === cat).length
                  : productsCatalog.filter(p => p.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? catalogTab === 'servicos' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                        : 'bg-[#182338] text-slate-400 hover:text-white hover:bg-[#202f4a]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CATÁLOGO DE SERVIÇOS */}
      {catalogTab === 'servicos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Add Service Card Banner */}
            <div 
              onClick={() => handleOpenServiceModal()}
              className="bg-gradient-to-br from-blue-900/20 to-[#141c2b] border border-dashed border-blue-500/40 hover:border-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:bg-blue-900/30 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300">Criar Novo Serviço</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Defina nome, categoria personalizada, tempo em horas, custo e preço padrão.
              </p>
            </div>

            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-[#141c2b] border border-[#23314a] hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                        {service.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md">
                          {service.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-[#182338] px-2 py-0.5 rounded-md border border-[#263757]">
                          <Clock className="w-3 h-3 text-slate-400" /> ~{service.estimatedHours}h
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-400 block">
                        R$ {service.defaultPrice.toFixed(2)}
                      </span>
                      {service.costPrice && service.costPrice > 0 ? (
                        <span className="text-[10px] text-slate-400 block">
                          Custo: R$ {service.costPrice.toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {service.description ? (
                    <p className="text-xs text-slate-300/90 mt-3 line-clamp-2 leading-relaxed bg-[#111827] p-2.5 rounded-xl border border-[#1f293d]">
                      {service.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic mt-3">Sem descrição de procedimento.</p>
                  )}

                  {/* Tags */}
                  {service.tags && service.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                      {service.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-semibold bg-[#182338] text-slate-400 px-2 py-0.5 rounded-md border border-[#263757] flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-blue-400" /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#1e2a3f]">
                  <button
                    onClick={() => handleDuplicateService(service)}
                    className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                    title="Duplicar para criar variação rápida (Ex: versão SUV ou Caminhonete)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenServiceModal(service)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Editar Serviço"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja remover o serviço "${service.name}" do catálogo?`)) {
                          onRemoveService(service.id);
                          showNotification(`Serviço "${service.name}" removido.`);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Excluir Serviço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full bg-[#141c2b] border border-dashed border-[#23314a] rounded-2xl p-10 text-center space-y-3">
                <Wrench className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhum serviço encontrado</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Tente ajustar sua busca ou crie um novo serviço agora mesmo.
                </p>
                <button
                  onClick={() => handleOpenServiceModal()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Criar Serviço
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO DE PRODUTOS & MATÉRIA-PRIMA */}
      {catalogTab === 'produtos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Add Product Card Banner */}
            <div 
              onClick={() => handleOpenProductModal()}
              className="bg-gradient-to-br from-emerald-900/20 to-[#141c2b] border border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:bg-emerald-900/30 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">Cadastrar Novo Produto / Insumo</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Adicione químicos, ceras, compostos, boinas, panos ou matérias-primas ao estoque.
              </p>
            </div>

            {filteredProducts.map((product) => {
              const isLowStock = product.currentStock <= product.minStock;
              const totalCostValue = product.currentStock * product.costPrice;

              return (
                <div
                  key={product.id}
                  className={`bg-[#141c2b] border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                    isLowStock
                      ? 'border-rose-500/50 bg-gradient-to-b from-rose-950/10 to-[#141c2b]'
                      : 'border-[#23314a] hover:border-emerald-500/50'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.brand && (
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {product.brand}
                            </span>
                          )}
                          {product.sku && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {product.sku}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                          {product.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {product.category}
                        </span>
                      </div>

                      {isLowStock && (
                        <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Repor
                        </span>
                      )}
                    </div>

                    {/* Stock & Instant Stock Controller */}
                    <div className="mt-3 bg-[#101726] border border-[#1f2b42] p-3 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Estoque Atual</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className={`text-xl font-black ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                            {product.currentStock}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{product.unit}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          Mínimo: {product.minStock} {product.unit} {product.location ? `• ${product.location}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#182338] p-1 rounded-xl border border-[#273857]">
                        <button
                          onClick={() => onAdjustProductStock(product.id, -1)}
                          disabled={product.currentStock <= 0}
                          className="w-7 h-7 rounded-lg bg-[#111827] hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 flex items-center justify-center font-bold text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="Diminuir 1 unidade (Consumo em serviço)"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => onAdjustProductStock(product.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#111827] hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                          title="Adicionar 1 unidade (Entrada de compra)"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Financial Values Box */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-[#151f33] p-2.5 rounded-xl border border-[#23334f]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Custo Unitário</span>
                        <span className="font-extrabold text-slate-200">
                          R$ {product.costPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Imobilizado</span>
                        <span className="font-extrabold text-cyan-400">
                          R$ {totalCostValue.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic">
                        {product.description}
                      </p>
                    )}
                    {product.supplier && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        Fornecedor: <span className="text-slate-400 font-medium">{product.supplier}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#1e2a3f]">
                    <button
                      onClick={() => handleDuplicateProduct(product)}
                      className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      title="Duplicar para criar variação de tamanho ou versão"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenProductModal(product)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Editar Produto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o produto "${product.name}" do catálogo?`)) {
                            onRemoveProduct(product.id);
                            showNotification(`Produto "${product.name}" excluído.`);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-[#141c2b] border border-dashed border-[#23314a] rounded-2xl p-10 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhum produto ou insumo localizado</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {onlyLowStock 
                    ? 'Excelente! Não há nenhum item abaixo do estoque mínimo no momento.' 
                    : 'Nenhum item corresponde à busca. Cadastre um novo produto.'}
                </p>
                <button
                  onClick={() => handleOpenProductModal()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Produto
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PACOTES & COMBOS PROMOCIONAIS */}
      {catalogTab === 'combos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Add Combo Card Banner */}
            <div 
              onClick={() => handleOpenComboModal()}
              className="bg-gradient-to-br from-amber-900/20 to-[#141c2b] border border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all hover:bg-amber-900/30 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300">Montar Novo Pacote / Combo</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Combine múltiplos serviços em um pacote com preço especial e aumente seu ticket médio.
              </p>
            </div>

            {filteredCombos.map((combo) => {
              const discountValue = Math.max(0, combo.originalPrice - combo.comboPrice);
              const discountPercent = combo.originalPrice > 0 
                ? Math.round((discountValue / combo.originalPrice) * 100) 
                : 0;

              return (
                <div
                  key={combo.id}
                  className="bg-[#141c2b] border border-[#23314a] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all shadow-md group relative overflow-hidden"
                >
                  {combo.badge && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" /> {combo.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-white pr-20 leading-snug group-hover:text-amber-300 transition-colors">
                      {combo.name}
                    </h4>

                    {/* Price and Discount Callout */}
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-400">
                        R$ {combo.comboPrice.toFixed(2)}
                      </span>
                      {combo.originalPrice > combo.comboPrice && (
                        <>
                          <span className="text-xs text-slate-500 line-through">
                            R$ {combo.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            -{discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-[#182338] px-2 py-0.5 rounded-md border border-[#263757]">
                        <Clock className="w-3 h-3 text-slate-400" /> ~{combo.estimatedHours}h estimadas
                      </span>
                    </div>

                    {combo.description && (
                      <p className="text-xs text-slate-300/90 mt-2.5 line-clamp-2 leading-relaxed bg-[#111827] p-2.5 rounded-xl border border-[#1f293d]">
                        {combo.description}
                      </p>
                    )}

                    {/* Services Included in Combo */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Serviços Inclusos:</span>
                      <div className="space-y-1">
                        {combo.includedServices.map((srvName, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200 bg-[#162033] px-2.5 py-1 rounded-lg border border-[#223250]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{srvName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#1e2a3f]">
                    <button
                      onClick={() => setPromotingCombo(combo)}
                      className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl transition-all shadow-md shadow-amber-900/30 flex items-center gap-1.5 text-xs cursor-pointer"
                      title="Gerar propaganda para WhatsApp e Redes Sociais"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Divulgar / Propaganda</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenComboModal(combo)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Editar Combo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover o combo "${combo.name}"?`)) {
                            onRemoveCombo(combo.id);
                            showNotification(`Combo "${combo.name}" excluído.`);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title="Excluir Combo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BIBLIOTECA DE SUGESTÕES & IDEIAS PRONTAS (+ 1 CLIQUE) */}
      {catalogTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-[#141c2b] border border-[#23314a] p-4 sm:p-5 rounded-2xl">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Biblioteca de Sugestões de Serviços & Insumos
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ideias comprovadas de alta demanda e excelente margem no mercado de estética automotiva. Clique em <strong>"+ Adicionar ao Catálogo"</strong> para incorporar instantaneamente ao seu sistema.
            </p>
          </div>

          {/* Preset Services Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Sugestões de Serviços em Alta
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PRESET_CATALOG_IDEAS.services.map((preset, idx) => {
                const alreadyExists = servicesCatalog.some(s => s.name.toLowerCase() === preset.name.toLowerCase());

                return (
                  <div 
                    key={idx}
                    className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-blue-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md">
                            {preset.category}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-1.5">{preset.name}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-400">R$ {preset.defaultPrice}</span>
                          <span className="text-[10px] text-slate-400 block">~{preset.estimatedHours}h</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300/80 mt-2 bg-[#111827] p-2.5 rounded-xl border border-[#1f293d]">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1e2a3f]">
                      {alreadyExists ? (
                        <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 py-1">
                          <CheckCircle2 className="w-4 h-4" /> Já incluído no catálogo
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddPresetService(preset)}
                          className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Adicionar ao Catálogo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Products Section */}
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" /> Sugestões de Matérias-Primas & Insumos Recomendados
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PRESET_CATALOG_IDEAS.products.map((preset, idx) => {
                const alreadyExists = productsCatalog.some(p => p.name.toLowerCase() === preset.name.toLowerCase());

                return (
                  <div 
                    key={idx}
                    className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {preset.brand}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{preset.sku}</span>
                          </div>
                          <h5 className="text-sm font-bold text-white mt-1">{preset.name}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-300">Custo: R$ {preset.costPrice}</span>
                          <span className="text-[10px] text-slate-400 block">{preset.unit}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300/80 mt-2 bg-[#111827] p-2.5 rounded-xl border border-[#1f293d]">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1e2a3f]">
                      {alreadyExists ? (
                        <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 py-1">
                          <CheckCircle2 className="w-4 h-4" /> Já cadastrado no estoque
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddPresetProduct(preset)}
                          className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> + Cadastrar no Estoque
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SERVICE MODAL (CREATE / EDIT) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141c2b] border border-[#23314a] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Ex: Polimento Técnico em 3 Etapas, PPF Frontal, etc."
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dynamic Category Selector / Custom input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                  >
                    {isCustomCategoryMode ? 'Selecionar da Lista' : '+ Digitar Nova Categoria'}
                  </button>
                </div>

                {isCustomCategoryMode ? (
                  <input
                    type="text"
                    required
                    value={customServiceCategoryInput}
                    onChange={(e) => setCustomServiceCategoryInput(e.target.value)}
                    placeholder="Ex: Martelinho de Ouro, Envelopamento, Blindagem..."
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {serviceCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço Padrão de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={serviceForm.defaultPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, defaultPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-emerald-400 font-black px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={serviceForm.costPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-slate-200 font-bold px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tempo Médio (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={serviceForm.estimatedHours}
                    onChange={(e) => setServiceForm({ ...serviceForm, estimatedHours: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags / Palavras-chave
                  </label>
                  <input
                    type="text"
                    value={serviceForm.tags}
                    onChange={(e) => setServiceForm({ ...serviceForm, tags: e.target.value })}
                    placeholder="Ex: Express, VIP, SUV"
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição dos Procedimentos Inclusos
                </label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Detalhes que serão apresentados no orçamento ou ordem de serviço..."
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL (CREATE / EDIT) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141c2b] border border-[#23314a] rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {editingProduct ? 'Editar Produto / Matéria-Prima' : 'Novo Produto / Insumo no Estoque'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Produto / Matéria-Prima *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Cera Native 100g, Composto V10, Boina de Lã..."
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="Ex: Vonixx, Kers, Menzerna, 3M"
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código SKU / Código de Barras
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="Ex: VNX-001"
                    className="w-full bg-[#182338] border border-[#283854] text-white font-mono px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Product Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomProductCatMode(!isCustomProductCatMode)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    {isCustomProductCatMode ? 'Selecionar da Lista' : '+ Nova Categoria'}
                  </button>
                </div>

                {isCustomProductCatMode ? (
                  <input
                    type="text"
                    required
                    value={customProductCategoryInput}
                    onChange={(e) => setCustomProductCategoryInput(e.target.value)}
                    placeholder="Ex: Tintas & Vernizes, Fitas Especiais..."
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stock and Unit */}
              <div className="grid grid-cols-3 gap-2.5 bg-[#111827] p-3 rounded-2xl border border-[#1f293d]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Estoque Atual *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-white font-black px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-amber-300 font-black px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Unidade
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full bg-[#182338] border border-[#283854] text-white px-2 py-1.5 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Unidade">Unidade</option>
                    <option value="Litros">Litros</option>
                    <option value="ml">ml</option>
                    <option value="Galão">Galão</option>
                    <option value="Kg">Kg</option>
                    <option value="Gramas">Gramas</option>
                    <option value="Kit">Kit</option>
                    <option value="Caixa">Caixa</option>
                  </select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-slate-200 font-bold px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço de Repasse / Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-[#283854] text-emerald-400 font-bold px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fornecedor / Distribuidora
                  </label>
                  <input
                    type="text"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                    placeholder="Ex: Distribuidora Detailer"
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Localização Física
                  </label>
                  <input
                    type="text"
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    placeholder="Ex: Armário 2, Prateleira B"
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição & Instruções de Uso
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ex: Diluição recomendada, forma de aplicação ou especificações..."
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMBO / PACOTE MODAL (CREATE / EDIT) */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141c2b] border border-[#23314a] rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                {editingCombo ? 'Editar Pacote / Combo' : 'Montar Novo Pacote / Combo'}
              </h3>
              <button
                onClick={() => setIsComboModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Pacote / Combo *
                </label>
                <input
                  type="text"
                  required
                  value={comboForm.name}
                  onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                  placeholder="Ex: Combo Estética Prime: Lavagem + Higienização + Cera"
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selo / Destaque do Combo
                  </label>
                  <input
                    type="text"
                    value={comboForm.badge}
                    onChange={(e) => setComboForm({ ...comboForm, badge: e.target.value })}
                    placeholder="Ex: Mais Vendido, Promoção, Alta Margem"
                    className="w-full bg-[#182338] border border-[#283854] text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tempo Total Estimado (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={comboForm.estimatedHours}
                    onChange={(e) => setComboForm({ ...comboForm, estimatedHours: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Service Selection Picker for Combos */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selecione os Serviços que farão parte do Pacote ({comboForm.includedServices.length} selecionados) *
                </label>
                <div className="bg-[#101726] border border-[#1f293d] p-3 rounded-2xl max-h-48 overflow-y-auto space-y-1.5">
                  {servicesCatalog.map((service) => {
                    const isSelected = comboForm.includedServices.includes(service.name);
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleToggleServiceInCombo(service.name)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-amber-500/20 text-white border border-amber-500/40' 
                            : 'bg-[#151f33] text-slate-300 hover:bg-[#1a263d] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded accent-amber-500"
                          />
                          <span className="font-semibold">{service.name}</span>
                          <span className="text-[10px] text-slate-400">({service.category})</span>
                        </div>
                        <span className="font-extrabold text-emerald-400">R$ {service.defaultPrice.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="bg-[#151f33] border border-[#243452] p-3.5 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Soma Original dos Serviços
                  </span>
                  <span className="text-sm font-bold text-slate-300">
                    R$ {servicesCatalog
                      .filter(s => comboForm.includedServices.includes(s.name))
                      .reduce((acc, s) => acc + s.defaultPrice, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="w-48">
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">
                    Preço Promocional do Combo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={comboForm.comboPrice}
                    onChange={(e) => setComboForm({ ...comboForm, comboPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182338] border border-amber-500/50 text-emerald-400 font-black px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição & Benefícios do Pacote
                </label>
                <textarea
                  rows={2}
                  value={comboForm.description}
                  onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                  placeholder="Ex: Ideal para quem busca proteção completa com economia de 20%..."
                  className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23314a]">
                <button
                  type="button"
                  onClick={() => setIsComboModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Pacote / Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PROPAGANDA & DIVULGAÇÃO DO COMBO */}
      {promotingCombo && (
        <ComboPromotionModal
          combo={promotingCombo}
          shopSettings={shopSettings}
          staffList={staffList}
          onClose={() => setPromotingCombo(null)}
        />
      )}
    </div>
  );
};
