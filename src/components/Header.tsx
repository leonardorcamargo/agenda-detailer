import React from 'react';
import { ShopSettings } from '../types';
import { Wrench, PlusCircle, Menu, X, Zap, AlertTriangle } from 'lucide-react';
import { AgendaDetailerMark } from './AgendaDetailerBrand';

interface HeaderProps {
  settings: ShopSettings;
  activeViewTitle: string;
  activeViewSubtitle?: string;
  onNewOSClick: () => void;
  carsInYardCount: number;
  lowStockCount?: number;
  onOpenQuickStockOutflow?: () => void;
  onOpenPurchaseOrder?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeViewTitle,
  activeViewSubtitle,
  onNewOSClick,
  carsInYardCount,
  lowStockCount = 0,
  onOpenQuickStockOutflow,
  onOpenPurchaseOrder,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-16 bg-[#111827] border-b border-[#1f293d] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Mobile Menu Toggle & Current Location */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1f293d] transition-colors cursor-pointer shrink-0"
          title="Abrir menu de navegação"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="min-w-0">
          <h1 className="text-white font-bold text-sm sm:text-base leading-snug truncate">
            {activeViewTitle}
          </h1>
          {activeViewSubtitle && (
            <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {activeViewSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Stock Alert Badge (if any items are low on stock) */}
        {lowStockCount > 0 && onOpenPurchaseOrder && (
          <button
            onClick={onOpenPurchaseOrder}
            className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer animate-pulse"
            title="Clique para gerar Pedido de Compra no WhatsApp do Fornecedor"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">{lowStockCount} {lowStockCount === 1 ? 'Insumo em Falta' : 'Insumos em Falta'}</span>
            <span className="sm:hidden">{lowStockCount} Falta</span>
          </button>
        )}

        {/* Quick Yard Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-[#172236] border border-[#23314a] px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <Wrench className="w-3.5 h-3.5 text-blue-400" />
          <span>No Pátio:</span>
          <span className="font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded-md text-[11px]">
            {carsInYardCount}
          </span>
        </div>

        {/* Baixa Flash Button (3 Clicks) */}
        {onOpenQuickStockOutflow && (
          <button
            onClick={onOpenQuickStockOutflow}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs px-2.5 sm:px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-amber-900/30 cursor-pointer"
            title="Baixa Flash de Insumos (3 Cliques)"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span className="hidden sm:inline">Baixa Flash</span>
            <span className="sm:hidden text-[11px]">Baixa</span>
          </button>
        )}

        {/* Quick New OS Button */}
        <button
          onClick={onNewOSClick}
          className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-2.5 sm:px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-blue-900/30 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Nova OS</span>
          <span className="sm:hidden text-[11px] font-bold">OS</span>
        </button>

        {/* Platform brand; user identity remains in the sidebar menu. */}
        <div className="flex items-center pl-1.5 sm:pl-2 border-l border-[#26334d]" title="Agenda Detailer">
          <AgendaDetailerMark className="w-8 h-9 sm:w-9 sm:h-10" />
        </div>
      </div>
    </header>
  );
};


