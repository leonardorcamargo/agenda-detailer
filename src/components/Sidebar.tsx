import React from 'react';
import { ShopSettings } from '../types';
import { 
  LayoutDashboard, 
  FilePlus, 
  Car, 
  Wallet, 
  Users,
  Calendar,
  Layers,
  Flame,
  Settings, 
  LogOut,
  X
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'agendamento' | 'nova-os' | 'patio' | 'financeiro' | 'mao-de-obra' | 'catalogo' | 'combos' | 'configuracoes';

interface SidebarProps {
  settings: ShopSettings;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  pendingCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onLogout,
  pendingCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const menuItems: { id: ActiveTab; label: string; shortLabel: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio', icon: LayoutDashboard },
    { id: 'agendamento', label: 'Agenda & Agendamentos', shortLabel: 'Agenda', icon: Calendar },
    { id: 'nova-os', label: 'Nova Ordem de Serviço', shortLabel: 'Nova OS', icon: FilePlus },
    { id: 'patio', label: 'Pátio (Kanban)', shortLabel: 'Pátio', icon: Car, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'financeiro', label: 'Financeiro', shortLabel: 'Finanças', icon: Wallet },
    { id: 'mao-de-obra', label: 'Equipe', shortLabel: 'Equipe', icon: Users },
    { id: 'catalogo', label: 'Catálogo', shortLabel: 'Catálogo', icon: Layers },
    { id: 'combos', label: 'Combos & Pacotes', shortLabel: 'Combos', icon: Flame },
    { id: 'configuracoes', label: 'Configurações do Perfil', shortLabel: 'Perfil', icon: Settings },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Branding Section with Custom Shop Logo & Identity */}
      <div>
        <div className="p-4 border-b border-[#1f293d]/80 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            {/* Shop Identity Container */}
            <div className="flex items-center gap-3 bg-[#151e30] border border-[#23314a] p-2.5 rounded-2xl">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-10 h-10 rounded-xl object-cover border border-blue-500/30 shadow-md shrink-0 bg-[#0d121f]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-500/20 shrink-0">
                  {settings.name ? settings.name.charAt(0).toUpperCase() : <Car className="w-5 h-5 stroke-[2.2]" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-bold text-sm tracking-tight leading-tight truncate" title={settings.name}>
                  {settings.name || 'Sua Estética'}
                </h2>
                <p className="text-[10px] text-blue-400 font-medium truncate mt-0.5">
                  {settings.shopCategory || 'Estética Automotiva'}
                </p>
              </div>
            </div>
          </div>

          {/* Close button for Mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden ml-2 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2333]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Account Context & Logout */}
      <div className="p-4 border-t border-[#1f293d] space-y-3">
        {/* Active User Account Badge */}
        <div className="bg-[#172033] border border-[#24324a] rounded-xl p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-500/30 shrink-0">
                {settings.ownerName ? settings.ownerName.charAt(0) : 'U'}
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold text-slate-200 block truncate">
                  {settings.ownerName || 'Proprietário'}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {settings.email || 'voce@estetica.com'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleTabClick('configuracoes')}
              className="text-slate-400 hover:text-blue-400 p-1 rounded-lg"
              title="Editar Perfil da Loja"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair / Trocar de Conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#111827] border-r border-[#1f293d] flex-col justify-between shrink-0 select-none">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Slide-Over */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[80vw] bg-[#111827] border-r border-[#1f293d] flex flex-col justify-between shadow-2xl z-10 h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Always visible on mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur-md border-t border-[#1f293d] flex items-center justify-around px-1 py-1.5 shadow-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

