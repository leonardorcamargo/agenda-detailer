-- Espelho da migração remota clock_month_readonly (MCP; CLI não disponível).
-- Somente leitura: não muda tabelas, marcações ou regras de validação.
create function private.clock_month(p_company_id uuid, p_staff_id uuid, p_month date)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
  actor uuid := auth.uid(); aid uuid; start_at timestamptz; end_at timestamptz;
  result jsonb;
begin
  if actor is null or not exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=actor
      and (s.not_after is null or s.not_after>clock_timestamp())
      and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<clock_timestamp())
  ) then raise exception 'Sessão válida e e-mail confirmado necessários.' using errcode='42501'; end if;
  if not exists(select 1 from public.company_members m join public.companies c on c.id=m.company_id
    where m.company_id=p_company_id and m.user_id=actor and m.active and c.active
      and m.role in ('owner','admin','manager'))
  then raise exception 'Acesso permitido somente à gestão da empresa.' using errcode='42501'; end if;
  if not exists(select 1 from public.staff s where s.id=p_staff_id and s.company_id=p_company_id)
  then raise exception 'Colaborador não disponível nesta empresa.' using errcode='42501'; end if;
  if p_month is null or extract(day from p_month)<>1 or p_month<date '2000-01-01' or p_month>date '2100-12-01'
  then raise exception 'Selecione um mês válido.' using errcode='22023'; end if;
  select a.id into aid from private.clock_accounts a where a.staff_id=p_staff_id and a.company_id=p_company_id;
  -- Margem para ajustes retroativos (7 dias) e virada de dia/mês. Jornadas >24h
  -- são exibidas para conferência e não entram no total automático.
  start_at := (p_month-8)::timestamp at time zone 'America/Sao_Paulo';
  end_at := ((p_month+interval '1 month')::date+8)::timestamp at time zone 'America/Sao_Paulo';
  select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) into result from (
    select e.id,e.account_id,e.kind,e.recorded_at,
      coalesce(adj.proposed_at,e.recorded_at) as effective_at,
      d.decision as review_status,
      exists(select 1 from private.clock_corrections x where x.event_id=e.id
        and not exists(select 1 from private.clock_decisions cd where cd.correction_id=x.id)) as pending_correction
    from private.clock_events e
    left join private.clock_decisions d on d.event_id=e.id
    left join lateral (
      select x.proposed_at from private.clock_corrections x join private.clock_decisions cd on cd.correction_id=x.id
      where x.event_id=e.id and cd.decision='approved' order by cd.created_at desc,cd.id desc limit 1
    ) adj on true
    where e.account_id=aid and e.recorded_at>=start_at and e.recorded_at<end_at
    order by e.id limit 10001
  ) t;
  if jsonb_array_length(result)>10000 then raise exception 'Volume acima do limite da folha. Consulte a gestão; nenhum total parcial será exibido.'; end if;
  return jsonb_build_object('account_id',aid,'events',result,'server_now',clock_timestamp());
end $fn$;
revoke all on function private.clock_month(uuid,uuid,date) from public,anon;
grant execute on function private.clock_month(uuid,uuid,date) to authenticated;
create function public.clock_month(p_company_id uuid,p_staff_id uuid,p_month date)
returns jsonb language sql security invoker set search_path='' as $fn$
  select private.clock_month(p_company_id,p_staff_id,p_month);
$fn$;
revoke all on function public.clock_month(uuid,uuid,date) from public,anon;
grant execute on function public.clock_month(uuid,uuid,date) to authenticated;
