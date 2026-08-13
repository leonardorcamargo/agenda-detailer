import React, { useState, useMemo } from 'react';
import { ProductItem, ShopSettings } from '../types';
import {
  Zap,
  X,
  Search,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  QrCode,
  Camera,
  Trash2,
  AlertOctagon,
  Wrench,
  RotateCcw,
  ShoppingCart
} from 'lucide-react';

interface QuickStockOutflowModalProps {
  products: ProductItem[];
  shopSettings?: ShopSettings;
  onAdjustStock: (productId: string, delta: number) => void;
  onOpenPurchaseOrder?: () => void;
  onClose: () => void;
}

type OutflowReason = 'patio' | 'avaria' | 'descarte' | 'ajuste';

export const QuickStockOutflowModal: React.FC<QuickStockOutflowModalProps> = ({
  products,
  shopSettings,
  onAdjustStock,
  onOpenPurchaseOrder,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    products.length > 0 ? products[0] : null
  );
  const [selectedReason, setSelectedReason] = useState<OutflowReason>('patio');
  const [quantity, setQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Todas', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const showNotification = (message: string, type: 'success' | 'warn' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Fast direct adjustment (e.g. -1 directly on card)
  const handleQuickDeduct = (product: ProductItem, amount: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (product.currentStock <= 0) {
      showNotification(`"${product.name}" já está com estoque zerado!`, 'warn');
      return;
    }
    const realDelta = -Math.min(amount, product.currentStock);
    onAdjustStock(product.id, realDelta);
    showNotification(`Baixa rápida de ${amount} ${product.unit} em "${product.name}" realizada!`);
  };

  // Fast direct restock (+1 directly on card)
  const handleQuickAdd = (product: ProductItem, amount: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onAdjustStock(product.id, amount);
    showNotification(`Entrada de +${amount} ${product.unit} em "${product.name}" registrada!`);
  };

  // Submit selected product adjustment
  const handleConfirmOutflow = () => {
    if (!selectedProduct) return;
    if (selectedProduct.currentStock < quantity) {
      showNotification(
        `Atenção: Estoque atual (${selectedProduct.currentStock}) é menor que a quantidade (${quantity}). Ajustado ao limite.`,
        'warn'
      );
    }
    const delta = -quantity;
    onAdjustStock(selectedProduct.id, delta);

    const reasonLabel =
      selectedReason === 'patio'
        ? 'Uso no Pátio'
        : selectedReason === 'avaria'
        ? 'Avaria / Quebra'
        : selectedReason === 'descarte'
        ? 'Descarte'
        : 'Ajuste';

    showNotification(
      `Baixa de ${quantity} ${selectedProduct.unit} de "${selectedProduct.name}" (${reasonLabel}) concluída!`
    );
    setQuantity(1);
  };

  // Barcode quick scan simulation
  const handleSimulateScan = () => {
    setIsBarcodeScanning(true);
    setTimeout(() => {
      setIsBarcodeScanning(false);
      // Pick a random or first product
      if (products.length > 0) {
        const randomP = products[Math.floor(Math.random() * products.length)];
        setSelectedProduct(randomP);
        showNotification(`Código de barras bipado: "${randomP.name}" (${randomP.sku || 'SKU-OK'})!`);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[#23314a] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/30 via-rose-600/20 to-blue-600/20 border-b border-[#22334f] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <Zap className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  ⚡ 3 Cliques no Pátio
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Sem burocracia para quem está na operação
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Baixa Flash & Registro Rápido de Insumos
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPurchaseOrder && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPurchaseOrder();
                }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 rounded-xl transition-all cursor-pointer"
                title="Fazer Pedido para Fornecedor via WhatsApp"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Pedir Reposição</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-[#192336] p-2 rounded-xl border border-[#2b3d5e] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 animate-in slide-in-from-top duration-150 ${
              feedback.type === 'warn'
                ? 'bg-amber-500/20 text-amber-300 border-b border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
            }`}
          >
            {feedback.type === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Content: Two Columns (Left = Product selector / Right = Big Action Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#1f2c42]">
          
          {/* LEFT COLUMN: Fast Search & Product Cards (7 cols) */}
          <div className="lg:col-span-7 p-4 space-y-3 overflow-y-auto flex flex-col">
            
            {/* Search & Camera Bipar bar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Toque para buscar: Shampoo, Cera, Boina..."
                  className="w-full bg-[#162133] border border-[#253754] text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 placeholder-slate-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bipar Barcode Button */}
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isBarcodeScanning}
                className="bg-[#1c2a42] hover:bg-[#253754] text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                title="Escanear Código de Barras pela Câmera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isBarcodeScanning ? 'Lendo...' : 'Bipar Código'}
                </span>
              </button>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'bg-[#151f30] text-slate-400 hover:text-white border border-[#23334d]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products List (Large Touch Targets) */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[420px]">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const isLow = p.currentStock <= p.minStock;
                  const isZero = p.currentStock <= 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : isZero
                          ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                          : isLow
                          ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700'
                          : 'bg-[#141d2d] border-[#22314a] hover:border-slate-600 hover:bg-[#182338]'
                      }`}
                    >
                      {/* Left info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate block">
                            {p.name}
                          </span>
                          {p.brand && (
                            <span className="text-[10px] text-slate-400 bg-[#1e2a3f] px-1.5 py-0.5 rounded">
                              {p.brand}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span
                            className={`font-black px-2 py-0.5 rounded-md ${
                              isZero
                                ? 'bg-rose-500 text-white'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            Mín: {p.minStock} {p.unit}
                          </span>
                          {p.supplier && (
                            <span className="text-slate-400 text-[10px] truncate hidden sm:inline">
                              • {p.supplier}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Instant Action Buttons: Fast -1, +1 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleQuickDeduct(p, 1, e)}
                          className="w-8 h-8 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 flex items-center justify-center text-xs font-black transition-all cursor-pointer active:scale-95"
                          title="Dar baixa rápida de 1 unidade agora"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(p, 1, e)}
                          className="w-8 h-8 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 flex items-center justify-center text-xs font-black transition-all cursor-pointer active:scale-95"
                          title="Entrada rápida de +1 unidade"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Nenhum produto encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Big-Touch Outflow Controller (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#0e1524] flex flex-col justify-between space-y-4">
            
            {selectedProduct ? (
              <div className="space-y-4">
                
                {/* Active Product Card */}
                <div className="bg-[#162133] border border-[#253754] p-4 rounded-2xl space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Item Selecionado para Baixa:
                  </span>
                  <h4 className="text-base font-black text-white leading-tight">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#22334f]">
                    <span className="text-slate-400">Estoque Físico Atual:</span>
                    <span className="text-sm font-black text-white">
                      {selectedProduct.currentStock} {selectedProduct.unit}
                    </span>
                  </div>
                </div>

                {/* Big Quantity Stepper */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Quantidade para Baixa:
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-14 h-14 rounded-2xl bg-[#1a2538] hover:bg-[#23334d] text-white border border-[#2a3c5a] flex items-center justify-center text-xl font-black transition-all cursor-pointer active:scale-90"
                    >
                      -1
                    </button>

                    <div className="flex-1 bg-[#121a29] border-2 border-amber-500/60 rounded-2xl h-14 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                        {quantity}
                      </span>
                      <span className="text-xs text-slate-400 font-bold ml-1.5">
                        {selectedProduct.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-14 h-14 rounded-2xl bg-[#1a2538] hover:bg-[#23334d] text-white border border-[#2a3c5a] flex items-center justify-center text-xl font-black transition-all cursor-pointer active:scale-90"
                    >
                      +1
                    </button>
                  </div>

                  {/* Preset Multipliers */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1, 2, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          quantity === num
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                            : 'bg-[#151f30] text-slate-400 hover:text-white border-[#23334d]'
                        }`}
                      >
                        {num} {selectedProduct.unit.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motivo da Baixa */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Motivo do Registro:
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReason('patio')}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                        selectedReason === 'patio'
                          ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                          : 'bg-[#151f30] border-[#23334d] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Uso no Pátio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedReason('avaria')}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                        selectedReason === 'avaria'
                          ? 'bg-rose-600/30 border-rose-500 text-white font-bold'
                          : 'bg-[#151f30] border-[#23334d] text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Quebrou / Avaria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedReason('descarte')}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                        selectedReason === 'descarte'
                          ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                          : 'bg-[#151f30] border-[#23334d] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Descarte / Fim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedReason('ajuste')}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2 cursor-pointer ${
                        selectedReason === 'ajuste'
                          ? 'bg-purple-600/30 border-purple-500 text-white font-bold'
                          : 'bg-[#151f30] border-[#23334d] text-slate-400 hover:text-white'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Inventário</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Selecione um produto ao lado para ajustar.
              </div>
            )}

            {/* Giant Confirmation Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedProduct}
                onClick={handleConfirmOutflow}
                className="w-full h-14 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 active:scale-[0.98]"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>CONFIRMAR BAIXA FLASH (-{quantity} {selectedProduct?.unit || ''})</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
