import React, { useState } from 'react';
import { ChevronDown, FileText, ShieldCheck } from 'lucide-react';
import {
  ENGINE_SERVICE_TERM,
  GENERAL_SERVICE_TERM,
  LEGAL_CONTENT_VERSION,
} from '../legal/legalContent';

const sections = [
  {
    title: 'Termos de Uso',
    content:
      'O Agenda Detailer é uma ferramenta de apoio à gestão automotiva. A empresa usuária é responsável pela exatidão dos cadastros, lançamentos, autorizações, obrigações fiscais, trabalhistas e decisões tomadas com base nas informações inseridas. O uso da plataforma não substitui orientação contábil, jurídica, fiscal, financeira ou trabalhista. Este documento é provisório e deverá receber identificação jurídica do fornecedor e revisão profissional antes do lançamento.',
  },
  {
    title: 'Privacidade e LGPD',
    content:
      'A empresa usuária decide como utilizar os dados de seus clientes, veículos e colaboradores e, em regra, atua como controladora desses dados. O Agenda Detailer realiza o tratamento necessário para disponibilizar o sistema e atua principalmente como operador, sem prejuízo das situações em que tratar dados próprios de conta, segurança e cobrança. O acesso deve respeitar finalidade, necessidade, segurança e os direitos dos titulares. Este texto será complementado com identificação, contato de privacidade, retenção, compartilhamentos e procedimento de atendimento aos titulares.',
  },
  {
    title: 'Financeiro',
    content:
      'Os valores exibidos possuem finalidade gerencial e dependem dos dados cadastrados pela empresa usuária. O Agenda Detailer não substitui contabilidade, conciliação bancária, documentos fiscais ou consultoria financeira. Os lançamentos e documentos oficiais devem ser conferidos antes de decisões administrativas.',
  },
  {
    title: 'Ponto da equipe',
    content:
      'O módulo auxilia no registro e na conferência interna da jornada. Enquanto o Agenda Detailer não estiver formalmente adequado aos requisitos técnicos e documentais aplicáveis ao REP-P, seus registros devem ser tratados como controle gerencial auxiliar, sem substituir automaticamente as obrigações legais do empregador.',
  },
];

export const LegalView: React.FC = () => {
  const [open, setOpen] = useState('Termos de Uso');

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-24 sm:p-6">
      <div className="rounded-2xl border border-blue-500/25 bg-[#141c2b] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Legal, privacidade e responsabilidades</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Textos provisórios para validação jurídica antes do lançamento. Versão {LEGAL_CONTENT_VERSION}.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <article key={section.title} className="overflow-hidden rounded-xl border border-[#273854] bg-[#121a2a]">
            <button
              type="button"
              onClick={() => setOpen(open === section.title ? '' : section.title)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            >
              <span className="font-semibold text-slate-100">{section.title}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open === section.title ? 'rotate-180' : ''}`} />
            </button>
            {open === section.title && <p className="border-t border-[#273854] px-4 py-4 text-sm leading-6 text-slate-300">{section.content}</p>}
          </article>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white"><FileText className="h-5 w-5 text-amber-400" /> Modelos de responsabilidade</h3>
        {[GENERAL_SERVICE_TERM, ENGINE_SERVICE_TERM].map((term) => (
          <article key={term.id} className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-amber-100">{term.title}</h4>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                {term.required ? 'Obrigatório quando aplicável' : 'Opcional'}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{term.text}</p>
            <p className="mt-3 text-xs text-amber-300">Modelo provisório — substitua pelo texto definitivo antes do uso comercial.</p>
          </article>
        ))}
      </div>
    </section>
  );
};
