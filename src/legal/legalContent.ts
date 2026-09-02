export const LEGAL_CONTENT_VERSION = 'provisorio-2026-09-01';

export const GENERAL_SERVICE_TERM = {
  id: 'responsabilidade-geral',
  version: 'provisorio-1',
  title: 'Termo de responsabilidade do serviço',
  required: false,
  text:
    'O cliente declara que recebeu informações sobre o serviço solicitado, autorizou sua execução e informou as condições relevantes do veículo. Declara ainda estar ciente de que defeitos preexistentes, vícios ocultos, adaptações, peças fragilizadas e objetos não declarados podem interferir no resultado. Este texto é provisório e deverá ser substituído pelo termo definitivo da empresa.',
};

export const ENGINE_SERVICE_TERM = {
  id: 'limpeza-motor',
  version: 'provisorio-1',
  title: 'Termo obrigatório para limpeza ou lavagem de motor',
  required: true,
  text:
    'O cliente autoriza a limpeza ou lavagem do compartimento do motor e declara ter sido informado de que componentes elétricos, eletrônicos, conectores, sensores, módulos, vedações, adaptações e defeitos preexistentes podem reagir à umidade ou ao procedimento. Este texto é provisório e deverá ser substituído pelo termo definitivo da empresa.',
};

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const requiresEngineTerm = (serviceNames: string[]) =>
  serviceNames.some((name) => {
    const value = normalize(name);
    return value.includes('motor') && (value.includes('lavagem') || value.includes('limpeza') || value.includes('higienizacao'));
  });

export const buildTermSnapshot = ({
  generalAccepted,
  engineAccepted,
  responsibleName,
}: {
  generalAccepted: boolean;
  engineAccepted: boolean;
  responsibleName: string;
}) => {
  const accepted: string[] = [];
  if (generalAccepted) accepted.push(`${GENERAL_SERVICE_TERM.title} (versão ${GENERAL_SERVICE_TERM.version})`);
  if (engineAccepted) accepted.push(`${ENGINE_SERVICE_TERM.title} (versão ${ENGINE_SERVICE_TERM.version})`);
  if (!accepted.length) return '';

  return [
    '[ACEITE DE TERMOS]',
    `Responsável informado: ${responsibleName.trim() || 'não informado'}`,
    `Termos aceitos: ${accepted.join('; ')}`,
    `Registrado em: ${new Date().toISOString()}`,
  ].join('\n');
};
