export interface OsReadinessInput {
  companyId: string;
  clientName: string;
  plate: string;
  serviceCount: number;
  engineTermRequired: boolean;
  engineTermAccepted: boolean;
  anyTermAccepted: boolean;
  termResponsibleName: string;
}

export interface OsReadinessItem {
  id: string;
  label: string;
  ready: boolean;
  hint: string;
}

export const getOsReadiness = (input: OsReadinessInput): OsReadinessItem[] => [
  {
    id: 'company',
    label: 'Empresa identificada',
    ready: Boolean(input.companyId),
    hint: 'Saia e entre novamente para carregar a empresa.',
  },
  {
    id: 'customer',
    label: 'Nome do cliente',
    ready: Boolean(input.clientName.trim()),
    hint: 'Informe ou consulte o cliente.',
  },
  {
    id: 'vehicle',
    label: 'Placa do veículo',
    ready: Boolean(input.plate.trim()),
    hint: 'Informe ou consulte a placa.',
  },
  {
    id: 'services',
    label: 'Ao menos um serviço',
    ready: input.serviceCount > 0,
    hint: 'Selecione um serviço do catálogo.',
  },
  {
    id: 'engine-term',
    label: 'Termo de limpeza de motor',
    ready: !input.engineTermRequired || input.engineTermAccepted,
    hint: 'Apresente e confirme o termo obrigatório de motor.',
  },
  {
    id: 'responsible',
    label: 'Responsável pelo aceite',
    ready: !input.anyTermAccepted || Boolean(input.termResponsibleName.trim()),
    hint: 'Informe o nome de quem confirmou o termo.',
  },
];

export const pendingOsReadiness = (items: OsReadinessItem[]) => items.filter((item) => !item.ready);
