-- Registro da migração remota staff_attendance_integrity. Não executar novamente.
alter table public.staff add constraint staff_company_id_id_unique unique (company_id,id);
alter table public.staff_work_logs add constraint staff_work_logs_company_staff_fk foreign key (company_id,staff_id) references public.staff(company_id,id) on delete restrict;
alter table public.staff_work_logs drop constraint staff_work_logs_staff_id_fkey;
alter table public.staff_work_logs add constraint staff_work_logs_amount_valid check (daily_rate_charged is null or (daily_rate_charged >= 0 and daily_rate_charged <> 'NaN'::numeric and daily_rate_charged <> 'Infinity'::numeric));
alter table public.staff_work_logs add constraint staff_work_logs_absence_zero check (status not in ('Falta','Folga') or coalesce(daily_rate_charged,0)=0);
drop policy staff_work_logs_insert_member on public.staff_work_logs;
create policy staff_work_logs_insert_manager on public.staff_work_logs for insert to authenticated with check (private.is_company_manager(company_id));
