# Ponto individual auditável

## Instalação e uso

Migrações, nesta ordem: `employee-clock.sql`, `employee-clock-hardening.sql`.
Ambas já aplicadas no projeto atual; não reaplicar o SQL de criação.

1. Owner/admin abre **Ponto da equipe → Liberar acesso de funcionário** e escolhe o cadastro e o e-mail confirmado com a pessoa.
2. Entrega o código pessoal por canal confiável. Uso único, validade de 24 horas; outro código invalida o anterior.
3. Funcionário cria sua conta, confirma o e-mail, entra e ativa o código. Não compartilhar senhas. A ativação não cria vínculo em company_members nem concede acesso aos outros módulos.
4. Funcionário registra entrada, intervalo, retorno e saída. Só considerar salvo após confirmação do servidor.
5. Gestão valida/contesta registros ou decide pedidos de ajuste. A marcação original nunca é sobrescrita. Nenhum usuário pode validar o próprio ponto.

## Segurança e limites

- Horário e identidade vêm do servidor/sessão autenticada. Verificação de sessão ativa, e-mail confirmado, vínculo, empresa e papel ocorre no banco.
- Tabelas privadas sem acesso direto, RLS default-deny; a RPC aplica autorização e isolamento. O aviso informativo `rls_enabled_no_policy` nessas tabelas é intencional, não corrigir com políticas permissivas.
- Sequência, bloqueio concorrente, idempotência e limites de frequência reduzem duplicações e abuso. Correções preservam original, justificativa, autor e decisão.
- Não prova presença física e não impede compartilhamento voluntário de credenciais. Não é apresentado como sistema certificado de ponto legal.
- Sem marcação offline; sem GPS, biometria ou fotografia. Sem cálculo de folha ou alteração automática das presenças/ocorrências manuais existentes.
- Popup da gestão consulta novidades a cada 5 segundos enquanto o app estiver visível e conectado. Não é push com app fechado. Feed limitado aos 50 registros recentes; histórico limitado a 201 por data, com aviso na tela.
- Horários exibidos em São Paulo. Ajuste solicitado até 7 dias antes da marcação, sujeito à aprovação e ordem cronológica.

## Verificação

Passaram TypeScript, build, os oito arquivos de testes TS e `employeeClock.security.sql` (transação revertida, sem manter contas ou marcações de teste).
Teste SQL cobre identidade, isolamento, sessão, sequência, tempo do servidor, idempotência, bloqueio de escrita direta, revisão, correção, lote, feed, suspensão e autoaprovação.

Ainda validar em uso real: entrega do e-mail de confirmação, ativação em duas contas/dispositivos, popup entre dispositivos e usabilidade no iPhone. Prévia visual não disponível nesta execução.

Avisos preexistentes do projeto: proteção de senhas vazadas desabilitada e outras funções públicas security-definer executáveis por anon/authenticated. Não foram alterados nesta entrega; revisar antes do lançamento. Esta implementação não constitui auditoria integral do aplicativo.
