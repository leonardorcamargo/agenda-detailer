-- Integração SQL: executar somente como administrador do banco. Tudo em rollback.
-- Não envia e-mails nem usa senhas/tokens de usuários reais.
begin;
do $test$
declare
  cid uuid := '22cd442f-5b82-46e8-acb4-b9646fb0bd07';
  sid uuid := 'c086c757-7772-440f-bc75-5e1d5ae94e82';
  sid2 uuid := '62ca4378-0c90-45f5-8c0c-a717f8380725';
  manager_id uuid := gen_random_uuid(); worker_id uuid := gen_random_uuid(); stranger_id uuid := gen_random_uuid();
  manager_session uuid := gen_random_uuid(); worker_session uuid := gen_random_uuid(); stranger_session uuid := gen_random_uuid();
  manager_mail text := gen_random_uuid()::text||'@clock-test.invalid';
  worker_mail text := gen_random_uuid()::text||'@clock-test.invalid';
  stranger_mail text := gen_random_uuid()::text||'@clock-test.invalid';
  result jsonb; first_event jsonb; second_event jsonb; code text; replaced_code text;
  account_id uuid; manager_account uuid; correction_id uuid; req uuid := gen_random_uuid();
  original_time timestamptz; proposed_time timestamptz;
begin
  if exists(select 1 from private.clock_accounts where staff_id in (sid,sid2)) then raise exception 'Fixture já vinculada; escolha cadastros de teste livres.'; end if;
  insert into auth.users(id,email,email_confirmed_at,aud,role) values
    (manager_id,manager_mail,clock_timestamp(),'authenticated','authenticated'),
    (worker_id,worker_mail,clock_timestamp(),'authenticated','authenticated'),
    (stranger_id,stranger_mail,clock_timestamp(),'authenticated','authenticated');
  insert into auth.sessions(id,user_id,created_at,updated_at) values
    (manager_session,manager_id,clock_timestamp(),clock_timestamp()),
    (worker_session,worker_id,clock_timestamp(),clock_timestamp()),
    (stranger_session,stranger_id,clock_timestamp(),clock_timestamp());
  insert into public.company_members(company_id,user_id,role,active) values(cid,manager_id,'owner',true);
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims','{}',true);
  begin
    perform public.employee_clock('snapshot','{}');
    raise exception 'Anônimo aceito' using errcode='XX000';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'session_id',manager_session,'role','authenticated')::text,true);
  result := public.employee_clock('invite',jsonb_build_object('staff_id',sid,'email',worker_mail));
  replaced_code := result->>'code';
  result := public.employee_clock('invite',jsonb_build_object('staff_id',sid,'email',upper(worker_mail)));
  code := result->>'code';
  if length(code)<>64 or code=replaced_code then raise exception 'Convite sem entropia/rotação'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',stranger_id,'session_id',stranger_session,'role','authenticated')::text,true);
  begin
    perform public.employee_clock('activate',jsonb_build_object('code',code));
    raise exception 'E-mail incorreto aceito' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.employee_clock('invite',jsonb_build_object('staff_id',sid,'email',stranger_mail));
    raise exception 'Não administrador gerou convite' using errcode='XX000';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',worker_id,'session_id',worker_session,'role','authenticated')::text,true);
  begin
    perform public.employee_clock('activate',jsonb_build_object('code',replaced_code));
    raise exception 'Código substituído aceito' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  perform public.employee_clock('activate',jsonb_build_object('code',code));
  begin
    perform public.employee_clock('activate',jsonb_build_object('code',code));
    raise exception 'Código reutilizado' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  result := public.employee_clock('snapshot',jsonb_build_object('company_id',cid));
  if jsonb_array_length(result->'accounts')<>1 or (result->>'manager')::boolean then raise exception 'Escopo do funcionário incorreto'; end if;
  account_id := (result->'accounts'->0->>'id')::uuid;
  if exists(select 1 from public.company_members where user_id=worker_id) then raise exception 'Ativação concedeu acesso a outros módulos'; end if;
  if exists(select 1 from public.staff where company_id=cid) then raise exception 'Acesso do ponto vazou equipe/valores'; end if;

  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','exit','request_id',gen_random_uuid()));
    raise exception 'Saída sem entrada aceita' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',req,'recorded_at','2000-01-01'));
    raise exception 'Horário do cliente aceito' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  first_event := public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',req));
  original_time := (first_event->>'recorded_at')::timestamptz;
  if abs(extract(epoch from clock_timestamp()-original_time))>5 then raise exception 'Horário não veio do servidor'; end if;
  result := public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',req));
  if result->>'id'<>first_event->>'id' or result->>'recorded_at'<>first_event->>'recorded_at' then raise exception 'Retry duplicou/altera horário'; end if;
  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',gen_random_uuid()));
    raise exception 'Envio concorrente obsoleto aceito' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','exit','request_id',gen_random_uuid(),'previous_id',first_event->>'id'));
    raise exception 'Duplo clique não bloqueado' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;

  begin
    update private.clock_events set recorded_at='2000-01-01' where id=(first_event->>'id')::bigint;
    raise exception 'Edição direta aceita' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  begin
    delete from private.clock_events where id=(first_event->>'id')::bigint;
    raise exception 'Exclusão direta aceita' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  begin
    perform public.employee_clock('review',jsonb_build_object('event_id',first_event->>'id','decision','approved','reason','Autoaprovação'));
    raise exception 'Autoaprovação aceita' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  perform pg_sleep(2.1);
  second_event := public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','exit','request_id',gen_random_uuid(),'previous_id',first_event->>'id'));
  proposed_time := original_time-interval '1 minute';
  perform public.employee_clock('correction',jsonb_build_object('event_id',first_event->>'id','proposed_at',proposed_time,'reason','Esqueci de registrar na chegada'));
  result := public.employee_clock('snapshot',jsonb_build_object('company_id',cid));
  correction_id := (result->'corrections'->0->>'id')::uuid;
  begin
    perform public.employee_clock('correction',jsonb_build_object('event_id',second_event->>'id','proposed_at',clock_timestamp()+interval '1 day','reason','Horário futuro'));
    raise exception 'Correção futura aceita' using errcode='XX000';
  exception when sqlstate 'P0001' then null; end;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',stranger_id,'session_id',stranger_session,'role','authenticated')::text,true);
  result := public.employee_clock('snapshot',jsonb_build_object('company_id',cid));
  if jsonb_array_length(result->'events')<>0 or jsonb_array_length(result->'accounts')<>0 or jsonb_array_length(result->'recent')<>0 then raise exception 'Leitura de outro usuário'; end if;
  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',gen_random_uuid(),'previous_id',second_event->>'id'));
    raise exception 'Ponto em nome de outra pessoa' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  begin
    perform public.employee_clock('review_correction',jsonb_build_object('correction_id',correction_id,'decision','approved','reason','Tentativa externa'));
    raise exception 'Correção validada por estranho' using errcode='XX000';
  exception when insufficient_privilege then null; end;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',manager_id,'session_id',manager_session,'role','authenticated')::text,true);
  perform public.employee_clock('review_correction',jsonb_build_object('correction_id',correction_id,'decision','approved','reason','Chegada conferida pela gestão'));
  perform public.employee_clock('review_batch',jsonb_build_object('event_ids',jsonb_build_array(first_event->>'id',second_event->>'id')));
  result := public.employee_clock('snapshot',jsonb_build_object('company_id',cid));
  if not exists(select 1 from jsonb_array_elements(result->'events') e where e->>'id'=first_event->>'id'
    and (e->>'recorded_at')::timestamptz=original_time and (e->>'effective_at')::timestamptz=proposed_time
    and e->'decision'->>'reviewer_id'=manager_id::text) then raise exception 'Original/auditoria não preservados'; end if;
  if jsonb_array_length(result->'recent')<2 then raise exception 'Feed de alertas incompleto'; end if;

  result := public.employee_clock('invite',jsonb_build_object('staff_id',sid2,'email',manager_mail));
  perform public.employee_clock('activate',jsonb_build_object('code',result->>'code'));
  result := public.employee_clock('snapshot',jsonb_build_object('company_id',cid));
  select (a->>'id')::uuid into manager_account from jsonb_array_elements(result->'accounts') a where (a->>'own')::boolean;
  result := public.employee_clock('record',jsonb_build_object('account_id',manager_account,'kind','entry','request_id',gen_random_uuid()));
  begin
    perform public.employee_clock('review',jsonb_build_object('event_id',result->>'id','decision','approved','reason','Mesmo proprietário não pode'));
    raise exception 'Proprietário aprovou ponto próprio' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  perform public.employee_clock('access',jsonb_build_object('account_id',account_id,'active',false));

  perform set_config('request.jwt.claims',jsonb_build_object('sub',worker_id,'session_id',worker_session,'role','authenticated')::text,true);
  begin
    perform public.employee_clock('record',jsonb_build_object('account_id',account_id,'kind','entry','request_id',gen_random_uuid(),'previous_id',second_event->>'id'));
    raise exception 'Acesso suspenso registrou ponto' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',worker_id,'session_id',gen_random_uuid(),'role','authenticated')::text,true);
  begin
    perform public.employee_clock('snapshot','{}');
    raise exception 'Sessão inexistente aceita' using errcode='XX000';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end $test$;
select 'PASS: convite, identidade, isolamento, sessão, sequência, tempo do servidor, idempotência, bloqueio de escrita direta, revisão, correção auditável, lote, feed, suspensão e autoaprovação.' as result;
rollback;
