import React, { useState } from 'react';
import { DamagePoint } from '../types';
import { ShieldAlert, Trash2, Eye, Grid, Maximize2 } from 'lucide-react';

interface VehicleInspectionDiagramProps {
  damages: DamagePoint[];
  onChangeDamages: (damages: DamagePoint[]) => void;
  checklistItems: {
    riscosPintura: boolean;
    mossasAmassados: boolean;
    vidroTrincado: boolean;
    rodasRaladas: boolean;
    pertencesPessoais: boolean;
    pneuEstepeOk: boolean;
  };
  onChangeChecklist: (items: any) => void;
}

type ViewMode = 'GRID_ALL' | 'Frente' | 'Traseira' | 'Lateral Esquerda' | 'Lateral Direita' | 'Teto';

export const VehicleInspectionDiagram: React.FC<VehicleInspectionDiagramProps> = ({
  damages,
  onChangeDamages,
  checklistItems,
  onChangeChecklist,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('GRID_ALL');
  const [selectedPartForNewPoint, setSelectedPartForNewPoint] = useState<'Frente' | 'Traseira' | 'Lateral Esquerda' | 'Lateral Direita' | 'Teto' | 'Vidros' | 'Rodas'>('Frente');
  const [damageType, setDamageType] = useState<'Risco' | 'Amassado' | 'Mancha' | 'Trincado' | 'Outro'>('Risco');
  const [severity, setSeverity] = useState<'Leve' | 'Médio' | 'Grave'>('Leve');
  const [notes, setNotes] = useState('');

  const toggleChecklist = (key: keyof typeof checklistItems) => {
    onChangeChecklist({
      ...checklistItems,
      [key]: !checklistItems[key],
    });
  };

  // Generic Click Handler for SVG Views
  const handleViewClick = (
    e: React.MouseEvent<HTMLDivElement>,
    partName: 'Frente' | 'Traseira' | 'Lateral Esquerda' | 'Lateral Direita' | 'Teto'
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPoint: DamagePoint = {
      id: 'd_' + Date.now(),
      part: partName,
      type: damageType,
      severity: severity,
      notes: notes || `${damageType} em ${partName}`,
      x,
      y,
    };

    onChangeDamages([...damages, newPoint]);
    setNotes('');
  };

  const removePoint = (id: string) => {
    onChangeDamages(damages.filter((d) => d.id !== id));
  };

  // Helper to render points for a specific view part
  const renderPointsForPart = (partName: string) => {
    const partDamages = damages.filter((d) => d.part === partName);
    return partDamages.map((pt) => {
      const globalIndex = damages.findIndex((d) => d.id === pt.id) + 1;
      const bgClass =
        pt.severity === 'Grave'
          ? 'bg-rose-500 border-rose-300 text-white animate-bounce'
          : pt.severity === 'Médio'
          ? 'bg-amber-500 border-amber-200 text-slate-950 font-bold'
          : 'bg-blue-500 border-blue-200 text-white';

      return (
        <div
          key={pt.id}
          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 group/marker z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 ${bgClass} flex items-center justify-center text-[10px] font-extrabold shadow-lg cursor-pointer transition-transform hover:scale-125`}
          >
            {globalIndex}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/marker:flex flex-col bg-slate-950 text-white text-[10px] p-2 rounded-lg border border-slate-700 shadow-2xl whitespace-nowrap z-30">
            <span className="font-bold text-amber-400">
              #{globalIndex} {pt.type} ({pt.part})
            </span>
            <span className="text-slate-300">{pt.notes}</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Gravidade: {pt.severity}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Checklist Toggle Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => toggleChecklist('riscosPintura')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
            checklistItems.riscosPintura
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-[#182233] border-[#25334d] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>Riscos na Pintura</span>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              checklistItems.riscosPintura ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold' : 'border-slate-500'
            }`}
          >
            {checklistItems.riscosPintura && '✓'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleChecklist('mossasAmassados')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
            checklistItems.mossasAmassados
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-[#182233] border-[#25334d] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>Amassados / Mossa</span>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              checklistItems.mossasAmassados ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold' : 'border-slate-500'
            }`}
          >
            {checklistItems.mossasAmassados && '✓'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleChecklist('vidroTrincado')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
            checklistItems.vidroTrincado
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-[#182233] border-[#25334d] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>Vidro Trincado</span>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              checklistItems.vidroTrincado ? 'border-rose-400 bg-rose-400 text-slate-950 font-bold' : 'border-slate-500'
            }`}
          >
            {checklistItems.vidroTrincado && '✓'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleChecklist('rodasRaladas')}
          className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
            checklistItems.rodasRaladas
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-[#182233] border-[#25334d] text-slate-300 hover:border-slate-600'
          }`}
        >
          <span>Rodas Raladas</span>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
              checklistItems.rodasRaladas ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold' : 'border-slate-500'
            }`}
          >
            {checklistItems.rodasRaladas && '✓'}
          </div>
        </button>
      </div>

      {/* Main Blueprint Card */}
      <div className="bg-[#131b2c] border border-[#23314a] rounded-2xl p-4 space-y-4">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 border-b border-[#23314a] gap-3">
          <div>
            <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-400" /> Vistoria Técnica — Modelo Popular 4 Portas
            </h4>
            <p className="text-[11px] text-slate-400">
              Clique em qualquer uma das 4 vistas (Frente, Traseira, Lateral Esquerda, Lateral Direita) para marcar a avaria.
            </p>
          </div>

          {/* Config Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* View Mode Buttons */}
            <div className="bg-[#0b101c] p-1 rounded-lg border border-[#1f2d45] flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveViewMode('GRID_ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeViewMode === 'GRID_ALL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ver os 4 Lados Simultaneamente"
              >
                <Grid className="w-3 h-3" />
                <span>4 Vistas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('Frente')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeViewMode === 'Frente' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Frente
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('Traseira')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeViewMode === 'Traseira' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Traseira
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('Lateral Esquerda')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeViewMode === 'Lateral Esquerda' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lat. Esq.
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('Lateral Direita')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  activeViewMode === 'Lateral Direita' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lat. Dir.
              </button>
            </div>

            {/* Damage Type */}
            <select
              value={damageType}
              onChange={(e: any) => setDamageType(e.target.value)}
              className="bg-[#182338] text-slate-200 border border-[#283854] rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="Risco">Risco</option>
              <option value="Amassado">Amassado / Mossa</option>
              <option value="Mancha">Mancha / Queimado</option>
              <option value="Trincado">Trincado / Quebrado</option>
              <option value="Outro">Outro Defeito</option>
            </select>

            {/* Severity */}
            <select
              value={severity}
              onChange={(e: any) => setSeverity(e.target.value)}
              className="bg-[#182338] text-slate-200 border border-[#283854] rounded-lg px-2.5 py-1 text-xs"
            >
              <option value="Leve">Amarelo (Leve)</option>
              <option value="Médio">Laranja (Médio)</option>
              <option value="Grave">Vermelho (Grave)</option>
            </select>
          </div>
        </div>

        {/* Notes Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação da avaria (ex: Risco fundo na porta dianteira esquerda)..."
            className="flex-1 bg-[#182338] border border-[#283854] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* BLUEPRINT CANVAS (4 Views Grid or Single View) */}
        {activeViewMode === 'GRID_ALL' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0a0f1d] p-3 rounded-xl border border-[#1e2c45] relative overflow-hidden">
            {/* Background Blueprint Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#132038_1px,transparent_1px),linear-gradient(to_bottom,#132038_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />

            {/* 1. FRENTE (Front View) */}
            <div className="relative group border border-[#203150] bg-[#0d1424]/90 rounded-xl p-2 transition-all hover:border-blue-500/50">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  1. Visão Frontal (Frente)
                </span>
                <span className="text-[10px] text-slate-500">Clique para marcar</span>
              </div>
              <div
                onClick={(e) => handleViewClick(e, 'Frente')}
                className="w-full h-44 sm:h-48 relative cursor-crosshair flex items-center justify-center overflow-hidden rounded-lg bg-[#080d19]/80 border border-[#1a2842] hover:bg-[#0c1326] transition-colors select-none"
              >
                {/* SVG Front View popular 4-door car */}
                <svg className="w-full h-full p-2 text-slate-300" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                  {/* Roof & Pillars */}
                  <path d="M 85 65 Q 150 45 215 65 L 225 90 L 75 90 Z" strokeWidth="2" strokeLinejoin="round" fill="#141f36" />
                  {/* Windshield */}
                  <path d="M 90 68 Q 150 52 210 68 L 220 88 L 80 88 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.4" />
                  <path d="M 150 52 L 150 68" stroke="#38bdf8" strokeWidth="1" opacity="0.4" /> {/* Rearview mirror stalk */}
                  <rect x="145" y="65" width="10" height="5" rx="1" fill="#38bdf8" opacity="0.6" />
                  
                  {/* Side Mirrors */}
                  <path d="M 68 88 C 55 85, 55 98, 72 98 Z" strokeWidth="1.5" fill="#1e2d4a" />
                  <path d="M 232 88 C 245 85, 245 98, 228 98 Z" strokeWidth="1.5" fill="#1e2d4a" />

                  {/* Main Body / Hood */}
                  <path d="M 60 120 L 75 90 L 225 90 L 240 120 Q 250 145 240 160 L 60 160 Q 50 145 60 120 Z" strokeWidth="2" fill="#182540" />
                  {/* Hood crease lines */}
                  <path d="M 100 90 L 105 122" strokeWidth="1.2" opacity="0.6" />
                  <path d="M 200 90 L 195 122" strokeWidth="1.2" opacity="0.6" />
                  <path d="M 150 90 L 150 120" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />

                  {/* Headlights (Modern 4-door style) */}
                  <path d="M 60 118 Q 90 115 95 130 Q 75 135 58 130 Z" strokeWidth="1.5" fill="#38bdf8" fillOpacity="0.2" stroke="#60a5fa" />
                  <circle cx="75" cy="124" r="5" fill="#93c5fd" opacity="0.8" />
                  <path d="M 240 118 Q 210 115 205 130 Q 225 135 242 130 Z" strokeWidth="1.5" fill="#38bdf8" fillOpacity="0.2" stroke="#60a5fa" />
                  <circle cx="225" cy="124" r="5" fill="#93c5fd" opacity="0.8" />

                  {/* Grille & Emblem */}
                  <path d="M 105 120 L 195 120 L 188 138 L 112 138 Z" strokeWidth="1.5" fill="#0b1220" />
                  <line x1="110" y1="126" x2="190" y2="126" strokeWidth="1" opacity="0.5" />
                  <line x1="114" y1="132" x2="186" y2="132" strokeWidth="1" opacity="0.5" />
                  <circle cx="150" cy="126" r="6" strokeWidth="1.5" fill="#2563eb" />

                  {/* Bumper & License Plate */}
                  <path d="M 52 145 Q 150 148 248 145 L 244 165 Q 150 170 56 165 Z" strokeWidth="1.5" fill="#111a2e" />
                  {/* License Plate */}
                  <rect x="120" y="146" width="60" height="14" rx="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
                  <text x="150" y="156" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">ABC-1234</text>

                  {/* Lower Fog lights & Mesh */}
                  <rect x="70" y="148" width="20" height="8" rx="2" fill="#0b1220" strokeWidth="1" />
                  <circle cx="80" cy="152" r="2.5" fill="#fef08a" />
                  <rect x="210" y="148" width="20" height="8" rx="2" fill="#0b1220" strokeWidth="1" />
                  <circle cx="220" cy="152" r="2.5" fill="#fef08a" />

                  {/* Tires / Wheels Stance */}
                  <rect x="42" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <rect x="244" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <line x1="30" y1="170" x2="270" y2="170" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                </svg>

                {/* Markers Overlay */}
                {renderPointsForPart('Frente')}
              </div>
            </div>

            {/* 2. TRASEIRA (Rear View) */}
            <div className="relative group border border-[#203150] bg-[#0d1424]/90 rounded-xl p-2 transition-all hover:border-blue-500/50">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  2. Visão Traseira (Traseira)
                </span>
                <span className="text-[10px] text-slate-500">Clique para marcar</span>
              </div>
              <div
                onClick={(e) => handleViewClick(e, 'Traseira')}
                className="w-full h-44 sm:h-48 relative cursor-crosshair flex items-center justify-center overflow-hidden rounded-lg bg-[#080d19]/80 border border-[#1a2842] hover:bg-[#0c1326] transition-colors select-none"
              >
                {/* SVG Rear View popular 4-door car */}
                <svg className="w-full h-full p-2 text-slate-300" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                  {/* Roof & Rear Glass */}
                  <path d="M 85 65 Q 150 45 215 65 L 225 95 L 75 95 Z" strokeWidth="2" strokeLinejoin="round" fill="#141f36" />
                  <path d="M 92 68 Q 150 52 208 68 L 218 93 L 82 93 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.4" />
                  {/* Defroster lines */}
                  <line x1="100" y1="76" x2="200" y2="76" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
                  <line x1="96" y1="83" x2="204" y2="83" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
                  {/* 3rd Brake Light */}
                  <rect x="135" y="66" width="30" height="3" rx="1" fill="#ef4444" opacity="0.9" />

                  {/* Main Hatch / Trunk Body */}
                  <path d="M 60 120 L 75 95 L 225 95 L 240 120 Q 250 145 240 160 L 60 160 Q 50 145 60 120 Z" strokeWidth="2" fill="#182540" />
                  {/* Tailgate cut line */}
                  <path d="M 80 95 L 85 142 Q 150 145 215 142 L 220 95" strokeWidth="1.2" opacity="0.5" />

                  {/* Taillights (Red & White LED design) */}
                  <path d="M 58 118 Q 95 115 100 132 Q 72 136 56 128 Z" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.8" stroke="#f87171" />
                  <path d="M 60 120 L 80 120 L 78 126 L 59 125 Z" fill="#ffffff" opacity="0.7" />
                  <path d="M 242 118 Q 205 115 200 132 Q 228 136 244 128 Z" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.8" stroke="#f87171" />
                  <path d="M 240 120 L 220 120 L 222 126 L 241 125 Z" fill="#ffffff" opacity="0.7" />

                  {/* Brand Emblem & Model Badge */}
                  <circle cx="150" cy="110" r="5" strokeWidth="1.2" fill="#2563eb" />
                  <text x="90" y="112" fontSize="6" fontWeight="bold" fill="#94a3b8">POPULAR 1.0</text>

                  {/* Rear Bumper & Sensors */}
                  <path d="M 52 142 Q 150 146 248 142 L 244 165 Q 150 170 56 165 Z" strokeWidth="1.5" fill="#111a2e" />
                  <circle cx="90" cy="152" r="1.5" fill="#64748b" />
                  <circle cx="120" cy="153" r="1.5" fill="#64748b" />
                  <circle cx="180" cy="153" r="1.5" fill="#64748b" />
                  <circle cx="210" cy="152" r="1.5" fill="#64748b" />

                  {/* License Plate */}
                  <rect x="120" y="146" width="60" height="14" rx="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
                  <text x="150" y="156" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">ABC-1234</text>

                  {/* Exhaust Pipe Tip */}
                  <rect x="75" y="162" width="10" height="5" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

                  {/* Tires / Wheels Stance */}
                  <rect x="42" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <rect x="244" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <line x1="30" y1="170" x2="270" y2="170" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                </svg>

                {/* Markers Overlay */}
                {renderPointsForPart('Traseira')}
              </div>
            </div>

            {/* 3. LATERAL ESQUERDA (Left Side Profile - 4 Doors) */}
            <div className="relative group border border-[#203150] bg-[#0d1424]/90 rounded-xl p-2 transition-all hover:border-blue-500/50">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  3. Lateral Esquerda (4 Portas)
                </span>
                <span className="text-[10px] text-slate-500">Clique para marcar</span>
              </div>
              <div
                onClick={(e) => handleViewClick(e, 'Lateral Esquerda')}
                className="w-full h-48 sm:h-52 relative cursor-crosshair flex items-center justify-center overflow-hidden rounded-lg bg-[#080d19]/80 border border-[#1a2842] hover:bg-[#0c1326] transition-colors select-none"
              >
                {/* SVG 4-Door Side View popular hatchback/sedan */}
                <svg className="w-full h-full p-2 text-slate-300" viewBox="0 0 500 200" fill="none" stroke="currentColor">
                  {/* Car Main Body Outline */}
                  <path
                    d="M 35 135 L 45 115 L 90 100 L 170 52 Q 220 40 330 42 L 415 62 Q 460 100 470 125 L 475 145 L 440 145 A 35 35 0 0 0 370 145 L 180 145 A 35 35 0 0 0 110 145 L 35 145 Z"
                    strokeWidth="2.2"
                    fill="#182540"
                    strokeLinejoin="round"
                  />

                  {/* Windows & Pillars (4 Door Layout) */}
                  {/* Front Window */}
                  <path d="M 175 58 L 245 58 L 245 98 L 105 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.5" />
                  {/* Rear Window */}
                  <path d="M 252 58 L 335 58 L 375 98 L 252 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.5" />
                  {/* C-Pillar Small Quarter Glass */}
                  <path d="M 380 98 L 340 60 L 405 68 Z" strokeWidth="1.2" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.4" />

                  {/* B-Pillar divider (separates front & rear doors) */}
                  <rect x="245" y="55" width="7" height="45" fill="#090d16" stroke="#1e293b" />

                  {/* 4 DOOR SEPARATION CUT LINES */}
                  {/* Front Door Line */}
                  <path d="M 170 54 L 100 100 L 100 145" strokeWidth="1.5" opacity="0.6" />
                  <path d="M 248 100 L 248 145" strokeWidth="1.5" opacity="0.6" /> {/* Between front & rear door */}
                  {/* Rear Door Line */}
                  <path d="M 378 98 L 378 145" strokeWidth="1.5" opacity="0.6" />

                  {/* Door Handles (Front & Rear Doors) */}
                  <rect x="195" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
                  <rect x="300" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />

                  {/* Side Mirror */}
                  <path d="M 125 90 Q 110 82 110 98 L 128 98 Z" strokeWidth="1.5" fill="#1e2d4a" stroke="#60a5fa" />

                  {/* Wheels & Tires (Detailed 5-Spoke Rims) */}
                  {/* Front Wheel */}
                  <g>
                    <circle cx="145" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                    <circle cx="145" cy="145" r="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="145" cy="145" r="6" fill="#38bdf8" />
                    {/* Spokes */}
                    <line x1="145" y1="127" x2="145" y2="163" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="127" y1="145" x2="163" y2="145" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Rear Wheel */}
                  <g>
                    <circle cx="405" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                    <circle cx="405" cy="145" r="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="405" cy="145" r="6" fill="#38bdf8" />
                    {/* Spokes */}
                    <line x1="405" y1="127" x2="405" y2="163" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="387" y1="145" x2="423" y2="145" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Lights & Trim */}
                  {/* Headlight Wrap */}
                  <path d="M 35 130 L 60 115 L 65 125 Z" fill="#60a5fa" opacity="0.7" />
                  {/* Taillight Wrap */}
                  <path d="M 470 120 L 450 112 L 452 125 Z" fill="#ef4444" opacity="0.8" />
                  {/* Character Body Line */}
                  <path d="M 60 112 L 450 112" strokeWidth="1" strokeDasharray="6,4" opacity="0.3" />

                  {/* Ground Line */}
                  <line x1="20" y1="177" x2="490" y2="177" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                </svg>

                {/* Markers Overlay */}
                {renderPointsForPart('Lateral Esquerda')}
              </div>
            </div>

            {/* 4. LATERAL DIREITA (Right Side Profile - 4 Doors) */}
            <div className="relative group border border-[#203150] bg-[#0d1424]/90 rounded-xl p-2 transition-all hover:border-blue-500/50">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  4. Lateral Direita (4 Portas)
                </span>
                <span className="text-[10px] text-slate-500">Clique para marcar</span>
              </div>
              <div
                onClick={(e) => handleViewClick(e, 'Lateral Direita')}
                className="w-full h-48 sm:h-52 relative cursor-crosshair flex items-center justify-center overflow-hidden rounded-lg bg-[#080d19]/80 border border-[#1a2842] hover:bg-[#0c1326] transition-colors select-none"
              >
                {/* SVG 4-Door Right Side View (Mirrored popular model) */}
                <svg className="w-full h-full p-2 text-slate-300" viewBox="0 0 500 200" fill="none" stroke="currentColor">
                  {/* Car Main Body Outline (Facing Right) */}
                  <path
                    d="M 465 135 L 455 115 L 410 100 L 330 52 Q 280 40 170 42 L 85 62 Q 40 100 30 125 L 25 145 L 60 145 A 35 35 0 0 1 130 145 L 320 145 A 35 35 0 0 1 390 145 L 465 145 Z"
                    strokeWidth="2.2"
                    fill="#182540"
                    strokeLinejoin="round"
                  />

                  {/* Windows & Pillars */}
                  <path d="M 325 58 L 255 58 L 255 98 L 395 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.5" />
                  <path d="M 248 58 L 165 58 L 125 98 L 248 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.5" />
                  <path d="M 120 98 L 160 60 L 95 68 Z" strokeWidth="1.2" fill="#0c1424" stroke="#38bdf8" strokeOpacity="0.4" />

                  <rect x="248" y="55" width="7" height="45" fill="#090d16" stroke="#1e293b" />

                  {/* Doors lines */}
                  <path d="M 330 54 L 400 100 L 400 145" strokeWidth="1.5" opacity="0.6" />
                  <path d="M 252 100 L 252 145" strokeWidth="1.5" opacity="0.6" />
                  <path d="M 122 98 L 122 145" strokeWidth="1.5" opacity="0.6" />

                  {/* Handles */}
                  <rect x="283" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
                  <rect x="178" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />

                  {/* Fuel Flap Cap */}
                  <rect x="100" y="108" width="16" height="16" rx="3" stroke="#64748b" strokeWidth="1" fill="#131e33" />

                  {/* Side Mirror */}
                  <path d="M 375 90 Q 390 82 390 98 L 372 98 Z" strokeWidth="1.5" fill="#1e2d4a" stroke="#60a5fa" />

                  {/* Wheels */}
                  <g>
                    <circle cx="355" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                    <circle cx="355" cy="145" r="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="355" cy="145" r="6" fill="#38bdf8" />
                    <line x1="355" y1="127" x2="355" y2="163" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="337" y1="145" x2="373" y2="145" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  <g>
                    <circle cx="95" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                    <circle cx="95" cy="145" r="20" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="95" cy="145" r="6" fill="#38bdf8" />
                    <line x1="95" y1="127" x2="95" y2="163" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="77" y1="145" x2="113" y2="145" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Lights */}
                  <path d="M 465 130 L 440 115 L 435 125 Z" fill="#60a5fa" opacity="0.7" />
                  <path d="M 30 120 L 50 112 L 48 125 Z" fill="#ef4444" opacity="0.8" />

                  {/* Ground Line */}
                  <line x1="10" y1="177" x2="490" y2="177" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                </svg>

                {/* Markers Overlay */}
                {renderPointsForPart('Lateral Direita')}
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE ENLARGED VIEW MODE */
          <div className="bg-[#0a0f1d] p-4 rounded-xl border border-[#1e2c45] relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Visão Ampliada: {activeViewMode}
              </span>
              <button
                type="button"
                onClick={() => setActiveViewMode('GRID_ALL')}
                className="text-xs text-slate-400 hover:text-white bg-[#182338] px-2.5 py-1 rounded-lg border border-[#263757] flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" /> Voltar ao Grid
              </button>
            </div>

            <div
              onClick={(e) => handleViewClick(e, activeViewMode as any)}
              className="w-full h-64 sm:h-80 relative cursor-crosshair flex items-center justify-center overflow-hidden rounded-xl bg-[#080d19] border border-[#203150] select-none"
            >
              {activeViewMode === 'Frente' && (
                <svg className="w-full h-full p-4 text-slate-300" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                  <path d="M 85 65 Q 150 45 215 65 L 225 90 L 75 90 Z" strokeWidth="2" fill="#141f36" />
                  <path d="M 90 68 Q 150 52 210 68 L 220 88 L 80 88 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" opacity="0.5" />
                  <path d="M 60 120 L 75 90 L 225 90 L 240 120 Q 250 145 240 160 L 60 160 Q 50 145 60 120 Z" strokeWidth="2" fill="#182540" />
                  <path d="M 60 118 Q 90 115 95 130 Q 75 135 58 130 Z" strokeWidth="1.5" fill="#38bdf8" fillOpacity="0.3" stroke="#60a5fa" />
                  <path d="M 240 118 Q 210 115 205 130 Q 225 135 242 130 Z" strokeWidth="1.5" fill="#38bdf8" fillOpacity="0.3" stroke="#60a5fa" />
                  <rect x="120" y="146" width="60" height="14" rx="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
                  <text x="150" y="156" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">ABC-1234</text>
                  <rect x="42" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <rect x="244" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                </svg>
              )}

              {activeViewMode === 'Traseira' && (
                <svg className="w-full h-full p-4 text-slate-300" viewBox="0 0 300 200" fill="none" stroke="currentColor">
                  <path d="M 85 65 Q 150 45 215 65 L 225 95 L 75 95 Z" strokeWidth="2" fill="#141f36" />
                  <path d="M 92 68 Q 150 52 208 68 L 218 93 L 82 93 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" opacity="0.5" />
                  <path d="M 60 120 L 75 95 L 225 95 L 240 120 Q 250 145 240 160 L 60 160 Q 50 145 60 120 Z" strokeWidth="2" fill="#182540" />
                  <path d="M 58 118 Q 95 115 100 132 Q 72 136 56 128 Z" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.8" stroke="#f87171" />
                  <path d="M 242 118 Q 205 115 200 132 Q 228 136 244 128 Z" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.8" stroke="#f87171" />
                  <rect x="120" y="146" width="60" height="14" rx="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
                  <text x="150" y="156" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">ABC-1234</text>
                  <rect x="42" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                  <rect x="244" y="142" width="14" height="28" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
                </svg>
              )}

              {(activeViewMode === 'Lateral Esquerda' || activeViewMode === 'Lateral Direita') && (
                <svg className="w-full h-full p-4 text-slate-300" viewBox="0 0 500 200" fill="none" stroke="currentColor">
                  <path
                    d="M 35 135 L 45 115 L 90 100 L 170 52 Q 220 40 330 42 L 415 62 Q 460 100 470 125 L 475 145 L 440 145 A 35 35 0 0 0 370 145 L 180 145 A 35 35 0 0 0 110 145 L 35 145 Z"
                    strokeWidth="2.2"
                    fill="#182540"
                  />
                  <path d="M 175 58 L 245 58 L 245 98 L 105 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" opacity="0.5" />
                  <path d="M 252 58 L 335 58 L 375 98 L 252 98 Z" strokeWidth="1.5" fill="#0c1424" stroke="#38bdf8" opacity="0.5" />
                  <rect x="245" y="55" width="7" height="45" fill="#090d16" stroke="#1e293b" />
                  <rect x="195" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
                  <rect x="300" y="105" width="22" height="5" rx="2.5" fill="#334155" stroke="#64748b" strokeWidth="1" />
                  <circle cx="145" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                  <circle cx="405" cy="145" r="32" fill="#090d16" stroke="#334155" strokeWidth="3" />
                </svg>
              )}

              {/* Markers Overlay */}
              {renderPointsForPart(activeViewMode)}
            </div>
          </div>
        )}

        {/* LIST OF REGISTERED DAMAGES */}
        {damages.length > 0 ? (
          <div className="pt-2 border-t border-[#23314a] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Avarias Registradas no Diagrama ({damages.length}):
              </span>
              <button
                type="button"
                onClick={() => onChangeDamages([])}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Limpar Avarias
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {damages.map((pt, idx) => (
                <div
                  key={pt.id}
                  className="flex items-center justify-between bg-[#182338] border border-[#283854] px-3 py-2 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className={`w-5 h-5 rounded-full font-extrabold text-[10px] flex items-center justify-center shrink-0 ${
                        pt.severity === 'Grave'
                          ? 'bg-rose-500 text-white'
                          : pt.severity === 'Médio'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-slate-200 font-bold">{pt.part}:</span>
                        <span className="text-amber-300 font-semibold">{pt.type}</span>
                      </div>
                      <span className="text-slate-400 text-[10px] block truncate">{pt.notes}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePoint(pt.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Remover avaria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 text-[11px] border-t border-[#23314a]">
            Nenhuma avaria registrada. Clique em qualquer local das 4 vistas do carro para adicionar uma marcação.
          </div>
        )}
      </div>
    </div>
  );
};
