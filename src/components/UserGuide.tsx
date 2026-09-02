import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarPlus, CheckCircle2, ClipboardList, LayoutDashboard, Map, X } from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface UserGuideProps {
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

const steps: Array<{
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  actions: string[];
  target?: ActiveTab;
  actionLabel?: string;
}> = [
  {
    title: 'Comece pelo Dashboard',
    description: 'Use o Dashboard para entender o movimento do dia e localizar rapidamente o que precisa de atenção.',
    icon: LayoutDashboard,
    actions: ['Confira agendamentos e veículos em atendimento.', 'Use os atalhos superiores para criar uma OS ou dar baixa em insumos.', 'Cadastre seus serviços e equipe antes de iniciar a operação real.'],
    target: 'dashboard',
    actionLabel: 'Abrir Dashboard',
  },
  {
    title: 'Agende ou inicie um serviço',
    description: 'Um atendimento pode nascer na Agenda ou diretamente em Nova OS.',
    icon: CalendarPlus,
    actions: ['Na Agenda, escolha data, cliente, veículo e serviços.', 'Para atendimento imediato, abra Nova OS.', 'Consulte cliente ou placa para evitar cadastros duplicados.', 'Confira o checklist “Pronto para concluir” antes de salvar.'],
    target: 'nova-os',
    actionLabel: 'Criar Nova OS',
  },
  {
    title: 'Acompanhe o trabalho no Pátio',
    description: 'Depois de criada, a OS entra no Pátio para acompanhar cada etapa.',
    icon: Map,
    actions: ['Abra a OS e atribua um responsável.', 'Mude o status conforme o serviço avança.', 'Registre observações, produtos e etapas executadas.', 'Não marque como concluída antes da conferência final.'],
    target: 'patio',
    actionLabel: 'Abrir Pátio',
  },
  {
    title: 'Finalize com segurança',
    description: 'Antes de entregar o veículo, confira serviço, pagamento e situação da OS.',
    icon: CheckCircle2,
    actions: ['Confirme os serviços realmente executados.', 'Confira descontos, taxas e forma de pagamento.', 'Registre o recebimento ou valor a receber.', 'Finalize a OS e use o histórico para futuras consultas do cliente.'],
    target: 'patio',
    actionLabel: 'Conferir Pátio',
  },
  {
    title: 'Rotina básica de gestão',
    description: 'Alguns minutos por dia mantêm a operação organizada.',
    icon: ClipboardList,
    actions: ['Agenda: veja o que está previsto.', 'Pátio: acompanhe atrasos e responsáveis.', 'Financeiro: confira bruto, líquido, despesas e valores a receber.', 'Lembretes: anote retornos e tarefas.', 'Equipe e Ponto: acompanhe colaboradores conforme a função.'],
  },
];

export const UserGuide: React.FC<UserGuideProps> = ({ onClose, onNavigate }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Guia de primeiros passos">
      <section className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-[#2a3a58] bg-[#111827] shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#25334d] bg-[#111827]/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Primeiros passos · {step + 1} de {steps.length}</p>
            <h2 className="mt-1 text-lg font-bold text-white">Aprenda o básico do Agenda Detailer</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Fechar guia"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 p-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-500/15 p-3 text-blue-300"><Icon className="h-7 w-7" /></span>
            <div>
              <h3 className="text-xl font-bold text-white">{current.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{current.description}</p>
            </div>
          </div>
          <ol className="space-y-3">
            {current.actions.map((action, index) => (
              <li key={action} className="flex gap-3 rounded-xl border border-[#273854] bg-[#151f31] p-3 text-sm leading-5 text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
          {current.target && (
            <button type="button" onClick={() => onNavigate(current.target!)} className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 hover:bg-blue-500/20">
              {current.actionLabel}
            </button>
          )}
        </div>

        <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[#25334d] bg-[#111827]/95 px-5 py-4 backdrop-blur">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /> Voltar</button>
          {last ? (
            <button type="button" onClick={onClose} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Entendi, começar</button>
          ) : (
            <button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500">Próximo <ArrowRight className="h-4 w-4" /></button>
          )}
        </footer>
      </section>
    </div>
  );
};
