-- Executado uma vez com autorização para Carbonacar. Não é seed automático do aplicativo.
-- Não copia contatos/PIX fictícios nem inventa presenças. Nenhuma conta Auth é criada.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"03b05f9a-4010-4406-b4a9-2e673e1dca74","role":"authenticated"}',true);
with seed(name,role,contract_type,daily_rate,commission_rate,commission_type,fixed_commission_value,status,specialties,notes) as (values ('Ricardo (Proprietário)','Master Detailer','Fixo / CLT',0,20,'Porcentagem',0,'Ativo',array['Vitrificação','Polimento Técnico','Desamassamento' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'),
('Marcos Silva','Polidor Especialista','Fixo / CLT',0,15,'Porcentagem',0,'Ativo',array['Polimento Comercial','Restauração de Pintura','Lixamento de Faróis' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'),
('Lucas M.','Higienizador','Fixo / CLT',0,12,'Porcentagem',0,'Ativo',array['Higienização Interna','Extratora a Vácuo','Tratamento de Couro' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'),
('André Carbono','Lavador Técnico','Fixo / CLT',0,10,'Porcentagem',0,'Ativo',array['Lavagem Detalhada','Descontaminação','Lavagem de Motor' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'),
('Fernando (Diarista)','Freelancer / Diarista','Diarista (Diária Fixa)',180,0,'Diária Fixa',0,'Ativo',array['Lavagem Detalhada','Higienização' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'),
('Gabriel Polimentos (Empreita)','Empreiteiro','Empreiteiro / Freelancer (por Serviço)',0,0,'Valor de Empreita por OS',250,'Ativo',array['Polimento Comercial','Vitrificação' ]::text[],'[TESTE AGENDA DETAILER] Cadastro demonstrativo autorizado; substituir antes do lançamento.'))
insert into public.staff(company_id,name,role,contract_type,daily_rate,commission_rate,commission_type,fixed_commission_value,status,specialties,notes)
select '22cd442f-5b82-46e8-acb4-b9646fb0bd07',s.* from seed s
where not exists(select 1 from public.staff t where t.company_id='22cd442f-5b82-46e8-acb4-b9646fb0bd07' and t.name=s.name);
commit;
select id,name,notes from public.staff where company_id='22cd442f-5b82-46e8-acb4-b9646fb0bd07' order by name;
