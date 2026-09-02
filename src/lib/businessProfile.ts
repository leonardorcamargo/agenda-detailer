export const BUSINESS_AREA_OPTIONS = [
  'Estética automotiva', 'Lava-rápido', 'Centro automotivo', 'Oficina mecânica',
  'Funilaria e pintura', 'Acessórios e produtos', 'Pneus e alinhamento',
] as const;

export const BUSINESS_MODULES = [
  { id: 'agenda', label: 'Agenda', description: 'Agendamentos e organização diária.' },
  { id: 'ordens_servico', label: 'Ordens de serviço', description: 'Abertura, execução e histórico de OS.' },
  { id: 'patio', label: 'Pátio', description: 'Acompanhamento dos veículos em atendimento.' },
  { id: 'clientes', label: 'Clientes e veículos', description: 'Cadastros e histórico por cliente.' },
  { id: 'financeiro', label: 'Financeiro', description: 'Receitas, despesas, taxas e valores líquidos.' },
  { id: 'equipe', label: 'Equipe e ponto', description: 'Colaboradores, presença, ponto e comissões.' },
  { id: 'catalogo', label: 'Catálogo e estoque', description: 'Serviços, produtos, insumos e estoque.' },
  { id: 'combos', label: 'Combos e pacotes', description: 'Pacotes promocionais de serviços.' },
  { id: 'lembretes', label: 'Lembretes', description: 'Anotações rápidas da operação.' },
] as const;

export type BusinessModule = typeof BUSINESS_MODULES[number]['id'];
export const DEFAULT_BUSINESS_MODULES: BusinessModule[] = BUSINESS_MODULES.map((module) => module.id);

export const normalizeBusinessAreas = (areas: string[]) => Array.from(new Set(
  areas.map((area) => area.trim()).filter(Boolean)
)).slice(0, 8);

export const normalizeBusinessModules = (modules: string[] | undefined): BusinessModule[] => {
  if (modules === undefined) return [...DEFAULT_BUSINESS_MODULES];
  const allowed = new Set<string>(DEFAULT_BUSINESS_MODULES);
  return Array.from(new Set(modules.filter((module): module is BusinessModule => allowed.has(module))));
};

const TAB_MODULE: Record<string, BusinessModule | undefined> = {
  agendamento: 'agenda', 'nova-os': 'ordens_servico', patio: 'patio', clientes: 'clientes',
  financeiro: 'financeiro', ponto: 'equipe', 'mao-de-obra': 'equipe', catalogo: 'catalogo',
  combos: 'combos', lembretes: 'lembretes',
};

export const moduleForTab = (tab: string) => TAB_MODULE[tab];
export const isModuleEnabled = (modules: string[] | undefined, module: BusinessModule) =>
  normalizeBusinessModules(modules).includes(module);
export const isTabEnabled = (modules: string[] | undefined, tab: string) => {
  const module = moduleForTab(tab);
  return !module || isModuleEnabled(modules, module);
};
