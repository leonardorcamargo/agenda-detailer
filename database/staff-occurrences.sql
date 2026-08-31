-- Registro da migração remota staff_occurrences_and_work_periods.
-- Executada pelo Supabase MCP; não reaplicar manualmente.
alter table public.staff
  add column work_days smallint[],
  add column work_schedule_from date,
  add constraint staff_work_schedule_valid check (
    (work_days is null and work_schedule_from is null)
    or (work_days is not null and work_schedule_from is not null
      and work_days <@ array[0,1,2,3,4,5,6]::smallint[]
      and array_position(work_days, null) is null
      and cardinality(work_days) <= 7
      and coalesce(array_ndims(work_days), 1) = 1)
  );
alter table public.staff_work_logs
  add column arrival_time time,
  add column departure_time time,
  add column departure_next_day boolean not null default false;
alter table public.staff_work_logs drop constraint staff_work_logs_status_check;
alter table public.staff_work_logs add constraint staff_work_logs_status_check
  check (status in ('Presente','Meio Período','Por horário','Falta','Folga','Atraso','Saída antecipada','Atraso e saída antecipada'));
alter table public.staff_work_logs add constraint staff_work_logs_occurrence_zero
  check (status not in ('Atraso','Saída antecipada','Atraso e saída antecipada') or coalesce(daily_rate_charged,0)=0);
alter table public.staff_work_logs add constraint staff_work_logs_times_valid check (
  (status in ('Atraso','Atraso e saída antecipada','Por horário')) = (arrival_time is not null)
  and (status in ('Saída antecipada','Atraso e saída antecipada','Por horário')) = (departure_time is not null)
  and (arrival_time is null or arrival_time < '24:00'::time)
  and (departure_time is null or departure_time < '24:00'::time)
  and (not departure_next_day or (arrival_time is not null and departure_time is not null))
  and (arrival_time is null or departure_time is null or (
    departure_time - arrival_time + case when departure_next_day then interval '24 hours' else interval '0 hours' end > interval '0 hours'
    and departure_time - arrival_time + case when departure_next_day then interval '24 hours' else interval '0 hours' end <= interval '24 hours'
  ))
);
