-- Endurecimento aplicado após employee_clock_audit. Sem alterações de dados.
alter table private.clock_accounts add constraint clock_account_company_staff_fk foreign key(company_id,staff_id) references public.staff(company_id,id) on delete restrict;
alter table private.clock_invites add constraint clock_invite_company_staff_fk foreign key(company_id,staff_id) references public.staff(company_id,id) on delete restrict;
create or replace function private.employee_clock(p_action text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $clock$
declare
  actor uuid := auth.uid(); session_uid uuid;
  c uuid; aid uuid; sid uuid; code text; mail text; k text; req uuid;
  acc private.clock_accounts%rowtype; ev private.clock_events%rowtype; prior private.clock_events%rowtype;
  invite private.clock_invites%rowtype; correction private.clock_corrections%rowtype;
  is_manager boolean; day date; result jsonb; ids uuid[]; event_ids bigint[];
  decision text; reason text; proposed timestamptz; lower_time timestamptz; upper_time timestamptz;
  now_at timestamptz := clock_timestamp(); count_rows integer; target bigint;
begin
  if actor is null then raise exception 'Sessão necessária.' using errcode='42501'; end if;
  session_uid := nullif(auth.jwt()->>'session_id','')::uuid;
  if not exists(select 1 from auth.sessions s where s.id=session_uid and s.user_id=actor and (s.not_after is null or s.not_after>now_at))
     or not exists(select 1 from auth.users u where u.id=actor and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now_at))
  then raise exception 'Entre novamente com seu e-mail confirmado.' using errcode='42501'; end if;

  if p_action='invite' then
    sid := (p_data->>'staff_id')::uuid;
    select s.company_id into c from public.staff s join public.companies co on co.id=s.company_id and co.active
      where s.id=sid and s.active and s.status='Ativo' for update of s;
    if c is null or not private.is_company_admin(c) then raise exception 'Somente administradores podem liberar acesso.' using errcode='42501'; end if;
    if exists(select 1 from private.clock_accounts a where a.staff_id=sid) then raise exception 'Pessoa já vinculada. Use suspender/reativar; não troque a identidade.'; end if;
    mail := lower(trim(p_data->>'email'));
    if mail is null or mail not like '%_@_%._%' or char_length(mail)>254 then raise exception 'E-mail inválido.'; end if;
    code := encode(extensions.gen_random_bytes(32),'hex');
    insert into private.clock_invites(staff_id,company_id,email,token_hash,expires_at,created_by)
      values(sid,c,mail,encode(extensions.digest(code,'sha256'),'hex'),now_at+interval '24 hours',actor)
      on conflict(staff_id) do update set email=excluded.email,token_hash=excluded.token_hash,
        expires_at=excluded.expires_at,created_by=actor,created_at=now_at;
    return jsonb_build_object('code',code,'expires_at',now_at+interval '24 hours');
  elsif p_action='activate' then
    code := trim(p_data->>'code');
    if code is null or char_length(code)<>64 then raise exception 'Código inválido ou expirado.'; end if;
    select * into invite from private.clock_invites i where i.token_hash=encode(extensions.digest(code,'sha256'),'hex') for update;
    select lower(u.email) into mail from auth.users u where u.id=actor;
    if invite.staff_id is null or invite.expires_at<=now_at or invite.email is distinct from mail
      or not exists(select 1 from public.companies co where co.id=invite.company_id and co.active)
      or not exists(select 1 from public.company_members m where m.company_id=invite.company_id and m.user_id=invite.created_by and m.active and m.role in ('owner','admin'))
    then raise exception 'Código inválido ou expirado.'; end if;
    if not exists(select 1 from public.staff s where s.id=invite.staff_id and s.company_id=invite.company_id and s.active and s.status='Ativo')
    then raise exception 'Cadastro indisponível.'; end if;
    insert into private.clock_accounts(company_id,staff_id,user_id,created_by) values(invite.company_id,invite.staff_id,actor,invite.created_by);
    delete from private.clock_invites where staff_id=invite.staff_id;
    return jsonb_build_object('ok',true);
  elsif p_action='access' then
    select * into acc from private.clock_accounts where id=(p_data->>'account_id')::uuid for update;
    if acc.id is null or not private.is_company_admin(acc.company_id) then raise exception 'Acesso negado.' using errcode='42501'; end if;
    if jsonb_typeof(p_data->'active')<>'boolean' or p_data->'active' is null then raise exception 'Situação inválida.'; end if;
    update private.clock_accounts set active=(p_data->>'active')::boolean where id=acc.id;
    insert into private.clock_access_audit(account_id,actor_id,active) values(acc.id,actor,(p_data->>'active')::boolean);
    return jsonb_build_object('ok',true);
  elsif p_action='record' then
    aid := (p_data->>'account_id')::uuid; k := p_data->>'kind'; req := (p_data->>'request_id')::uuid;
    if req is null or k is null or k not in ('entry','break_start','break_end','exit')
      or p_data ?| array['recorded_at','timestamp','actor_id','user_id'] then raise exception 'Registro inválido.'; end if;
    select * into acc from private.clock_accounts where id=aid and user_id=actor for update;
    if acc.id is null or not acc.active
      or not exists(select 1 from public.staff s join public.companies co on co.id=s.company_id and co.active
        where s.id=acc.staff_id and s.company_id=acc.company_id and s.active and s.status='Ativo')
    then raise exception 'Acesso ao ponto indisponível.' using errcode='42501'; end if;
    select * into ev from private.clock_events where actor_id=actor and request_id=req;
    if ev.id is not null then
      if ev.account_id<>aid or ev.kind<>k then raise exception 'Solicitação já utilizada.'; end if;
      return to_jsonb(ev);
    end if;
    select * into prior from private.clock_events where account_id=aid order by id desc limit 1;
    if prior.id is distinct from nullif(p_data->>'previous_id','')::bigint then raise exception 'O ponto mudou. Atualize antes de registrar.'; end if;
    if not coalesce(((coalesce(prior.kind,'exit')='exit' and k='entry')
      or (prior.kind in ('entry','break_end') and k in ('break_start','exit'))
      or (prior.kind='break_start' and k in ('break_end','exit'))),false) then raise exception 'Sequência de ponto inválida.'; end if;
    now_at := clock_timestamp();
    if prior.id is not null and now_at<prior.recorded_at+interval '2 seconds' then raise exception 'Aguarde alguns segundos antes do próximo registro.'; end if;
    if (select count(*) from private.clock_events e where e.account_id=aid and e.recorded_at>now_at-interval '24 hours')>=100 then raise exception 'Limite de registros atingido. Procure a gestão.'; end if;
    insert into private.clock_events(account_id,actor_id,kind,recorded_at,request_id) values(aid,actor,k,now_at,req) returning * into ev;
    return to_jsonb(ev);
  elsif p_action='correction' then
    select * into ev from private.clock_events where id=(p_data->>'event_id')::bigint and actor_id=actor for update;
    if ev.id is null or not exists(select 1 from private.clock_accounts a join public.staff s on s.id=a.staff_id
      join public.companies co on co.id=a.company_id where a.id=ev.account_id and a.active and s.active and co.active)
    then raise exception 'Acesso negado.' using errcode='42501'; end if;
    reason := trim(p_data->>'reason'); proposed := (p_data->>'proposed_at')::timestamptz;
    if reason is null or char_length(reason) not between 3 and 500 or proposed is null or proposed>now_at or proposed<ev.recorded_at-interval '7 days'
    then raise exception 'Informe motivo e horário válido (até 7 dias antes do registro, nunca futuro).'; end if;
    if exists(select 1 from private.clock_corrections x where x.event_id=ev.id and not exists(select 1 from private.clock_decisions d where d.correction_id=x.id))
    then raise exception 'Já existe solicitação pendente para este registro.'; end if;
    if (select count(*) from private.clock_corrections x where x.actor_id=actor and x.created_at>now_at-interval '1 day')>=10 then raise exception 'Limite diário de solicitações atingido.'; end if;
    insert into private.clock_corrections(event_id,actor_id,proposed_at,reason) values(ev.id,actor,proposed,reason);
    return jsonb_build_object('ok',true);
  elsif p_action='review_batch' then
    select array_agg(distinct value::bigint order by value::bigint) into event_ids from jsonb_array_elements_text(p_data->'event_ids');
    if coalesce(cardinality(event_ids),0) not between 1 and 100 then raise exception 'Selecione de 1 a 100 registros.'; end if;
    foreach target in array event_ids loop
      perform private.employee_clock('review',jsonb_build_object('event_id',target,'decision','approved','reason','Conferência em lote pela gestão'));
    end loop;
    return jsonb_build_object('ok',true);
  elsif p_action in ('review','review_correction') then
    reason := trim(p_data->>'reason'); decision := p_data->>'decision';
    if reason is null or char_length(reason) not between 3 and 500 or decision is null or decision not in ('approved','rejected') then raise exception 'Informe decisão e justificativa.'; end if;
    if p_action='review_correction' then
      select * into correction from private.clock_corrections where id=(p_data->>'correction_id')::uuid for update;
      target := correction.event_id;
    else target := (p_data->>'event_id')::bigint; end if;
    select * into ev from private.clock_events where id=target;
    select * into acc from private.clock_accounts where id=ev.account_id for update;
    if ev.id is null or not private.is_company_manager(acc.company_id) or ev.actor_id=actor
    then raise exception 'Gestão da empresa obrigatória; não é permitido validar o próprio ponto.' using errcode='42501'; end if;
    if p_action='review_correction' then
      -- Correções aprovadas são sobrepostas na consulta, sem modificar o original.
      if decision='approved' then
        select coalesce((select x.proposed_at from private.clock_corrections x join private.clock_decisions d on d.correction_id=x.id and d.decision='approved'
          where x.event_id=e.id order by d.created_at desc limit 1),e.recorded_at) into lower_time
          from private.clock_events e where e.account_id=acc.id and e.id<ev.id order by e.id desc limit 1;
        select coalesce((select x.proposed_at from private.clock_corrections x join private.clock_decisions d on d.correction_id=x.id and d.decision='approved'
          where x.event_id=e.id order by d.created_at desc limit 1),e.recorded_at) into upper_time
          from private.clock_events e where e.account_id=acc.id and e.id>ev.id order by e.id limit 1;
        if (lower_time is not null and correction.proposed_at<=lower_time) or (upper_time is not null and correction.proposed_at>=upper_time)
        then raise exception 'Ajuste fora da ordem dos registros. Confira os horários vizinhos.'; end if;
      end if;
      insert into private.clock_decisions(correction_id,reviewer_id,decision,reason) values(correction.id,actor,decision,reason);
    else
      insert into private.clock_decisions(event_id,reviewer_id,decision,reason) values(ev.id,actor,decision,reason);
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='snapshot' then
    c := nullif(p_data->>'company_id','')::uuid;
    is_manager := c is not null and private.is_company_manager(c);
    day := coalesce(nullif(p_data->>'day','')::date,(now_at at time zone 'America/Sao_Paulo')::date);
    select array_agg(a.id) into ids from private.clock_accounts a join public.companies co on co.id=a.company_id and co.active
      where ((is_manager and a.company_id=c) or (a.user_id=actor and (c is null or a.company_id=c)));
    select array_agg(t.id) into event_ids from (select e.id from private.clock_events e where e.account_id=any(coalesce(ids,'{}'))
      and e.recorded_at>=day::timestamp at time zone 'America/Sao_Paulo' and e.recorded_at<(day+1)::timestamp at time zone 'America/Sao_Paulo'
      order by e.id desc limit 201) t;
    select jsonb_build_object(
      'server_now',now_at,'manager',is_manager,'admin',c is not null and private.is_company_admin(c),
      'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'staff_id',a.staff_id,'name',s.name,'company_id',a.company_id,'company_name',co.name,'own',a.user_id=actor,
        'active',a.active and s.active and s.status='Ativo','last_event',(select to_jsonb(e) from private.clock_events e where e.account_id=a.id order by e.id desc limit 1)))
        from private.clock_accounts a join public.staff s on s.id=a.staff_id join public.companies co on co.id=a.company_id where a.id=any(coalesce(ids,'{}'))),'[]'::jsonb),
      'events',coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('name',s.name,'own',e.actor_id=actor,
        'decision',(select to_jsonb(d) from private.clock_decisions d where d.event_id=e.id),
        'effective_at',coalesce((select x.proposed_at from private.clock_corrections x join private.clock_decisions d on d.correction_id=x.id and d.decision='approved'
          where x.event_id=e.id order by d.created_at desc limit 1),e.recorded_at)) order by e.id desc)
        from private.clock_events e join private.clock_accounts a on a.id=e.account_id join public.staff s on s.id=a.staff_id where e.id=any(coalesce(event_ids,'{}'))),'[]'::jsonb),
      'corrections',coalesce((select jsonb_agg(to_jsonb(x)||jsonb_build_object('name',s.name,'own',x.actor_id=actor,
        'original_at',e.recorded_at,'decision',(select to_jsonb(d) from private.clock_decisions d where d.correction_id=x.id)) order by x.created_at desc)
        from private.clock_corrections x join private.clock_events e on e.id=x.event_id join private.clock_accounts a on a.id=e.account_id join public.staff s on s.id=a.staff_id
        where x.event_id=any(coalesce(event_ids,'{}'))),'[]'::jsonb),
      'recent',case when is_manager then coalesce((select jsonb_agg(t) from (select e.id,e.kind,e.recorded_at,s.name from private.clock_events e
        join private.clock_accounts a on a.id=e.account_id join public.staff s on s.id=a.staff_id where a.company_id=c order by e.id desc limit 50) t),'[]'::jsonb) else '[]'::jsonb end
    ) into result;
    return result;
  end if;
  raise exception 'Operação inválida.';
end $clock$;
