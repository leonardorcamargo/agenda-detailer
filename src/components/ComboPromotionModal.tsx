import React, { useState, useRef } from 'react';
import { ServiceComboItem, ShopSettings, StaffMember } from '../types';
import { toPng, toBlob } from 'html-to-image';
import {
  Megaphone,
  Share2,
  Copy,
  Check,
  Send,
  Sparkles,
  Instagram,
  MessageCircle,
  Phone,
  User,
  Shield,
  Clock,
  CheckCircle2,
  X,
  Flame,
  Star,
  ExternalLink,
  Smartphone,
  Eye,
  Sliders,
  DollarSign,
  Download,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface ComboPromotionModalProps {
  combo: ServiceComboItem | null;
  shopSettings?: ShopSettings;
  staffList?: StaffMember[];
  onClose: () => void;
}

export const ComboPromotionModal: React.FC<ComboPromotionModalProps> = ({
  combo,
  shopSettings,
  staffList = [],
  onClose,
}) => {
  if (!combo) return null;

  const flyerRef = useRef<HTMLDivElement>(null);

  // Selected sender phone source
  const ownerPhone = shopSettings?.phone || '';
  const ownerName = shopSettings?.ownerName || shopSettings?.name || 'Responsável';
  
  // Find potential managers / supervisors
  const managers = staffList.filter(
    (s) => s.role === 'Gerente de Pátio' || s.role === 'Master Detailer' || s.role === 'Polidor Especialista'
  );
  const defaultManager = managers.length > 0 ? managers[0] : null;

  const [phoneType, setPhoneType] = useState<'owner' | 'manager' | 'custom'>(
    ownerPhone ? 'owner' : defaultManager ? 'manager' : 'custom'
  );
  const [customPhone, setCustomPhone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(defaultManager?.id || '');
  
  // Promotion settings
  const [customerName, setCustomerName] = useState('');
  const [urgencyMode, setUrgencyMode] = useState<'vagas' | 'prazo' | 'geral'>('vagas');
  const [promoStyle, setPromoStyle] = useState<'direta' | 'vip' | 'stories'>('direta');
  
  // Output action state
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageActionSuccess, setImageActionSuccess] = useState<'copied' | 'downloaded' | 'shared' | null>(null);

  // Compute Active Phone
  const getActivePhone = () => {
    if (phoneType === 'owner') {
      return ownerPhone;
    } else if (phoneType === 'manager') {
      const staff = staffList.find((s) => s.id === selectedStaffId) || defaultManager;
      return staff?.phone || '';
    } else {
      return customPhone;
    }
  };

  const getActiveContactLabel = () => {
    if (phoneType === 'owner') {
      return `${ownerName} (Dono / Estúdio)`;
    } else if (phoneType === 'manager') {
      const staff = staffList.find((s) => s.id === selectedStaffId) || defaultManager;
      return staff ? `${staff.name} (${staff.role})` : 'Gerente';
    } else {
      return 'Contato Personalizado';
    }
  };

  const activePhoneNumber = getActivePhone();
  const cleanPhoneForWa = activePhoneNumber.replace(/\D/g, '');

  // Pricing calculations
  const originalPrice = combo.originalPrice || combo.comboPrice * 1.2;
  const comboPrice = combo.comboPrice;
  const discountVal = originalPrice - comboPrice;
  const discountPercent = originalPrice > 0 ? Math.round((discountVal / originalPrice) * 100) : 0;
  const studioName = shopSettings?.name || 'Nosso Studio de Estética Automotiva';
  const instagramTag = shopSettings?.instagram ? `@${shopSettings.instagram.replace('@', '')}` : '';

  // Generate WhatsApp Message Copy
  const generateWhatsAppMessage = () => {
    const greeting = customerName.trim()
      ? `Olá, *${customerName.trim()}*! Tudo bem?`
      : `Olá! Tudo bem?`;

    const urgencyLine =
      urgencyMode === 'vagas'
        ? `🔥 *Condição especial:* Restam apenas *3 vagas exclusivas* nesta semana!`
        : urgencyMode === 'prazo'
        ? `⏳ *Oferta por tempo limitado:* Válida somente até este sábado!`
        : `✨ *Oportunidade perfeita para deixar seu carro com aspecto de zero km.*`;

    const servicesList = combo.includedServices
      .map((s) => `  ✅ ${s}`)
      .join('\n');

    let text = `${greeting} 🚗✨\n\n`;
    text += `Preparamos um pacote imperdível para valorizar e proteger o seu carro com o padrão de excelência da *${studioName}*:\n\n`;
    text += `🌟 *${combo.name.toUpperCase()}*\n`;
    if (combo.description) {
      text += `_${combo.description}_\n\n`;
    } else {
      text += `\n`;
    }
    text += `📋 *O QUE ESTÁ INCLUSO:*\n${servicesList}\n\n`;
    text += `⏱️ *Tempo estimado:* aprox. ${combo.estimatedHours || 3} horas de detalhamento técnico\n\n`;
    text += `💰 *VALOR PROMOCIONAL DO COMBO:*\n`;
    if (originalPrice > comboPrice) {
      text += `❌ De: ~R$ ${originalPrice.toFixed(2)}~\n`;
      text += `✅ *Por apenas: R$ ${comboPrice.toFixed(2)}*`;
      if (discountPercent > 0) {
        text += ` _(${discountPercent}% de economia!)_\n\n`;
      } else {
        text += `\n\n`;
      }
    } else {
      text += `✅ *Por apenas: R$ ${comboPrice.toFixed(2)}*\n\n`;
    }
    text += `${urgencyLine}\n\n`;
    text += `📲 *Quer garantir o seu horário ou tirar dúvidas?*\n`;
    text += `Responda a esta mensagem ou fale diretamente com a gente no WhatsApp: ${activePhoneNumber ? `*${activePhoneNumber}*` : ''}\n`;
    if (shopSettings?.address) {
      text += `📍 *Localização:* ${shopSettings.address}\n`;
    }
    if (instagramTag) {
      text += `📸 Acompanhe nossos resultados no Instagram: ${instagramTag}\n`;
    }

    return text;
  };

  // Generate Instagram / Social Media Caption Copy
  const generateInstagramCopy = () => {
    const servicesList = combo.includedServices
      .map((s) => `✔ ${s}`)
      .join('\n');

    let text = `🚗✨ TRANSFORMAÇÃO & PROTEÇÃO: ${combo.name.toUpperCase()}\n\n`;
    text += `Seu carro merece aquele cuidado minucioso com produtos de alta performance e acabamento profissional!\n\n`;
    text += `📦 O que está incluso no pacote:\n${servicesList}\n\n`;
    if (originalPrice > comboPrice) {
      text += `💸 De ~R$ ${originalPrice.toFixed(2)}~ por apenas R$ ${comboPrice.toFixed(2)} (${discountPercent}% OFF)\n\n`;
    } else {
      text += `💎 Investimento: R$ ${comboPrice.toFixed(2)}\n\n`;
    }
    text += `⚡ Vagas limitadas para manter nosso alto padrão de entrega.\n\n`;
    text += `📲 Agendamentos e orçamentos via Direct ou WhatsApp no link da bio: ${activePhoneNumber || 'Chame no WhatsApp'}\n\n`;
    text += `#EsteticaAutomotiva #CarDetail #Polimento #Vitrificacao #HigienizacaoAutomotiva #AutoDetailing #CarroNovo #EsteticaAutomotivaBrasil`;
    return text;
  };

  // Generate Short Stories Copy (Cards / Prints)
  const generateStoriesScript = () => {
    return `🔥 COMBO ${combo.name.toUpperCase()}\n` +
      `🚗 ${combo.includedServices.slice(0, 3).join(' + ')}${combo.includedServices.length > 3 ? ' e mais!' : ''}\n` +
      `❌ De R$ ${originalPrice.toFixed(2)} por R$ ${comboPrice.toFixed(2)}\n` +
      `👉 Arraste pra cima ou responda "EU QUERO" no WhatsApp (${activePhoneNumber || 'Link na Bio'})`;
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // --- IMAGE ACTIONS: COPY IMAGE, DOWNLOAD IMAGE, SHARE IMAGE ---
  
  // 1. Copy Image directly to Clipboard (allows pasting directly in WhatsApp Web, Telegram, Canva, Instagram Web)
  const handleCopyImageToClipboard = async () => {
    if (!flyerRef.current) return;
    try {
      setIsGeneratingImage(true);
      const blob = await toBlob(flyerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0d1320',
      });

      if (blob) {
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setImageActionSuccess('copied');
          setTimeout(() => setImageActionSuccess(null), 3000);
        } else {
          // Fallback: download if clipboard.write is not supported by browser
          handleDownloadImage();
        }
      }
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      // Fallback: download image
      handleDownloadImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 2. Download Image (PNG) to device
  const handleDownloadImage = async () => {
    if (!flyerRef.current) return;
    try {
      setIsGeneratingImage(true);
      const dataUrl = await toPng(flyerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0d1320',
      });

      const link = document.createElement('a');
      const safeName = combo.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `propaganda_combo_${safeName}.png`;
      link.href = dataUrl;
      link.click();

      setImageActionSuccess('downloaded');
      setTimeout(() => setImageActionSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 3. Share Image via Web Share API (native on mobile devices to WhatsApp, Instagram Stories, etc.)
  const handleShareImage = async () => {
    if (!flyerRef.current) return;
    try {
      setIsGeneratingImage(true);
      const blob = await toBlob(flyerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0d1320',
      });

      if (!blob) throw new Error('Não foi possível gerar a imagem.');

      const file = new File([blob], `combo_${combo.name}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Combo ${combo.name}`,
          text: `Confira a promoção imperdível do ${combo.name} no ${studioName}!`,
        });
        setImageActionSuccess('shared');
        setTimeout(() => setImageActionSuccess(null), 3000);
      } else {
        // Fallback for browsers that don't support file sharing: download or copy
        handleCopyImageToClipboard();
      }
    } catch (err) {
      console.error('Erro ao compartilhar imagem:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleOpenDirectWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const encoded = encodeURIComponent(msg);
    if (cleanPhoneForWa) {
      const fullPhone = cleanPhoneForWa.startsWith('55') ? cleanPhoneForWa : `55${cleanPhoneForWa}`;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const currentCopy =
    promoStyle === 'direta'
      ? generateWhatsAppMessage()
      : promoStyle === 'vip'
      ? generateInstagramCopy()
      : generateStoriesScript();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121927] border border-[#263757] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/20 via-blue-600/20 to-emerald-600/10 border-b border-[#22334f] p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 sm:right-6 top-5 sm:top-6 text-slate-400 hover:text-white bg-[#192336] p-2 rounded-xl border border-[#2b3d5e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> Gerador de Propaganda & Flyer
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Foto & Texto
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1">
                Divulgar "{combo.name}"
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          
          {/* TOP CONFIG: SENDER PHONE SELECTION (Dono, Gerente ou Personalizado) */}
          <div className="bg-[#162133] border border-[#253754] p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                Número do WhatsApp para Contato do Cliente:
              </span>
              <span className="text-[11px] text-slate-400">
                Ativo: <strong className="text-emerald-400">{activePhoneNumber || 'Não definido'}</strong>
              </span>
            </div>

            {/* Phone selection radio pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Option 1: Dono / Empreendedor */}
              <button
                type="button"
                onClick={() => setPhoneType('owner')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  phoneType === 'owner'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-[#101726] border-[#22324f] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-blue-300">
                    <Shield className="w-3.5 h-3.5" /> Dono / Empreendedor
                  </span>
                  {phoneType === 'owner' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-bold text-white truncate">{ownerName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ownerPhone || 'Cadastre nas Configurações'}</p>
                </div>
              </button>

              {/* Option 2: Gerente / Supervisor */}
              <button
                type="button"
                onClick={() => setPhoneType('manager')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  phoneType === 'manager'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                    : 'bg-[#101726] border-[#22324f] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-emerald-300">
                    <User className="w-3.5 h-3.5" /> Gerente / Equipe
                  </span>
                  {phoneType === 'manager' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="mt-1">
                  {managers.length > 0 ? (
                    <select
                      value={selectedStaffId}
                      onChange={(e) => {
                        setSelectedStaffId(e.target.value);
                        setPhoneType('manager');
                      }}
                      className="bg-[#0e1422] text-xs font-bold text-white border border-[#2a3c5a] rounded-lg px-2 py-1 w-full focus:outline-none focus:border-emerald-500"
                    >
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role}) - {m.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-slate-400">Nenhum gerente cadastrado</p>
                  )}
                </div>
              </button>

              {/* Option 3: Outro Número / Personalizado */}
              <button
                type="button"
                onClick={() => setPhoneType('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  phoneType === 'custom'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                    : 'bg-[#101726] border-[#22324f] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-amber-300">
                    <Smartphone className="w-3.5 h-3.5" /> Outro Número
                  </span>
                  {phoneType === 'custom' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="mt-1">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => {
                      setCustomPhone(e.target.value);
                      setPhoneType('custom');
                    }}
                    placeholder="(11) 99999-9999"
                    className="bg-[#0e1422] text-xs text-white border border-[#2a3c5a] rounded-lg px-2 py-1 w-full focus:outline-none focus:border-amber-500"
                  />
                </div>
              </button>
            </div>
          </div>

          {/* PROMOTION CUSTOMIZATION BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Personalizar com Nome do Cliente (Opcional):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Carlos, Dr. Marcelo, Mariana..."
                className="w-full bg-[#162133] border border-[#253754] text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Gatilho de Urgência & Escassez:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUrgencyMode('vagas')}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex-1 transition-all ${
                    urgencyMode === 'vagas'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#162133] border-[#253754] text-slate-400 hover:text-white'
                  }`}
                >
                  🔥 3 Vagas
                </button>
                <button
                  type="button"
                  onClick={() => setUrgencyMode('prazo')}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex-1 transition-all ${
                    urgencyMode === 'prazo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#162133] border-[#253754] text-slate-400 hover:text-white'
                  }`}
                >
                  ⏳ Até Sábado
                </button>
                <button
                  type="button"
                  onClick={() => setUrgencyMode('geral')}
                  className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex-1 transition-all ${
                    urgencyMode === 'geral'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-[#162133] border-[#253754] text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Padrão
                </button>
              </div>
            </div>
          </div>

          {/* MAIN PROMO CONTENT PREVIEW & FLYER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* RIGHT / HIGHLIGHTED: Visual Flyer Digital / Card Preview */}
            <div className="lg:col-span-5 space-y-3 order-1 lg:order-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  Foto / Flyer Digital da Oferta:
                </span>
                {imageActionSuccess && (
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3 h-3" />
                    {imageActionSuccess === 'copied' && 'Foto copiada! Cole no WhatsApp'}
                    {imageActionSuccess === 'downloaded' && 'Foto baixada com sucesso!'}
                    {imageActionSuccess === 'shared' && 'Foto compartilhada!'}
                  </span>
                )}
              </div>

              {/* Flyer Digital Mockup Card (TARGET FOR IMAGE GENERATION) */}
              <div
                ref={flyerRef}
                className="bg-gradient-to-br from-[#172338] via-[#101726] to-[#0c111c] border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-center space-y-3.5"
              >
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
                
                {/* Badge */}
                <div className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                  <Star className="w-3.5 h-3.5 fill-slate-950" /> {combo.badge || 'Oferta Exclusiva'}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base sm:text-xl font-black text-white uppercase tracking-tight">
                    {combo.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {studioName}
                  </p>
                </div>

                {/* Services Pills */}
                <div className="bg-[#0b101a] border border-[#1b263b] p-3.5 rounded-xl text-left space-y-2">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                    Procedimentos Inclusos:
                  </span>
                  {combo.includedServices.map((srv, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{srv}</span>
                    </div>
                  ))}
                </div>

                {/* Price Display */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  {originalPrice > comboPrice && (
                    <p className="text-xs text-slate-400 line-through">
                      De: R$ {originalPrice.toFixed(2)}
                    </p>
                  )}
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                    R$ {comboPrice.toFixed(2)}
                  </p>
                  {discountPercent > 0 && (
                    <span className="text-[11px] font-black text-emerald-400 block mt-0.5">
                      ECONOMIZE {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Footer contact of flyer */}
                <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-white flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> {activePhoneNumber || 'WhatsApp na Bio'}
                  </p>
                  {shopSettings?.address && (
                    <p className="text-[10px] text-slate-400 truncate">{shopSettings.address}</p>
                  )}
                  {instagramTag && <p className="text-[10px] text-slate-400 font-bold">{instagramTag}</p>}
                </div>
              </div>

              {/* PHOTO ACTION BUTTONS: COPIAR FOTO / COMPARTILHAR FOTO / BAIXAR FOTO */}
              <div className="bg-[#101726] border border-[#22334e] p-3 rounded-2xl space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  Ações Rápidas da Foto / Imagem:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Botão 1: COPIAR FOTO (Para colar no WhatsApp Web / Redes) */}
                  <button
                    type="button"
                    disabled={isGeneratingImage}
                    onClick={handleCopyImageToClipboard}
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : imageActionSuccess === 'copied' ? (
                      <Check className="w-4 h-4 text-slate-950" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{imageActionSuccess === 'copied' ? 'Foto Copiada!' : 'Copiar Foto (Imagem)'}</span>
                  </button>

                  {/* Botão 2: COMPARTILHAR FOTO (WhatsApp / Stories) */}
                  <button
                    type="button"
                    disabled={isGeneratingImage}
                    onClick={handleShareImage}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : imageActionSuccess === 'shared' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    <span>Compartilhar Foto</span>
                  </button>
                </div>

                {/* Botão 3: BAIXAR PNG */}
                <button
                  type="button"
                  disabled={isGeneratingImage}
                  onClick={handleDownloadImage}
                  className="w-full bg-[#182338] hover:bg-[#202f4a] text-slate-200 hover:text-white font-bold text-xs py-2 px-3 rounded-xl border border-[#283b5d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Baixar Imagem PNG (Alta Resolução)</span>
                </button>
                
                <p className="text-[10px] text-slate-400 text-center">
                  💡 <strong>Dica:</strong> Ao clicar em <em>"Copiar Foto"</em>, basta dar <strong>Ctrl+V</strong> direto na conversa do WhatsApp para enviar a imagem do combo como foto!
                </p>
              </div>
            </div>

            {/* Left Column: Formatted Copy Preview */}
            <div className="lg:col-span-7 space-y-3 order-2 lg:order-1">
              
              {/* COPY FORMAT SWITCHER TABS */}
              <div className="flex items-center gap-2 border-b border-[#21304a] pb-3 overflow-x-auto">
                <button
                  onClick={() => setPromoStyle('direta')}
                  className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    promoStyle === 'direta'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[#162133] text-slate-400 hover:text-white border border-[#253754]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-300" />
                  WhatsApp (Texto)
                </button>

                <button
                  onClick={() => setPromoStyle('vip')}
                  className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    promoStyle === 'vip'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[#162133] text-slate-400 hover:text-white border border-[#253754]'
                  }`}
                >
                  <Instagram className="w-4 h-4 text-purple-300" />
                  Legenda Instagram
                </button>

                <button
                  onClick={() => setPromoStyle('stories')}
                  className={`flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    promoStyle === 'stories'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[#162133] text-slate-400 hover:text-white border border-[#253754]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Stories / Roteiro
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  Texto Complementar da Oferta:
                </span>
                <button
                  onClick={() => handleCopy(currentCopy, promoStyle)}
                  className="bg-[#1c2940] hover:bg-[#253754] text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedType === promoStyle ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Texto Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Texto
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={currentCopy}
                  rows={12}
                  className="w-full bg-[#0d1320] border border-[#23324e] rounded-2xl p-4 text-xs sm:text-[13px] text-slate-200 font-mono leading-relaxed focus:outline-none resize-none shadow-inner"
                />
              </div>
            </div>

          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="bg-[#101726] border border-[#1f2d45] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              <span className="font-semibold text-slate-300">Contato ativo:</span> {getActiveContactLabel()}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-900/20"
              >
                <ImageIcon className="w-4 h-4" />
                Copiar Foto do Combo
              </button>

              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Disparar no WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
