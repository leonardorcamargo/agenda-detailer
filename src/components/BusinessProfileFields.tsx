import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BUSINESS_AREA_OPTIONS, BUSINESS_MODULES, BusinessModule, normalizeBusinessAreas } from '../lib/businessProfile';

interface Props {
  areas: string[];
  modules: BusinessModule[];
  onAreasChange: (areas: string[]) => void;
  onModulesChange: (modules: BusinessModule[]) => void;
  disabled?: boolean;
}

export const BusinessProfileFields: React.FC<Props> = ({ areas, modules, onAreasChange, onModulesChange, disabled = false }) => {
  const [customArea, setCustomArea] = useState('');
  const predefined = new Set<string>(BUSINESS_AREA_OPTIONS);
  const customAreas = areas.filter((area) => !predefined.has(area));

  const toggleArea = (area: string) => onAreasChange(
    areas.includes(area) ? areas.filter((item) => item !== area) : normalizeBusinessAreas([...areas, area])
  );
  const addCustomArea = () => {
    const next = normalizeBusinessAreas([...areas, customArea]);
    if (next.length === areas.length) return;
    onAreasChange(next); setCustomArea('');
  };
  const toggleModule = (module: BusinessModule) => onModulesChange(
    modules.includes(module) ? modules.filter((item) => item !== module) : [...modules, module]
  );

  return <div className="space-y-5">
    <section className="space-y-3">
      <div><h3 className="text-sm font-bold text-white">Áreas de atuação</h3><p className="text-xs text-slate-400">Escolha uma ou mais áreas. Você poderá alterar isso quando a empresa evoluir.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BUSINESS_AREA_OPTIONS.map((area) => <label key={area} className={`rounded-xl border p-3 text-xs font-semibold cursor-pointer ${areas.includes(area) ? 'border-blue-500/60 bg-blue-600/15 text-blue-200' : 'border-slate-700 bg-slate-900/40 text-slate-300'}`}>
          <input type="checkbox" className="mr-2" checked={areas.includes(area)} disabled={disabled} onChange={() => toggleArea(area)} />{area}
        </label>)}
      </div>
      <div className="flex gap-2">
        <input value={customArea} disabled={disabled || areas.length >= 8} onChange={(event) => setCustomArea(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomArea(); } }} placeholder="Adicionar outra área" maxLength={60} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" />
        <button type="button" disabled={disabled || !customArea.trim() || areas.length >= 8} onClick={addCustomArea} className="rounded-xl bg-blue-600 px-3 py-2 text-white disabled:opacity-40" aria-label="Adicionar área"><Plus className="w-4 h-4" /></button>
      </div>
      {customAreas.length > 0 && <div className="flex flex-wrap gap-2">{customAreas.map((area) => <span key={area} className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200">{area}<button type="button" disabled={disabled} onClick={() => onAreasChange(areas.filter((item) => item !== area))} aria-label={`Remover ${area}`}><X className="w-3 h-3" /></button></span>)}</div>}
    </section>
    <section className="space-y-3">
      <div><h3 className="text-sm font-bold text-white">Recursos do Agenda Detailer</h3><p className="text-xs text-slate-400">Desativar um recurso apenas o remove dos menus. Os dados continuam preservados.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BUSINESS_MODULES.map((module) => <label key={module.id} className={`rounded-xl border p-3 cursor-pointer ${modules.includes(module.id) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/40'}`}>
          <div className="flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={modules.includes(module.id)} disabled={disabled} onChange={() => toggleModule(module.id)} /><span><strong className="block text-xs text-white">{module.label}</strong><span className="text-[11px] text-slate-400">{module.description}</span></span></div>
        </label>)}
      </div>
      <p className="text-[11px] text-slate-500">Dashboard e Configurações permanecem sempre disponíveis.</p>
    </section>
  </div>;
};
