import React, { useState } from 'react';
import { Car, Mail, Lock, Sparkles, ArrowRight, Store, Building2, CheckCircle2 } from 'lucide-react';
import { DEMO_SAAS_TENANTS } from '../data/mockData';

interface AuthViewProps {
  onLoginSuccess: (email: string, customTenant?: { name: string; category?: any }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState<'Estética Automotiva' | 'Studio Detailer' | 'Lava Rápido Premium' | 'Oficina Mecânica'>('Estética Automotiva');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'signup' && shopName) {
      onLoginSuccess(email || 'nova.loja@estetica.com', {
        name: shopName,
        category: shopCategory,
      });
    } else {
      onLoginSuccess(email || 'contato@autoshine.com.br');
    }
  };

  const handleDemoLogin = (demoEmail?: string) => {
    onLoginSuccess(demoEmail || 'contato@autoshine.com.br');
  };

  return (
    <div className="min-h-screen bg-[#0d121f] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Branding */}
      <div className="text-center space-y-3 mb-6 z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mx-auto">
          <Car className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Agenda Detailer <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase font-mono align-middle">SaaS</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-sm mx-auto">
          Plataforma SaaS multi-tenant: Cada oficina ou estúdio possui sua própria identidade, logotipo e gestão.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-[#131b2c] border border-[#23314a] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5">
        {/* Toggle Tabs: Entrar / Criar Conta */}
        <div className="grid grid-cols-2 bg-[#0b101c] p-1 rounded-2xl border border-[#1f2d45]">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar na sua Loja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastrar Nova Oficina
          </button>
        </div>

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome da sua Loja / Oficina / Estúdio *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ex: Extreme Car Detailer"
                    className="w-full bg-[#182338] border border-[#283854] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Estabelecimento
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={shopCategory}
                    onChange={(e: any) => setShopCategory(e.target.value)}
                    className="w-full bg-[#182338] border border-[#283854] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Estética Automotiva">Estética Automotiva</option>
                    <option value="Studio Detailer">Studio Detailer VIP</option>
                    <option value="Lava Rápido Premium">Lava Rápido Premium</option>
                    <option value="Oficina Mecânica">Oficina Mecânica</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              E-mail Comercial
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@sualoja.com"
                className="w-full bg-[#182338] border border-[#283854] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#182338] border border-[#283854] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 cursor-pointer mt-2"
          >
            {activeTab === 'login' ? 'Entrar no Painel da Oficina' : 'Criar Conta e Abrir Minha Oficina'}
          </button>
        </form>

        {/* Quick Multi-tenant Accounts Selector */}
        <div className="pt-2 border-t border-[#23314a]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
            Ou escolha uma Loja de Demonstração (SaaS Tenants):
          </span>

          <div className="space-y-1.5">
            {DEMO_SAAS_TENANTS.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => handleDemoLogin(tenant.email)}
                className="w-full bg-[#172238] hover:bg-[#1f2d4a] border border-[#263758] p-2 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {tenant.shopSettings.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {tenant.shopSettings.shopCategory} • {tenant.email}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-[11px] text-slate-500 text-center max-w-sm mt-5 z-10 leading-snug">
        Cada usuário possui seu próprio ambiente isolado com logo e nome personalizados.
      </p>
    </div>
  );
};
