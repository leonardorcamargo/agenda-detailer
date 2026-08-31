# Folha de ponto mensal

Seção em Equipe → Folha de ponto. Selecionar colaborador e mês; Atualizar busca novas marcações e decisões. O botão de validação abre o fluxo existente, sem recriar decisões ou modificar alertas.

`clock_month_readonly` já aplicada pelo MCP no projeto atual. `clock-month.sql` espelha a migração remota; não reaplicar criação. Não havia CLI Supabase disponível neste ambiente.

Consulta limitada ao colaborador da empresa, owner/admin/manager ativo, sessão válida e e-mail confirmado. Funcionário não pode acessar esta RPC gerencial, mesmo para si; seu portal individual anterior permanece. Tabelas privadas não receberam novas permissões. Inativos permanecem consultáveis para preservar histórico.

## Cálculo

- Usa última correção aprovada, mantendo original na consulta e na seção de auditoria.
- Agrupa cada jornada pela data efetiva da entrada (São Paulo). Saída em outro dia leva a data ao lado do horário. Continuação aparece no dia seguinte, mas horas não são duplicadas.
- Desconta todos os intervalos; suporta várias jornadas por dia. Exibe segundos; horas/minutos truncados apenas na apresentação, soma interna em milissegundos.
- Jornadas incompletas, cronologia inválida, duração acima de 24h ou marcação contestada pedem conferência. O dia inteiro é excluído dos totais nesses casos; nenhuma estimativa preenche horários.
- Jornada completa só soma em validadas quando todas as marcações estão aprovadas e não há pedido de correção pendente. Demais completas somam em pendentes. Ajuste aprovado não aprova automaticamente a marcação original.
- Dia vazio não implica falta. Não altera ocorrências/presenças manuais, pagamentos ou folha salarial. Sem cálculo de horas extras ou regras trabalhistas.
- Consulta inclui margem de oito dias em cada lado do mês para jornadas noturnas e ajustes retroativos de até sete dias. Falha explicitamente acima de 10 mil marcações; não exibe relatório truncado.

## Validação e limites

Teste de cálculo inclui o exemplo fornecido (08:03–11:30, 12:27–18:40 = 9h40), calendário, ajustes, pendências, múltiplos intervalos, jornadas noturnas e incompletas.
Teste SQL administrativo em rollback verifica isolamento, papel, sessão, data e original/ajuste. Não deixa usuários, contas ou marcações de teste.
Guardas estáticas de layout não substituem teste real no iPhone; interação visual ainda precisa de validação.

Mantidos avisos preexistentes: [funções públicas privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [funções privilegiadas para autenticados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção de senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). O [INFO de RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) é intencional nas tabelas privadas default-deny. Nenhum novo aviso referente à RPC mensal.

Referência de implementação: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions).
