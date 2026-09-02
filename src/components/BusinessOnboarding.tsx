import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { BusinessProfileFields } from './BusinessProfileFields';
import { normalizeBusinessAreas, normalizeBusinessModules } from '../lib/businessProfile';

interface Props { settings: ShopSettings; onComplete: (settings: ShopSettings) => Promise<boolean>; onLogout: () => void; }

export const BusinessOnboarding: React.FC<Props> = ({ settings, onComplete, onLogout }) => {
  const [areas, setAreas] = useState(() => normalizeBusinessAreas(settings.businessAreas?.length ? settings.businessAreas : [settings.shopCategory || 'Estética automotiva']));
  const [modules, setModules] = useState(() => normalizeBusinessModules(settings.enabledModules));
  const [shopCategory, setShopCategory] = useState<NonNullable<ShopSettings['shopCategory']>>(settings.shopCategory || 'Estética Automotiva');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const finish = async () => {
    if (!areas.length) { setError('Escolha pelo menos uma área de atuação.'); return; }
    setBusy(true); setError('');
    const saved = await onComplete({ ...settings, shopCategory, businessAreas: areas, enabledModules: modules, onboardingCompleted: true });
    if (!saved) setError('Não foi possível salvar. Confira a conexão e tente novamente.');
    setBusy(false);
  };
  return <main className="min-h-dvh bg-[#0d121f] p-4 text-white"><div className="mx-auto max-w-4xl space-y-6 py-8">
    <header className="space-y-2"><p className="text-xs font-bold uppercase tracking-wider text-blue-400">Primeiro acesso</p><h1 className="text-2xl font-black">Vamos configurar a operação da {settings.name}</h1><p className="text-sm text-slate-400">Escolha as áreas e os recursos que fazem sentido agora. Tudo poderá ser alterado posteriormente nas Configurações.</p></header>
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-5">
      <label className="block text-sm font-bold text-white">Tipo principal do comércio
        <select value={shopCategory} disabled={busy} onChange={(event) => setShopCategory(event.target.value as NonNullable<ShopSettings['shopCategory']>)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white">
          <option value="Estética Automotiva">Estética Automotiva</option><option value="Studio Detailer">Studio Detailer</option><option value="Lava Rápido Premium">Lava Rápido</option><option value="Oficina Mecânica">Oficina Mecânica</option><option value="Centro Automotivo">Centro Automotivo</option><option value="Funilaria e Pintura">Funilaria e Pintura</option><option value="Loja de Acessórios">Loja de Acessórios</option><option value="Pneus e Alinhamento">Pneus e Alinhamento</option><option value="Operação Híbrida">Operação Híbrida</option>
        </select>
      </label>
      <BusinessProfileFields areas={areas} modules={modules} onAreasChange={setAreas} onModulesChange={setModules} disabled={busy} />
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-950 p-3 text-sm text-rose-200">{error}</p>}
    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3"><button type="button" onClick={onLogout} disabled={busy} className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300">Sair da conta</button><button type="button" onClick={() => void finish()} disabled={busy} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Salvando…' : 'Concluir configuração'}</button></div>
  </div></main>;
};
