import React, { useState, useMemo } from 'react';
import { ProductItem, ShopSettings } from '../types';
import {
  ShoppingCart,
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Building2,
  Phone,
  AlertTriangle,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  Sparkles
} from 'lucide-react';

interface PurchaseOrderItem {
  product: ProductItem;
  quantityToOrder: number;
}

interface PurchaseOrderModalProps {
  products: ProductItem[];
  shopSettings?: ShopSettings;
  onClose: () => void;
  onMarkOrdered?: (productIds: string[]) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  products,
  shopSettings,
  onClose,
  onMarkOrdered,
}) => {
  // Extract unique suppliers
  const suppliers = useMemo(() => {
    const list = products
      .map((p) => p.supplier)
      .filter((s): s is string => Boolean(s && s.trim()));
    return ['Todos os Fornecedores', ...Array.from(new Set(list))];
  }, [products]);

  const [selectedSupplier, setSelectedSupplier] = useState<string>('Todos os Fornecedores');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Initial order items: all low-stock products matching selected supplier
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>(() => {
    const lowStock = products.filter((p) => p.currentStock <= p.minStock);
    return (lowStock.length > 0 ? lowStock : products.slice(0, 3)).map((p) => {
      const suggested = Math.max(1, p.minStock * 2 - p.currentStock);
      return {
        product: p,
        quantityToOrder: suggested,
      };
    });
  });

  // Filter products matching supplier
  const filteredProductsToAdd = useMemo(() => {
    return products.filter((p) => {
      const alreadyInOrder = orderItems.some((item) => item.product.id === p.id);
      if (alreadyInOrder) return false;
      if (selectedSupplier === 'Todos os Fornecedores') return true;
      return p.supplier === selectedSupplier;
    });
  }, [products, orderItems, selectedSupplier]);

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantityToOrder: Math.max(1, newQty) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddItem = (product: ProductItem) => {
    const suggested = Math.max(1, product.minStock * 2 - product.currentStock);
    setOrderItems((prev) => [...prev, { product, quantityToOrder: suggested }]);
  };

  // Calculations
  const totalCost = orderItems.reduce(
    (sum, item) => sum + (item.product.costPrice || 0) * item.quantityToOrder,
    0
  );

  const totalUnits = orderItems.reduce((sum, item) => sum + item.quantityToOrder, 0);

  const shopName = shopSettings?.name || 'Studio de Estética Automotiva';
  const shopPhone = shopSettings?.phone || '';
  const shopAddress = shopSettings?.address || '';
  const ownerName = shopSettings?.ownerName || '';

  // Generate WhatsApp formatted text
  const generateWhatsAppMessage = () => {
    const supplierGreeting =
      selectedSupplier !== 'Todos os Fornecedores'
        ? `Olá, equipe da *${selectedSupplier}*!`
        : `Olá! Tudo bem?`;

    let text = `${supplierGreeting} 🚗📦\n\n`;
    text += `Aqui é *${ownerName ? `${ownerName} da ` : ''}${shopName}*.\n`;
    text += `Gostaríamos de solicitar a cotação e envio dos seguintes insumos para nossa operação:\n\n`;
    text += `🛒 *LISTA DO PEDIDO DE REPOSIÇÃO:*\n`;

    orderItems.forEach((item, idx) => {
      const p = item.product;
      const skuText = p.sku ? ` (Cód: ${p.sku})` : '';
      const brandText = p.brand ? ` [${p.brand}]` : '';
      text += `  ${idx + 1}. *${item.quantityToOrder}x ${p.unit}* - ${p.name}${brandText}${skuText}\n`;
    });

    text += `\n📊 *Total de Itens:* ${orderItems.length} produtos (${totalUnits} unidades)\n`;
    text += `💰 *Previsão de Custo:* aprox. R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

    if (shopAddress) {
      text += `📍 *Endereço de Entrega:* ${shopAddress}\n`;
    }
    if (shopPhone) {
      text += `📞 *Contato WhatsApp:* ${shopPhone}\n`;
    }
    if (shopSettings?.cnpjCpf) {
      text += `🏢 *CNPJ/CPF para Faturamento:* ${shopSettings.cnpjCpf}\n`;
    }

    text += `\nPor favor, nos confirme a disponibilidade em estoque, valores finais e a previsão de entrega. Muito obrigado!`;
    return text;
  };

  const messageText = generateWhatsAppMessage();

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const cleanPhone = supplierPhone.replace(/\D/g, '');
    if (cleanPhone) {
      const full = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${full}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[#23314a] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 via-blue-600/20 to-amber-600/20 border-b border-[#22334f] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Automação de Compras
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Agrupamento automático de itens críticos
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Gerador de Pedido de Compra & Reposição
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-[#192336] p-2 rounded-xl border border-[#2b3d5e] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-[#162133] border-b border-[#22334f] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">Fornecedor:</span>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="bg-[#0f172a] text-xs font-bold text-white border border-[#253754] rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">WhatsApp Fornecedor:</span>
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="bg-[#0f172a] text-xs text-white border border-[#253754] rounded-xl px-3 py-1.5 w-36 sm:w-44 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#1f2c42]">
          
          {/* Left Column: Order Items Manager (7 cols) */}
          <div className="lg:col-span-7 p-4 space-y-3 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                Itens Inclusos no Pedido ({orderItems.length}):
              </span>
              <span className="text-xs font-bold text-emerald-400">
                Total Previsto: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* List of items */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[380px]">
              {orderItems.length > 0 ? (
                orderItems.map(({ product, quantityToOrder }) => {
                  const isCritical = product.currentStock <= product.minStock;
                  const itemSubtotal = (product.costPrice || 0) * quantityToOrder;

                  return (
                    <div
                      key={product.id}
                      className="bg-[#141d2d] border border-[#22314a] rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate block">
                            {product.name}
                          </span>
                          {isCritical && (
                            <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                              CRÍTICO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>
                            Estoque atual: <strong className="text-amber-400">{product.currentStock}</strong> / Mín: {product.minStock} {product.unit}
                          </span>
                          <span>•</span>
                          <span>
                            Unit: R$ {(product.costPrice || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Stepper for Quantity to Order */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-[#0d1422] border border-[#263754] rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(product.id, quantityToOrder - 1)}
                            className="px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-[#1e2a3f] font-black text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantityToOrder}
                            onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center bg-transparent text-white font-bold text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(product.id, quantityToOrder + 1)}
                            className="px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-[#1e2a3f] font-black text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-slate-400 text-[11px] font-mono w-16 text-right">
                          R$ {itemSubtotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remover do Pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhum item selecionado para o pedido.
                </div>
              )}
            </div>

            {/* Quick Add other products dropdown */}
            {filteredProductsToAdd.length > 0 && (
              <div className="pt-2 border-t border-[#1f2c42]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Adicionar outro produto ao pedido:
                  </span>
                  <select
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) handleAddItem(prod);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="bg-[#141d2d] text-xs text-slate-200 border border-[#253754] rounded-xl px-2.5 py-1 flex-1 focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      + Selecionar produto do catálogo...
                    </option>
                    {filteredProductsToAdd.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Atual: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Formatted Message & Instant Send (5 cols) */}
          <div className="lg:col-span-5 p-4 bg-[#0e1524] flex flex-col justify-between space-y-3">
            
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Mensagem Formatada para WhatsApp:
                </span>
                <button
                  onClick={handleCopyText}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-[#182438] px-2.5 py-1 rounded-lg border border-blue-500/20 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copiar
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={messageText}
                rows={12}
                className="w-full bg-[#0b101a] border border-[#202d44] rounded-2xl p-3 text-xs text-slate-200 font-mono leading-relaxed resize-none focus:outline-none flex-1 shadow-inner"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>DISPARAR PEDIDO NO WHATSAPP DO FORNECEDOR</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                💡 <em>A mensagem já inclui a lista de produtos, quantidades, código SKU e dados da sua oficina para faturamento rápido.</em>
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
