-- Additive fee settings and payment snapshots. Never assign guessed rates to history.
create table public.payment_processors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 100),
  active boolean not null default true,
  unique (company_id,id)
);
create table public.payment_processor_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  processor_id uuid not null,
  payment_method text not null check (payment_method in ('Cartão de Débito','Cartão de Crédito','Crédito Parcelado','Pix')),
  installments integer not null,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  fixed_fee numeric(12,2) not null default 0 check (fixed_fee >= 0),
  foreign key (company_id,processor_id) references public.payment_processors(company_id,id),
  unique (company_id,processor_id,payment_method,installments),
  check ((payment_method = 'Crédito Parcelado' and installments between 2 and 24)
    or (payment_method <> 'Crédito Parcelado' and installments = 1))
);
alter table public.payment_processors enable row level security;
alter table public.payment_processor_rates enable row level security;
revoke all on public.payment_processors,public.payment_processor_rates from anon,authenticated;
grant select,insert,update on public.payment_processors,public.payment_processor_rates to authenticated;
create policy payment_processors_select on public.payment_processors for select to authenticated using (private.is_company_member(company_id));
create policy payment_processors_insert on public.payment_processors for insert to authenticated with check (private.is_company_manager(company_id));
create policy payment_processors_update on public.payment_processors for update to authenticated using (private.is_company_manager(company_id)) with check (private.is_company_manager(company_id));
create policy payment_processor_rates_select on public.payment_processor_rates for select to authenticated using (private.is_company_member(company_id));
create policy payment_processor_rates_insert on public.payment_processor_rates for insert to authenticated with check (private.is_company_manager(company_id));
create policy payment_processor_rates_update on public.payment_processor_rates for update to authenticated using (private.is_company_manager(company_id)) with check (private.is_company_manager(company_id));

alter table public.payments drop constraint payments_payment_method_check;
alter table public.payments add constraint payments_payment_method_check check (payment_method in
 ('Cartão de Crédito','Cartão de Débito','Crédito Parcelado','Boleto Parcelado','Pix','Dinheiro','Fiado','Pendente'));
alter table public.payments
 add column processor_id uuid,
 add column processor_name text,
 add column installments integer check (installments between 1 and 24),
 add column fee_percentage numeric(5,2) check (fee_percentage between 0 and 100),
 add column fee_fixed numeric(12,2) check (fee_fixed >= 0),
 add column fee_amount numeric(12,2),
 add column net_amount numeric(12,2) generated always as (amount - fee_amount) stored,
 add column fee_basis text check (fee_basis in ('configured','statement','cash')),
 add column settlement_confirmed boolean not null default false,
 add column settled_at date,
 add constraint payments_processor_company_fkey foreign key (company_id,processor_id) references public.payment_processors(company_id,id),
 add constraint payments_fee_bounds check (fee_amount is null or (fee_amount >= 0 and fee_amount <= amount)),
 add constraint payments_fee_completeness check ((fee_amount is null and fee_basis is null) or (fee_amount is not null and fee_basis is not null)),
 add constraint payments_settlement_check check (
   (not settlement_confirmed and settled_at is null)
   or (settlement_confirmed and settled_at is not null and fee_amount is not null)
 );
create index payments_processor_company_idx on public.payments(company_id,processor_id);

-- Source triggers may change gross/method later: invalidate the old fee instead of keeping a false net.
create function public.invalidate_payment_fee() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op = 'UPDATE' then
   if new.amount is distinct from old.amount or new.payment_method is distinct from old.payment_method
      or new.company_id is distinct from old.company_id then
     new.processor_id := null; new.processor_name := null; new.installments := null;
     new.fee_percentage := null; new.fee_fixed := null; new.fee_amount := null;
     new.fee_basis := null; new.settlement_confirmed := false; new.settled_at := null;
   end if;
 end if;
 return new;
end; $$;
revoke all on function public.invalidate_payment_fee() from public,anon,authenticated;
create trigger invalidate_payment_fee before update on public.payments for each row execute function public.invalidate_payment_fee();

-- One atomic operation; uses caller's permissions and RLS, with no privileged bypass.
create function public.apply_payment_fee(
 p_payment_id uuid, p_expected_amount numeric, p_expected_method text,
 p_processor_id uuid default null, p_installments integer default 1,
 p_actual_net numeric default null, p_settled_at date default null
) returns public.payments language plpgsql security invoker set search_path='' as $$
declare
 payment public.payments;
 processor public.payment_processors;
 rate public.payment_processor_rates;
 fee numeric(12,2);
 basis text;
begin
 select * into payment from public.payments where id=p_payment_id for update;
 if not found or not private.is_company_manager(payment.company_id) then
   raise exception 'Pagamento não encontrado ou sem permissão.' using errcode='42501';
 end if;
 if p_expected_amount is null or p_expected_method is null or payment.status <> 'Pago' or payment.amount <> p_expected_amount or payment.payment_method <> p_expected_method then
   raise exception 'O pagamento mudou. Atualize a lista antes de conferir.' using errcode='40001';
 end if;
 if p_installments is null or (payment.payment_method in ('Crédito Parcelado','Boleto Parcelado') and p_installments not between 2 and 24)
    or (payment.payment_method not in ('Crédito Parcelado','Boleto Parcelado') and p_installments <> 1) then
   raise exception 'Quantidade de parcelas inválida.' using errcode='22023';
 end if;
 if p_processor_id is not null then
   select * into processor from public.payment_processors where id=p_processor_id and company_id=payment.company_id and active;
   if not found then raise exception 'Maquininha não encontrada ou inativa.' using errcode='22023'; end if;
 end if;
 if p_actual_net is not null then
   if p_actual_net < 0 or p_actual_net > payment.amount or p_actual_net <> round(p_actual_net,2)
      or p_settled_at is null or p_settled_at > (now() at time zone 'America/Sao_Paulo')::date then
     raise exception 'Informe o líquido integral creditado e uma data de recebimento válida.' using errcode='22023';
   end if;
   fee := payment.amount-p_actual_net; basis := 'statement';
 else
   if p_settled_at is not null then raise exception 'Confirme o valor do extrato para informar a data de crédito.' using errcode='22023'; end if;
   if payment.payment_method = 'Dinheiro' then
     fee := 0; basis := 'cash';
   else
     select * into rate from public.payment_processor_rates
       where company_id=payment.company_id and processor_id=processor.id
         and payment_method=payment.payment_method and installments=p_installments;
     if not found then raise exception 'Cadastre a taxa desta modalidade e quantidade de parcelas.' using errcode='22023'; end if;
     fee := round(payment.amount * rate.percentage / 100 + rate.fixed_fee,2); basis := 'configured';
   end if;
 end if;
 if fee < 0 or fee > payment.amount then raise exception 'A taxa supera o valor do pagamento.' using errcode='22023'; end if;
 update public.payments set processor_id=processor.id,processor_name=processor.name,installments=p_installments,
   fee_percentage=case when basis='configured' then rate.percentage when basis='cash' then 0 else null end,
   fee_fixed=case when basis='configured' then rate.fixed_fee when basis='cash' then 0 else null end,
   fee_amount=fee,fee_basis=basis,settlement_confirmed=(p_actual_net is not null),settled_at=p_settled_at
 where id=payment.id returning * into payment;
 return payment;
end; $$;
revoke all on function public.apply_payment_fee(uuid,numeric,text,uuid,integer,numeric,date) from public,anon;
grant execute on function public.apply_payment_fee(uuid,numeric,text,uuid,integer,numeric,date) to authenticated;
