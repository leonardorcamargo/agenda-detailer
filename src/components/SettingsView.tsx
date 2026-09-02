import React, { useState, useMemo } from 'react';
import { ShopSettings, ServiceItem } from '../types';
import { BusinessProfileFields } from './BusinessProfileFields';
import { normalizeBusinessAreas, normalizeBusinessModules } from '../lib/businessProfile';
import { 
  Settings, 
  Store, 
  Wrench, 
  Plus, 
  Trash2, 
  Save, 
  QrCode, 
  Check,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Car,
  Building2,
  Shield,
  Instagram,
  FileText,
  Search,
  X
} from 'lucide-react';

interface SettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (newSettings: ShopSettings) => Promise<boolean>;
  canConfigureBusiness: boolean;
  servicesCatalog: ServiceItem[];
  onAddCatalogService: (service: ServiceItem) => void;
  onRemoveCatalogService: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  canConfigureBusiness,
  servicesCatalog,
  onAddCatalogService,
  onRemoveCatalogService,
}) => {
  // Form State
  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  // New Service Catalog Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'Lavagem' | 'Polimento' | 'Higienização' | 'Proteção' | 'Vidros' | 'Outros'>('Lavagem');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return servicesCatalog;
    const q = serviceSearch.toLowerCase().trim();
    return servicesCatalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
    );
  }, [servicesCatalog, serviceSearch]);

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError('');
    const saved = await onSaveSettings(formData);
    setSaving(false);
    if (!saved) { setSaveError('Não foi possível salvar as configurações. Confira sua permissão e conexão.'); return; }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle Logo Image Upload from File Input
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;

    const newItem: ServiceItem = {
      id: 's_' + Date.now(),
      name: newServiceName,
      defaultPrice: parseFloat(newServicePrice) || 0,
      category: newServiceCategory,
      description: newServiceDesc,
      estimatedHours: 2,
    };

    onAddCatalogService(newItem);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDesc('');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" /> Identidade Visual e Perfil da sua Loja (SaaS)
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Cadastre seu nome, logotipo, categoria e informações de contato. Cada usuário logado possui sua própria identidade de marca no sistema.
        </p>
      </div>

      {/* Live Brand Preview Header Banner */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Pré-visualização ao Vivo do seu Cabeçalho & Comprovante OS
          </span>
          <span className="text-xs text-slate-400">Modelo SaaS Ativo</span>
        </div>

        {/* Mock Live Header */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt={formData.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40 shadow-lg shrink-0 bg-[#0a0f1d]"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                {formData.name ? formData.name.charAt(0).toUpperCase() : <Car className="w-7 h-7" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">{formData.name || 'Nome da sua Oficina'}</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  {formData.shopCategory || 'Estética Automotiva'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{formData.subtitle || 'Sua frase de impacto / slogan da loja'}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                <span>📍 {formData.address || 'Endereço da Oficina'}</span>
                <span>📞 {formData.phone || 'WhatsApp Comercial'}</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Responsável Técnico</span>
            <span className="text-xs font-bold text-blue-300">{formData.ownerName || 'Nome do Proprietário'}</span>
          </div>
        </div>
      </div>

      {/* Shop Info & Logo Upload Form */}
      <form onSubmit={handleSubmitSettings} className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-[#23314a] pb-3">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" />
            Dados Cadastrais da Loja / Oficina
          </h3>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" /> Identidade salva com sucesso!
            </span>
          )}
        </div>

        {/* LOGO UPLOAD SECTION */}
        <div className="bg-[#182338] border border-[#263757] p-4 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" /> Logomarca da sua Loja (Aparece no Sistema e na OS)
          </label>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Logo Preview box */}
            <div className="w-20 h-20 rounded-2xl bg-[#0d121f] border-2 border-dashed border-[#2d3f61] flex flex-col items-center justify-center shrink-0 overflow-hidden relative">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-500 block">Sem Logo</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center gap-2">
                <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0">
                  <Upload className="w-4 h-4" /> Enviar Logo do Computador
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>

                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                    className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
                  >
                    Remover Logo
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="Ou cole a URL da imagem do logotipo (https://...)"
                  className="w-full bg-[#121929] border border-[#283854] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Formatos recomendados: PNG, JPG ou WebP (preferencialmente transparente ou quadrado).
              </p>
            </div>
          </div>
        </div>

        {/* INPUT FIELDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome Fantasia da Loja / Oficina *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Auto Shine Studio Detailer"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Categoria *</label>
            <select
              value={formData.shopCategory || 'Estética Automotiva'}
              onChange={(e: any) => setFormData({ ...formData, shopCategory: e.target.value })}
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="Estética Automotiva">Estética Automotiva</option>
              <option value="Studio Detailer">Studio Detailer VIP</option>
              <option value="Lava Rápido Premium">Lava Rápido Premium</option>
              <option value="Oficina Mecânica">Oficina Mecânica</option>
              <option value="Funilaria e Pintura">Funilaria e Pintura</option>
              <option value="Lava Jato & Estética">Lava Jato & Estética</option>
              <option value="Centro Automotivo">Centro Automotivo</option>
              <option value="Loja de Acessórios">Loja de Acessórios</option>
              <option value="Pneus e Alinhamento">Pneus e Alinhamento</option>
              <option value="Operação Híbrida">Operação Híbrida</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Slogan / Subtítulo da Loja</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ex: Estética Automotiva & Detalhamento VIP"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Telefone / WhatsApp Comercial *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 98765-4321"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Responsável / Detailer *</label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Ex: Ricardo Silveira"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail da Conta SaaS</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@sualoja.com.br"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> CNPJ ou CPF
            </label>
            <input
              type="text"
              value={formData.cnpjCpf || ''}
              onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Oficial
            </label>
            <input
              type="text"
              value={formData.instagram || ''}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="@sualoja_estetica"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Endereço Completo da Oficina</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Av. das Nações Unidas, 12500 - São Paulo, SP"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-400" /> Chave Pix Oficial (Exibida no topo e rodapé da OS para o cliente)
            </label>
            <input
              type="text"
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              placeholder="CNPJ, E-mail ou Celular Pix"
              className="w-full bg-[#182338] border border-[#283854] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-[#283854] bg-[#111827] p-4">
          <BusinessProfileFields
            areas={normalizeBusinessAreas(formData.businessAreas ?? [])}
            modules={normalizeBusinessModules(formData.enabledModules)}
            onAreasChange={(businessAreas) => setFormData({ ...formData, businessAreas })}
            onModulesChange={(enabledModules) => setFormData({ ...formData, enabledModules })}
            disabled={!canConfigureBusiness || saving}
          />
          {!canConfigureBusiness && <p className="mt-3 text-xs text-amber-300">Somente proprietário ou administrador pode alterar áreas e recursos.</p>}
        </div>

        {saveError && <p role="alert" className="md:col-span-2 rounded-xl bg-rose-950 p-3 text-xs text-rose-200">{saveError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </form>

      {/* Catalog Services Manager */}
      <div className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-400" />
          Catálogo de Serviços da sua Loja
        </h3>

        {/* Add New Service Form */}
        <form onSubmit={handleCreateCatalogItem} className="bg-[#182338] border border-[#263757] p-4 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-200">Adicionar Novo Serviço ao Catálogo:</span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nome do Serviço (ex: Vitrificação de Faróis)"
                className="w-full bg-[#121929] border border-[#283854] text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <select
                value={newServiceCategory}
                onChange={(e: any) => setNewServiceCategory(e.target.value)}
                className="w-full bg-[#121929] border border-[#283854] text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Lavagem">Lavagem</option>
                <option value="Polimento">Polimento</option>
                <option value="Higienização">Higienização</option>
                <option value="Proteção">Proteção</option>
                <option value="Vidros">Vidros</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="Preço Padrão (R$)"
                className="w-full bg-[#121929] border border-[#283854] text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-right"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Descrição resumida do serviço..."
              className="flex-1 bg-[#121929] border border-[#283854] text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Incluir
            </button>
          </div>
        </form>

        {/* Existing Catalog List */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">
              Serviços Cadastrados ({servicesCatalog.length}):
            </span>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Filtrar serviços..."
                className="w-full bg-[#121929] border border-[#283854] text-white text-xs pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className="bg-[#182338] border border-[#263757] p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.2 rounded-full">
                      {s.category}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-extrabold text-blue-400">
                    R$ {s.defaultPrice.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveCatalogService(s.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Nenhum serviço encontrado para "{serviceSearch}".
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

