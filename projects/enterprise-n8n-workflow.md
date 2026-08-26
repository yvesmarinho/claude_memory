---
tags: [project, enterprise-n8n-workflow, n8n, imap, mysql, email]
aliases: [email management system v2]
created: 2026-08-03
updated: 2026-08-03
source: importado de 2 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Vya-Jobs-enterprise-n8n-workflow/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:29 -->

# Enterprise N8N Workflow — Sistema de Gestão de E-mail

Projeto que orquestra um pipeline de gestão de e-mail corporativo via n8n, integrado a dois microsserviços Python (`imap-agent` e `approval-service`) expostos via API HTTP e autenticados por API key. O n8n consome esses serviços por nodes HTTP Request; o processamento inclui sincronização de pastas IMAP, classificação de domínios, aprovação/rejeição de remetentes e movimentação de e-mails, com persistência em MySQL/Postgres. É a reescrita completa (v2) de [[email-auto-manager]], substituindo a versão legada (código Python removido, mantida só documentação histórica).

## Decisões arquiteturais/técnicas duráveis

- Estrutura do repo reorganizada: `src/email_management_system/new` → `src/email_management_system_v2` (versão atual em uso); `src/email_management_system` → `src/email_management_system_legacy` (apenas referência histórica).
- Stack de produção dos serviços Python vive fora do repo, em `/home/yves_marinho/DevOps/docker/imap_services/` (symlinkado como `docker/imap_services` no repo), seguindo o padrão de infraestrutura do DevOps (cada serviço com sua pasta `docker-compose.yaml` + `.env`).
- `imap-agent` (porta 5100) e `approval-service` (porta 5200, via Traefik) rodam em duas redes: `email_net` (MySQL interno) e `app-network` (externa, mesma rede do n8n de produção) — necessário para resolução DNS entre containers.
- O n8n de produção real roda a partir de `/home/yves_marinho/DevOps/docker/n8n/docker-compose.yaml` (symlinkado como `./docker` no repo), com 4 serviços (`n8n_editor`, `n8n_webhook`, `n8n_mcp`, `n8n_worker`) na rede `app-network`.
- Existe também um ambiente n8n de desenvolvimento separado do de produção, com API key própria salva em `.secrets/api.json`.
- Autenticação entre n8n e os microsserviços via credential tipo **Header Auth** (nunca `{{$env...}}`, bloqueado por `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`); nomes reais das credenciais no n8n: `IMAP_AGENT_API_KEY` e `APPROVAL_API_KEY` (a doc `WORKFLOWS.md` usa nomenclatura antiga, desatualizada).
- Send Email nos workflows usa credencial SMTP nativa `smtp-vya` (tipo `smtp`), reaproveitando `N8N_SMTP_*` do `.env` do n8n — não usar credencial `imap` (tipo errado) para envio.
- Variáveis usadas dentro de nodes/expressions do n8n devem virar Credentials (Header Auth, SMTP, Postgres); variáveis de infraestrutura (lidas no boot do processo n8n: `N8N_ENCRYPTION_KEY`, `N8N_BASIC_AUTH_*`, `DB_POSTGRESDB_*`, `QUEUE_BULL_REDIS_*`, `N8N_QUEUE_RABBITMQ_CONNECTION_URL`, `N8N_HOST`, `WEBHOOK_URL`) permanecem em env var.
- Servidor IMAP real usa `INBOX.` como prefixo de pasta e `.` como separador hierárquico (não `/`) — qualquer parâmetro/pasta referenciado em workflows precisa respeitar essa convenção (ex.: `INBOX._Triagem.Pendente`, `INBOX._Quarentena`).
- WF-0 (deploy da infraestrutura Python: mysql, postgres, imap-agent, approval-service, healthcheck) deve ocorrer antes de qualquer ativação de workflow n8n.
- API pública do n8n (`/api/v1/...`) é usada para diagnóstico e para editar workflows via `PUT /api/v1/workflows/{id}` — inclusive criação programática (WF-3, WF-4).

## Convenções/padrões adotados

- Nunca usar `curl` com credenciais na linha de comando; requisições autenticadas sempre via Python (`requests`), lendo `.secrets/*.json`.
- `.secrets/` sempre em `700`/`600`, nunca commitado; qualquer achado com permissão aberta (ex.: `777`) deve ser corrigido para `600`.
- Node **MySQL v2.5** do n8n exige placeholders `$1, $2, $3` no campo Query + expressões separadas no campo Query Parameters (`options.queryReplacement`) — sintaxe `?, ?, ?` não funciona nessa versão.
- Ao editar um node via API do n8n, sempre reconferir com `GET` logo em seguida — `options.queryReplacement` pode ser perdido/resetado num `PUT` subsequente que deveria alterar apenas outro node.
- Antes de ativar um workflow que produz efeitos reais em produção (mover e-mails reais, enviar notificações reais), pedir confirmação explícita — ações de alto impacto exigem confirmação mesmo com aprovação prévia do usuário.
- Ao final de sessões relevantes: gerar `docs/SESSIONS/YYYY-MM-DD/DAILY_ACTIVITIES_*.md`, atualizar `docs/TODO.md`/`docs/INDEX.md`, revisar segredos/IPs antes de commit, nunca commitar direto em `main` (sempre branch + PR).

## Problemas relevantes resolvidos

- DNS `EAI_AGAIN imap-agent`: dois `docker-compose.yaml` distintos coexistiam (stack real do n8n em rede `app-network`; stack de e-mail em rede isolada `email_net`, sem `imap-agent` no ar). Corrigido unificando os serviços na rede `app-network`.
- `Permission denied` em `logs/`: diretório do host com `chmod 655` e dono diferente do uid do container (`appuser`, uid 999). Corrigido com `chmod 775` no host + `group_add: ["1000"]` nos serviços do compose.
- 401 "unauthorized" recorrente no `imap-agent`: duas causas — (1) credencial n8n desatualizada em relação ao `.env` (a credencial Header Auth vive criptografada no banco do n8n e não lê `$env` em runtime); (2) mesmo após sincronizar o valor, o campo **Name** do header na credencial estava preenchido com o nome de exibição (`IMAP_AGENT_API_KEY`) em vez do nome real esperado pelo serviço (`X-Api-Key`). Corrigido ajustando o campo Name na UI do n8n.
- API pública do n8n retornando 401 mesmo com `/healthz` OK: API key salva em `.secrets/api.json` estava expirada/revogada (pertencia a outro ambiente n8n). Corrigido gerando nova chave no ambiente de dev correto.
- WF-3 falhando ao mover e-mail (`Client tried to access nonexistent namespace`): `system_parameters.folder_pending`/`folder_quarantine` usavam separador `/` incompatível com o padrão real do servidor IMAP (`INBOX.`). Corrigido nos parâmetros, pastas reais criadas via `imap-agent`, ressincronizado `mail_folders`, e corrigido hardcode residual em 2 nodes HTTP.
- Falso positivo no pre-commit hook (`.git-hooks/pre-commit.secrets`): bloqueava `.env.example` (por conter `.env.` no nome) e sinalizava `127.0.0.1` (loopback universal) como IP interno. Corrigido no próprio hook, sem desabilitar o scan.

## Pendências / próximos passos conhecidos

- WF-2 (pipeline de processamento de e-mail, ~40 nodes, o maior e mais arriscado) foi criado via API mas está inativo — precisa ser ativado/testado manualmente pelo usuário na UI do n8n, por agir sobre a INBOX real.
- WF-1, WF-3 e WF-4 já foram criados, ativados e validados ponta a ponta em produção/dev.
- Corrigir a nomenclatura desatualizada das credenciais no `WORKFLOWS.md` (`imap-agent-api`/`approval-service-api` → `IMAP_AGENT_API_KEY`/`APPROVAL_API_KEY`).
- Rotação de segredos recomendada anteriormente (senha Redis placeholder, restrição de `N8N_TRUSTED_PROXIES` de `0.0.0.0/0` para IPs reais do proxy) — status de execução não confirmado.
- PR aberto e ativo: `yvesmarinho/enterprise-n8n-workflow` PR #1 (branch `feat-email-mgmt-v2-deploy-e-diagnosticos-n8n`), incluindo a remoção do código legado.
