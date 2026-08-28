import React, { useMemo, useState } from 'react';
import { ProductItem, ShopSettings } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
  Zap,
} from 'lucide-react';

interface QuickStockOutflowModalProps {
  products: ProductItem[];
  shopSettings?: ShopSettings;
  onAdjustStock: (productId: string, delta: number) => void;
  onCreateProduct?: (product: ProductItem) => void;
  onOpenPurchaseOrder?: () => void;
  onClose: () => void;
}

const PACKAGE_OPTIONS = ['500 ml', '1 L', '2 L', '5 L', 'Outro'] as const;

type PackageOption = (typeof PACKAGE_OPTIONS)[number];

export const QuickStockOutflowModal: React.FC<QuickStockOutflowModalProps> = ({
  products,
  onAdjustStock,
  onCreateProduct,
  onOpenPurchaseOrder,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [packageSize, setPackageSize] = useState<PackageOption | ''>('');
  const [customPackageSize, setCustomPackageSize] = useState('');
  const [quickCreateMode, setQuickCreateMode] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'warn';
  } | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.sku]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [products, search]);

  const selectedSize =
    packageSize === 'Outro' ? customPackageSize.trim() : packageSize;

  const canConfirmExisting =
    Boolean(selectedProduct) &&
    Boolean(selectedSize) &&
    (selectedProduct?.currentStock ?? 0) > 0;

  const canConfirmQuickCreate =
    quickCreateMode && Boolean(newProductName.trim()) && Boolean(selectedSize);

  const canConfirm = canConfirmExisting || canConfirmQuickCreate;

  const resetSelection = () => {
    setSelectedProduct(null);
    setPackageSize('');
    setCustomPackageSize('');
    setQuickCreateMode(false);
    setNewProductName('');
    setSearch('');
  };

  const selectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setQuickCreateMode(false);
    setNewProductName('');
    setPackageSize('');
    setCustomPackageSize('');
    setFeedback(null);
  };

  const startQuickCreate = () => {
    setSelectedProduct(null);
    setQuickCreateMode(true);
    setNewProductName(search.trim());
    setPackageSize('');
    setCustomPackageSize('');
    setFeedback(null);
  };

  const handleConfirmOutflow = () => {
    if (!selectedSize) return;

    if (quickCreateMode) {
      const cleanName = newProductName.trim();
      if (!cleanName) return;

      const newProduct: ProductItem = {
        id: `quick_product_${Date.now()}`,
        name: cleanName,
        category: 'Cadastro rápido',
        unit: 'Unidade',
        costPrice: 0,
        currentStock: 0,
        minStock: 0,
        description: `Cadastrado durante uma baixa rápida. Embalagem: ${selectedSize}.`,
        tags: ['cadastro-rápido'],
      };

      onCreateProduct?.(newProduct);

      setFeedback({
        message: `${cleanName} foi cadastrado e a baixa de 1 unidade (${selectedSize}) foi registrada.`,
        type: 'success',
      });

      resetSelection();
      return;
    }

    if (!selectedProduct) return;

    if (selectedProduct.currentStock <= 0) {
      setFeedback({
        message: `O estoque de ${selectedProduct.name} já está zerado.`,
        type: 'warn',
      });
      return;
    }

    onAdjustStock(selectedProduct.id, -1);

    setFeedback({
      message: `Baixa registrada: 1 unidade de ${selectedProduct.name} (${selectedSize}).`,
      type: 'success',
    });

    resetSelection();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-4">
      <div className="my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#23314a] bg-[#111827] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#22334f] bg-gradient-to-r from-amber-600/25 via-rose-600/10 to-transparent p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
              <Zap className="h-5 w-5 fill-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-white sm:text-xl">Baixa de estoque</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Selecione o produto e informe o tamanho da embalagem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-xl border border-[#2b3d5e] bg-[#192336] p-2 text-slate-400 transition-colors hover:text-white"
            aria-label="Fechar baixa de estoque"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`flex shrink-0 items-center gap-2 border-b px-4 py-3 text-xs font-bold ${
              feedback.type === 'warn'
                ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {feedback.type === 'warn' ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-wide text-slate-300">
                  1. Buscar produto
                </label>
                {onOpenPurchaseOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPurchaseOrder();
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Pedir reposição
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    if (quickCreateMode) {
                      setQuickCreateMode(false);
                      setNewProductName('');
                      setPackageSize('');
                      setCustomPackageSize('');
                    }
                  }}
                  placeholder="Ex.: shampoo, cera, boina..."
                  autoFocus
                  className="w-full rounded-2xl border border-[#2a3a57] bg-[#151f30] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isSelected = selectedProduct?.id === product.id;
                    const isEmpty = product.currentStock <= 0;

                    return (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                            : 'border-[#23334d] bg-[#141d2d] hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">{product.name}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {product.brand || 'Sem marca informada'}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black ${
                            isEmpty
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#2a3a57] px-4 py-5 text-center">
                    <div className="text-xs font-bold text-slate-300">Nenhum produto encontrado.</div>
                    {search.trim() && onCreateProduct && (
                      <>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Esqueceu de cadastrar este produto no estoque?
                        </p>
                        <button
                          type="button"
                          onClick={startQuickCreate}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-300 transition-colors hover:bg-amber-500/20"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Cadastrar e dar baixa
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section
              className={`space-y-3 transition-opacity ${
                selectedProduct || quickCreateMode ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-300">
                  {quickCreateMode ? '2. Cadastrar e dar baixa' : '2. Tamanho da embalagem'}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {quickCreateMode
                    ? 'Só o essencial agora. Os demais dados podem ser preenchidos depois no estoque.'
                    : 'A baixa sempre corresponde a uma unidade inteira do produto.'}
                </p>
              </div>

              {selectedProduct && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#253754] bg-[#162133] p-3">
                  <Package className="h-4 w-4 shrink-0 text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">{selectedProduct.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Estoque atual: {selectedProduct.currentStock} {selectedProduct.unit}
                    </div>
                  </div>
                </div>
              )}

              {quickCreateMode && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Nome do produto</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(event) => setNewProductName(event.target.value)}
                    placeholder="Nome do produto"
                    className="w-full rounded-2xl border border-amber-500/40 bg-[#151f30] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {PACKAGE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    disabled={!selectedProduct && !quickCreateMode}
                    onClick={() => {
                      setPackageSize(option);
                      if (option !== 'Outro') setCustomPackageSize('');
                    }}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed ${
                      packageSize === option
                        ? 'border-amber-400 bg-amber-500 text-slate-950'
                        : 'border-[#2a3a57] bg-[#151f30] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {packageSize === 'Outro' && (
                <input
                  type="text"
                  value={customPackageSize}
                  onChange={(event) => setCustomPackageSize(event.target.value)}
                  placeholder="Ex.: 750 ml, 3,6 L, caixa com 12..."
                  className="w-full rounded-2xl border border-amber-500/40 bg-[#151f30] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
                />
              )}
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#22334f] bg-[#0e1524] p-4 sm:p-5">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirmOutflow}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Zap className="h-4 w-4 fill-current" />
            {quickCreateMode && selectedSize
              ? `Cadastrar e registrar baixa · ${selectedSize}`
              : selectedProduct && selectedSize
              ? `Confirmar baixa de 1 unidade · ${selectedSize}`
              : 'Selecione o produto e a embalagem'}
          </button>
        </div>
      </div>
    </div>
  );
};
