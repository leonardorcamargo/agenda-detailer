import React, { useState } from 'react';
import { ServiceOrder, ShopSettings, OSStatus, PaymentMethod } from '../types';
import { 
  X, 
  Printer, 
  MessageCircle, 
  CheckCircle, 
  CheckCircle2,
  Car, 
  ShieldAlert, 
  Wrench, 
  Fuel, 
  User, 
  Calendar, 
  QrCode,
  Share2,
  Copy,
  Clock
} from 'lucide-react';

interface OSDetailModalProps {
  order: ServiceOrder;
  settings: ShopSettings;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OSStatus) => void;
  onToggleProjectStep: (orderId: string, stepId: string) => void;
  onUpdatePaymentStatus?: (orderId: string, status: 'Pago' | 'Pendente' | 'Parcial' | 'Fiado') => void;
  onUpdatePaymentMethod?: (orderId: string, method: PaymentMethod) => void;
}

export const OSDetailModal: React.FC<OSDetailModalProps> = ({
  order,
  settings,
  onClose,
  onUpdateStatus,
  onToggleProjectStep,
  onUpdatePaymentStatus,
  onUpdatePaymentMethod,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR');

  // WhatsApp Message Generation
  const generateWhatsAppMessage = () => {
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const message = `Olá *${order.clientName}*! 👋\n` +
      `Aqui é da *${settings.name}*.\n\n` +
      `🚗 *Ordem de Serviço #${order.osNumber}*\n` +
      `Veículo: *${order.brand} ${order.model}* (${order.plate})\n` +
      `Status Atual: *${order.status}*\n\n` +
      `🛠️ *Serviços Contratados:*\n` +
      order.services.map((s) => `• ${s.name}: R$ ${s.price.toFixed(2)}`).join('\n') + '\n\n' +
      `💰 *Valor Total:* R$ ${order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `💳 *Forma de Pagamento:* ${order.paymentMethod} (${order.paymentStatus})\n` +
      `🔑 *Chave Pix para Pagamento:* ${settings.pixKey}\n\n` +
      `Acompanhe o andamento do seu veículo em nosso pátio! Dúvidas estamos à disposição.`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedText}`, '_blank');
  };

  const getPrintHtml = () => {
    const servicesRows = order.services
      .map(
        (s) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 0; font-weight: 500;">${s.name}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700;">R$ ${s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>`
      )
      .join('');

    const damagesList = order.damages && order.damages.length > 0
      ? order.damages
          .map(
            (d, i) =>
              `<div style="margin-bottom: 4px; font-size: 11px;">
                <strong style="color: #9a3412;">#${i + 1} ${d.type}</strong> em <u>${d.part}</u> ${d.notes ? `(${d.notes})` : ''}
              </div>`
          )
          .join('')
      : '<div style="font-size: 11px; color: #64748b; font-style: italic;">Nenhuma avaria grave identificada na entrada.</div>';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Ordem de Serviço #${order.osNumber} - ${order.clientName}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #ffffff; padding: 20px; font-size: 12px; line-height: 1.4; }
      .no-print-banner { background: #1e293b; color: white; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; }
      .btn-print { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
      @media print {
        .no-print-banner { display: none !important; }
        body { padding: 0 !important; }
      }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
      .title { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #0f172a; }
      .subtitle { font-size: 12px; font-weight: 600; color: #475569; }
      .os-number { font-size: 20px; font-weight: 900; color: #1e3a8a; border: 2px solid #1e3a8a; padding: 4px 14px; border-radius: 8px; display: inline-block; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
      .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
      .box-heading { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
      .box-text { font-size: 11px; color: #334155; margin-bottom: 2px; }
      .highlight { font-weight: 700; color: #1d4ed8; }
      .plate { font-family: monospace; font-weight: 800; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; }
      
      .table-title { font-size: 12px; font-weight: 800; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 8px 8px 0 0; border-bottom: none; }
      .table-box { border: 1px solid #cbd5e1; border-radius: 0 0 8px 8px; padding: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      
      .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #1d4ed8; border-top: 2px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
      
      .terms { font-size: 9px; color: #64748b; text-align: justify; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; line-height: 1.3; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; text-align: center; }
      .sig-line { border-top: 1px solid #0f172a; padding-top: 4px; font-size: 11px; font-weight: 700; color: #0f172a; }
      .sig-sub { font-size: 9px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="no-print-banner">
      <span>📄 Comprovante da OS #${order.osNumber} - ${settings.name}</span>
      <button class="btn-print" onclick="window.print()">🖨️ Clique para Imprimir / Salvar PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="title">ORDEM DE SERVIÇO</div>
        <div class="subtitle">Comprovante de Entrada e Termo de Atendimento</div>
      </div>
      <div style="text-align: right;">
        <div class="os-number">#${order.osNumber}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Data: ${formattedDate}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">DADOS DA ESTÉTICA</div>
        <div class="box-heading">${settings.name}</div>
        <div class="box-text">${settings.subtitle || settings.shopCategory}</div>
        <div class="box-text">${settings.address}</div>
        <div class="box-text">Telefone: ${settings.phone}</div>
      </div>

      <div class="box">
        <div class="box-title">DADOS DO CLIENTE & VEÍCULO</div>
        <div class="box-heading">${order.clientName}</div>
        <div class="box-text">WhatsApp: ${order.clientPhone}</div>
        <div class="box-text">Veículo: <span class="highlight">${order.brand} ${order.model} (${order.year})</span></div>
        <div class="box-text">Placa: <span class="plate">${order.plate}</span> • Cor: ${order.color} • Combustível: ${order.fuelLevel}</div>
      </div>
    </div>

    <div class="box" style="margin-bottom: 16px;">
      <div class="box-title">VISTORIA E AVARIAS DECLARADAS</div>
      ${damagesList}
      ${
        order.inspectionNotes
          ? `<div style="margin-top: 6px; font-size: 11px; background: #e2e8f0; padding: 6px; border-radius: 4px;">
              <strong>Obs Vistoria:</strong> ${order.inspectionNotes}
             </div>`
          : ''
      }
    </div>

    <div class="table-title">SERVIÇOS E VALORES CONTRATADOS</div>
    <div class="table-box">
      <table>
        <tbody>
          ${servicesRows}
        </tbody>
      </table>

      ${
        order.discount > 0
          ? `<div style="display: flex; justify-content: space-between; color: #dc2626; font-weight: bold; margin-top: 6px; font-size: 11px;">
              <span>Desconto Aplicado</span>
              <span>- R$ ${order.discount.toFixed(2)}</span>
             </div>`
          : ''
      }

      <div class="total-row">
        <span>VALOR TOTAL DA OS:</span>
        <span>R$ ${order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="box" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="box-title">PAGAMENTO PIX</div>
        <div style="font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
          ${settings.pixKey}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="box-title">STATUS FINANCEIRO</div>
        <div style="font-weight: bold; font-size: 12px; color: #047857;">
          ${order.paymentMethod} (${order.paymentStatus})
        </div>
      </div>
    </div>

    <div class="terms">
      * Declaro estar ciente e de acordo com a vistoria de entrada do veículo acima descrito e autorizo a execução dos serviços contratados. A estética automotiva não se responsabiliza por objetos de valor deixados no interior do veículo não declarados no ato da recepção.
    </div>

    <div class="signatures">
      <div>
        <div class="sig-line">${order.clientName}</div>
        <div class="sig-sub">Assinatura do Cliente</div>
      </div>
      <div>
        <div class="sig-line">${settings.name}</div>
        <div class="sig-sub">Responsável Técnico / Atendimento</div>
      </div>
    </div>
  </body>
</html>`;
  };

  const handleOpenNewWindowPrint = () => {
    const html = getPrintHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  const handlePrint = () => {
    // Show internal print modal overlay first for instant visual feedback
    setShowPrintModal(true);

    // Try standard window.print()
    try {
      window.print();
    } catch (e) {
      console.warn('Direct print blocked by sandbox iframe:', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="printable-os-modal"
        className="bg-[#111827] border border-[#23314a] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col print:max-h-none print:overflow-visible print:bg-white print:text-black print:border-none print:shadow-none"
      >
        {/* Modal Top Header Bar (Hidden in Print) */}
        <div className="no-print bg-[#172033] border-b border-[#23314a] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-sm">
              #{order.osNumber}
            </div>
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                Ordem de Serviço #{order.osNumber}
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  {order.plate}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {order.brand} {order.model} • Entrada em {formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateWhatsAppMessage}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-[#23314a] hover:bg-[#2e4061] text-slate-200 font-medium text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#23314a] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Printable Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200 print:p-2 print:overflow-visible print:text-black">
          {/* Status Change Selector Bar (Hidden in Print) */}
          <div className="no-print bg-[#182338] border border-[#263757] p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300">Status Operacional no Pátio:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={order.status}
                onChange={(e: any) => onUpdateStatus(order.id, e.target.value as OSStatus)}
                className="bg-[#121929] border border-[#2c3f63] text-white font-bold text-xs px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="Aguardando">Aguardando</option>
                <option value="Em Execução">Em Execução</option>
                <option value="Pronto para Entrega">Pronto para Entrega</option>
                <option value="Finalizado">Finalizado / Entregue</option>
              </select>

              {order.status === 'Aguardando' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'Em Execução')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Iniciar Serviço</span>
                </button>
              )}

              {order.status === 'Em Execução' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'Pronto para Entrega')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marcar como Pronto</span>
                </button>
              )}

              {order.status === 'Pronto para Entrega' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'Finalizado')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Concluir e Entregar</span>
                </button>
              )}
            </div>
          </div>

          {/* Print Document Title Header (Only visible on Print) */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">ORDEM DE SERVIÇO</h1>
                <p className="text-sm font-bold text-slate-700">Comprovante de Entrada e Termo de Atendimento</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-900 border-2 border-blue-900 px-3 py-1 rounded-lg inline-block">
                  #{order.osNumber}
                </span>
                <p className="text-xs font-semibold text-slate-600 mt-1">Data: {formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Shop & Customer Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#141c2b] border border-[#23314a] p-4 rounded-xl print-clean-card">
            <div className="flex items-start gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-12 h-12 rounded-xl object-cover border border-blue-500/30 shadow-md shrink-0 bg-[#0d121f] print:border-slate-300"
                />
              ) : null}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 print-text-muted">
                  DADOS DA ESTÉTICA
                </span>
                <h4 className="text-white font-bold text-sm print-text-dark">{settings.name}</h4>
                <p className="text-xs text-slate-400 print-text-muted">{settings.subtitle || settings.shopCategory}</p>
                <p className="text-xs text-slate-400 print-text-muted">{settings.address}</p>
                <p className="text-xs text-slate-400 print-text-muted">Tel: {settings.phone}</p>
              </div>
            </div>

            <div className="md:border-l md:border-[#23314a] md:pl-4 print-border">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 print-text-muted">
                DADOS DO CLIENTE & VEÍCULO
              </span>
              <h4 className="text-white font-bold text-sm print-text-dark">{order.clientName}</h4>
              <p className="text-xs text-slate-300 print-text-dark">WhatsApp: {order.clientPhone}</p>
              <p className="text-xs text-slate-300 print-text-dark">
                Veículo: <span className="font-bold text-blue-400 print-text-dark">{order.brand} {order.model} ({order.year})</span>
              </p>
              <p className="text-xs text-slate-300 print-text-dark">
                Placa: <span className="font-bold font-mono text-white print-text-dark">{order.plate}</span> • Cor: {order.color} • Combustível: {order.fuelLevel}
              </p>
            </div>
          </div>

          {/* Checklist & Damages */}
          <div className="bg-[#141c2b] border border-[#23314a] p-4 rounded-xl space-y-3 print-clean-card">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 print-text-dark">
              <ShieldAlert className="w-4 h-4 text-amber-400 print-text-dark" /> Vistoria e Avarias Declaradas
            </h4>

            {order.damages && order.damages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {order.damages.map((d, i) => (
                  <div key={d.id} className="bg-[#182338] border border-[#263757] p-2.5 rounded-lg text-xs print-clean-card">
                    <span className="font-bold text-amber-300 print-text-dark">#{i + 1} {d.type}</span> em <span className="text-slate-200 print-text-dark">{d.part}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 print-text-muted">{d.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic print-text-muted">Nenhuma avaria grave identificada na entrada.</p>
            )}

            {order.inspectionNotes && (
              <div className="text-xs text-slate-300 bg-[#182338] p-2.5 rounded-lg print-clean-card">
                <span className="font-bold text-slate-200 print-text-dark">Obs Vistoria: </span>
                <span className="print-text-dark">{order.inspectionNotes}</span>
              </div>
            )}
          </div>

          {/* Services & Values Table */}
          <div className="bg-[#141c2b] border border-[#23314a] rounded-xl overflow-hidden print-clean-card">
            <div className="p-3 bg-[#172033] border-b border-[#23314a] text-xs font-bold text-white print:bg-slate-100 print-text-dark print-border">
              Serviços e Valores Contratados
            </div>
            <div className="p-4 space-y-2 text-xs">
              {order.services.map((s) => (
                <div key={s.serviceId} className="flex justify-between border-b border-[#1f2c42] pb-2 print-border">
                  <span className="text-slate-200 font-medium print-text-dark">{s.name}</span>
                  <span className="font-bold text-slate-100 print-text-dark">
                    R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              {order.discount > 0 && (
                <div className="flex justify-between text-rose-400 pt-1 print-text-dark font-bold">
                  <span>Desconto Aplicado</span>
                  <span>- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-extrabold text-blue-400 pt-2 border-t border-[#2a3c5a] print-border print-text-dark">
                <span>VALOR TOTAL DA OS:</span>
                <span>R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payment & Pix Details */}
          <div className="bg-[#182338] border border-[#263757] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 print-clean-card">
            <div>
              <span className="text-xs text-slate-400 block font-medium print-text-muted">Chave Pix da Oficina</span>
              <span className="text-xs font-mono font-bold text-white bg-[#0f172a] px-2.5 py-1 rounded border border-slate-700 inline-block mt-1 print:bg-slate-100 print-text-dark print-border">
                {settings.pixKey}
              </span>
            </div>

            <div className="flex items-center gap-3 no-print">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Forma:</span>
                <select
                  value={order.paymentMethod}
                  onChange={(e: any) => onUpdatePaymentMethod?.(order.id, e.target.value as PaymentMethod)}
                  className="bg-[#0f172a] border border-[#2c3f63] text-white font-bold text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
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
                <span className="text-[10px] text-slate-400 block font-medium">Status:</span>
                <select
                  value={order.paymentStatus}
                  onChange={(e: any) => onUpdatePaymentStatus?.(order.id, e.target.value as any)}
                  className={`font-bold text-xs px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                    order.paymentStatus === 'Pago'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : order.paymentStatus === 'Fiado'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}
                >
                  <option value="Pendente" className="bg-[#121929] text-amber-400">Pendente</option>
                  <option value="Pago" className="bg-[#121929] text-emerald-400">Pago</option>
                  <option value="Parcial" className="bg-[#121929] text-blue-400">Parcial</option>
                  <option value="Fiado" className="bg-[#121929] text-purple-300">Fiado / A Prazo</option>
                </select>
              </div>

              {order.paymentStatus !== 'Pago' && (
                <button
                  type="button"
                  onClick={() => {
                    if (order.paymentMethod === 'Pendente') {
                      onUpdatePaymentMethod?.(order.id, 'Pix');
                    }
                    onUpdatePaymentStatus?.(order.id, 'Pago');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-900/40 cursor-pointer flex items-center gap-1.5 self-end"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pagar Agora</span>
                </button>
              )}
            </div>

            <div className="hidden print:block text-right">
              <span className="text-xs text-slate-400 block print-text-muted">Status Financeiro:</span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300 inline-block mt-1">
                {order.paymentMethod} ({order.paymentStatus})
              </span>
            </div>
          </div>

          {/* Print Only Signatures & Disclaimer Section */}
          <div className="hidden print:block pt-8 border-t border-slate-300 mt-8 space-y-6">
            <p className="text-[10px] text-slate-600 text-justify">
              * Declaro estar ciente e de acordo com a vistoria de entrada do veículo acima descrito e autorizo a execução dos serviços contratados. A estética automotiva não se responsabiliza por objetos de valor deixados no interior do veículo não declarados no ato da recepção.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="text-center border-t border-slate-900 pt-2">
                <p className="text-xs font-bold text-slate-900">{order.clientName}</p>
                <p className="text-[10px] text-slate-600">Assinatura do Cliente</p>
              </div>

              <div className="text-center border-t border-slate-900 pt-2">
                <p className="text-xs font-bold text-slate-900">{settings.name}</p>
                <p className="text-[10px] text-slate-600">Responsável Técnico / Atendimento</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Interactive Print Preview Modal Overlay */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Control Bar */}
          <div className="no-print bg-[#172033] border border-[#2d3f61] w-full max-w-3xl rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Visualização de Impressão (OS #{order.osNumber})</h4>
                <p className="text-xs text-slate-400">Escolha como deseja imprimir ou exportar seu comprovante</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora</span>
              </button>

              <button
                onClick={handleOpenNewWindowPrint}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Abrir em Nova Aba</span>
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-[#23314a] hover:bg-[#2e4061] text-slate-300 font-medium text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>
          </div>

          {/* Printable A4 Paper Document Preview */}
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-xl shadow-2xl p-6 sm:p-10 space-y-6 font-sans text-xs border border-slate-200 my-auto">
            {/* Document Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">ORDEM DE SERVIÇO</h1>
                <p className="text-xs font-semibold text-slate-600">Comprovante de Entrada e Termo de Atendimento</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-900 border-2 border-blue-900 px-3 py-1 rounded-lg inline-block font-mono">
                  #{order.osNumber}
                </span>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">Data: {formattedDate}</p>
              </div>
            </div>

            {/* Shop & Client Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estética Automotiva</span>
                <h3 className="font-bold text-sm text-slate-900">{settings.name}</h3>
                <p className="text-slate-600">{settings.subtitle || settings.shopCategory}</p>
                <p className="text-slate-600">{settings.address}</p>
                <p className="text-slate-600 font-semibold">Tel: {settings.phone}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente & Veículo</span>
                <h3 className="font-bold text-sm text-slate-900">{order.clientName}</h3>
                <p className="text-slate-600">WhatsApp: {order.clientPhone}</p>
                <p className="text-slate-800 font-bold">Veículo: {order.brand} {order.model} ({order.year})</p>
                <p className="text-slate-800">
                  Placa: <span className="font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{order.plate}</span> • Cor: {order.color} • Combustível: {order.fuelLevel}
                </p>
              </div>
            </div>

            {/* Inspection & Damages */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Vistoria e Avarias Declaradas na Entrada
              </h4>
              {order.damages && order.damages.length > 0 ? (
                <div className="space-y-1 pl-1">
                  {order.damages.map((d, i) => (
                    <div key={d.id} className="text-xs">
                      <span className="font-bold text-amber-800">#{i + 1} {d.type}</span> em <span className="underline font-semibold">{d.part}</span> {d.notes ? `(${d.notes})` : ''}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-xs">Nenhuma avaria grave identificada na entrada do veículo.</p>
              )}

              {order.inspectionNotes && (
                <div className="bg-slate-200/70 p-2 rounded text-xs text-slate-800 font-medium mt-2">
                  <strong>Obs. Vistoria:</strong> {order.inspectionNotes}
                </div>
              )}
            </div>

            {/* Services Table */}
            <div>
              <div className="bg-slate-100 border border-slate-300 px-3 py-2 rounded-t-lg font-bold text-slate-800 text-xs uppercase tracking-wider">
                Serviços e Valores Contratados
              </div>
              <div className="border border-t-0 border-slate-300 p-3.5 rounded-b-lg space-y-2">
                {order.services.map((s) => (
                  <div key={s.serviceId} className="flex justify-between border-b border-slate-200 pb-1.5 text-xs">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="font-bold text-slate-900">R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}

                {order.discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold text-xs pt-1">
                    <span>Desconto Aplicado:</span>
                    <span>- R$ {order.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-black text-blue-900 border-t-2 border-slate-300 pt-2 mt-2">
                  <span>VALOR TOTAL DA OS:</span>
                  <span>R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Chave Pix para Pagamento</span>
                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-200 px-2 py-0.5 rounded border border-slate-300 inline-block mt-0.5">
                  {settings.pixKey}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Status do Pagamento</span>
                <span className="font-bold text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded inline-block mt-0.5">
                  {order.paymentMethod} ({order.paymentStatus})
                </span>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="pt-4 border-t border-slate-300 space-y-6">
              <p className="text-[10px] text-slate-600 text-justify leading-relaxed">
                * Declaro estar ciente e de acordo com a vistoria de entrada do veículo acima descrito e autorizo a execução dos serviços contratados. A estética automotiva não se responsabiliza por objetos de valor deixados no interior do veículo não declarados no ato da recepção.
              </p>

              <div className="grid grid-cols-2 gap-12 pt-6">
                <div className="text-center border-t border-slate-900 pt-2">
                  <p className="text-xs font-bold text-slate-900">{order.clientName}</p>
                  <p className="text-[10px] text-slate-600">Assinatura do Cliente</p>
                </div>

                <div className="text-center border-t border-slate-900 pt-2">
                  <p className="text-xs font-bold text-slate-900">{settings.name}</p>
                  <p className="text-[10px] text-slate-600">Responsável Técnico / Atendimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
