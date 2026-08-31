-- Teste transacional administrativo; não envia mensagens, não mantém fixtures.
begin;
do $test$
declare
  cid uuid; sid uuid; manager_id uuid:=gen_random_uuid(); worker_id uuid:=gen_random_uuid();
  ms uuid:=gen_random_uuid(); ws uuid:=gen_random_uuid(); aid uuid:=gen_random_uuid(); eid bigint; correction uuid;
  result jsonb;
begin
  select s.company_id,s.id into cid,sid from public.staff s join public.companies c on c.id=s.company_id and c.active
    where not exists(select 1 from private.clock_accounts a where a.staff_id=s.id) order by s.id limit 1;
  if sid is null then raise exception 'Nenhum cadastro livre para fixture; teste não executado.'; end if;
  insert into auth.users(id,email,email_confirmed_at,aud,role) values
    (manager_id,manager_id::text||'@clock-month-test.invalid',now(),'authenticated','authenticated'),
    (worker_id,worker_id::text||'@clock-month-test.invalid',now(),'authenticated','authenticated');
  insert into auth.sessions(id,user_id,created_at,updated_at) values(ms,manager_id,now(),now()),(ws,worker_id,now(),now());
  insert into public.company_members(company_id,user_id,role,active) values(cid,manager_id,'manager',true);
  insert into private.clock_accounts(id,company_id,staff_id,user_id,created_by) values(aid,cid,sid,worker_id,manager_id);
  insert into private.clock_events(account_id,actor_id,kind,recorded_at,request_id) values
    (aid,worker_id,'entry','2026-08-01 08:03:00-03',gen_random_uuid()) returning id into eid;
  insert into private.clock_events(account_id,actor_id,kind,recorded_at,request_id) values
    (aid,worker_id,'exit','2026-08-01 18:40:00-03',gen_random_uuid());
  insert into private.clock_decisions(event_id,reviewer_id,decision,reason) values(eid,manager_id,'approved','teste validado');
  insert into private.clock_corrections(event_id,actor_id,proposed_at,reason) values(eid,worker_id,'2026-08-01 08:00:00-03','teste ajuste') returning id into correction;
  insert into private.clock_decisions(correction_id,reviewer_id,decision,reason) values(correction,manager_id,'approved','teste aprovado');
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'session_id',ms,'role','authenticated')::text,true);
  result:=public.clock_month(cid,sid,'2026-08-01');
  if jsonb_array_length(result->'events')<>2 then raise exception 'Quantidade incorreta'; end if;
  if (result->'events'->0->>'effective_at')::timestamptz<>'2026-08-01 08:00:00-03'::timestamptz
    or (result->'events'->0->>'recorded_at')::timestamptz<>'2026-08-01 08:03:00-03'::timestamptz
    or result->'events'->0->>'review_status'<>'approved' then raise exception 'Ajuste/original inválido'; end if;
  begin perform public.clock_month(gen_random_uuid(),sid,'2026-08-01');raise exception 'Empresa inválida aceita' using errcode='XX000'; exception when insufficient_privilege then null;end;
  begin perform public.clock_month(cid,gen_random_uuid(),'2026-08-01');raise exception 'Pessoa fora da empresa aceita' using errcode='XX000'; exception when insufficient_privilege then null;end;
  begin perform public.clock_month(cid,sid,'2026-08-02');raise exception 'Mês inválido aceito' using errcode='XX000'; exception when invalid_parameter_value then null;end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',worker_id,'session_id',ws,'role','authenticated')::text,true);
  begin perform public.clock_month(cid,sid,'2026-08-01');raise exception 'Funcionário acessou relatório gerencial' using errcode='XX000'; exception when insufficient_privilege then null;end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'session_id',gen_random_uuid(),'role','authenticated')::text,true);
  begin perform public.clock_month(cid,sid,'2026-08-01');raise exception 'Sessão inválida aceita' using errcode='XX000'; exception when insufficient_privilege then null;end;
  perform set_config('request.jwt.claims','{}',true);
  begin perform public.clock_month(cid,sid,'2026-08-01');raise exception 'Sem identidade aceito' using errcode='XX000'; exception when insufficient_privilege then null;end;
  execute 'reset role';
  if has_function_privilege('anon','public.clock_month(uuid,uuid,date)','execute') then raise exception 'Anon com execute'; end if;
end $test$;
select 'PASS: relatório mensal, ajuste aprovado, original preservado, gestão, empresa, colaborador, mês, sessão e anônimo.' as result;
rollback;
