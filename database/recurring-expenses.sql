-- Additive schema for reusable monthly expenses. Existing expense rows are unchanged.
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  description text not null check (length(btrim(description)) between 1 and 200),
  category text not null check (category in ('Produtos','Equipamentos','Contas / Fixo','Comissão','Outros')),
  value numeric(12,2) not null check (value > 0),
  due_day integer not null check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, id)
);
alter table public.recurring_expenses enable row level security;
revoke all on public.recurring_expenses from anon, authenticated;
grant select, insert, update on public.recurring_expenses to authenticated;
create policy recurring_expenses_select_member on public.recurring_expenses
  for select to authenticated using (private.is_company_member(company_id));
create policy recurring_expenses_insert_manager on public.recurring_expenses
  for insert to authenticated with check (private.is_company_manager(company_id));
create policy recurring_expenses_update_manager on public.recurring_expenses
  for update to authenticated using (private.is_company_manager(company_id))
  with check (private.is_company_manager(company_id));

alter table public.expenses
  add column recurring_expense_id uuid,
  add column recurrence_month date,
  add constraint expenses_recurring_company_fkey
    foreign key (company_id, recurring_expense_id)
    references public.recurring_expenses(company_id, id),
  add constraint expenses_recurrence_month_check check (
    (recurring_expense_id is null and recurrence_month is null)
    or (recurring_expense_id is not null and recurrence_month is not null
      and extract(day from recurrence_month) = 1
      and expense_date >= recurrence_month
      and expense_date < (recurrence_month + interval '1 month')::date)
  ),
  add constraint expenses_recurring_month_unique unique (company_id, recurring_expense_id, recurrence_month);
-- The two UNIQUE indexes also cover company filtering and the composite foreign key.
