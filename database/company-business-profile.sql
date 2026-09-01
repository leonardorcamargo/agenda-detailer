alter table public.companies
  add column if not exists business_areas text[] not null default '{}'::text[],
  add column if not exists enabled_modules text[] not null default array[
    'agenda','ordens_servico','patio','clientes','financeiro','equipe','catalogo','combos','lembretes'
  ]::text[],
  add column if not exists onboarding_completed boolean not null default false;

alter table public.companies drop constraint if exists companies_enabled_modules_valid;
alter table public.companies add constraint companies_enabled_modules_valid
check (enabled_modules <@ array[
  'agenda','ordens_servico','patio','clientes','financeiro','equipe','catalogo','combos','lembretes'
]::text[]);

update public.companies
set business_areas = array['Estética automotiva']::text[],
    enabled_modules = array['agenda','ordens_servico','patio','clientes','financeiro','equipe','catalogo','combos','lembretes']::text[],
    onboarding_completed = true,
    updated_at = now()
where id = '22cd442f-5b82-46e8-acb4-b9646fb0bd07'::uuid
  and lower(name) = lower('Carbonacar');
