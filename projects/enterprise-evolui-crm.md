---
tags: [project, enterprise-evolui-crm, whatsapp, crm, nextjs, supabase]
aliases: [evolui-crm, wacrm, Vya Evolui CRM]
created: 2026-08-03
updated: 2026-08-03
source: importado de 36 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Vya-Jobs-enterprise-evolui-crm/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:25 -->

# enterprise-evolui-crm

O **enterprise-evolui-crm** (nome público "Vya Evolui CRM") é um fork do projeto open-source `wacrm` (upstream `ArnasDon/wacrm`, fork em `yvesmarinho/enterprise-evolui-crm`) — um CRM de atendimento via WhatsApp construído em Next.js/TypeScript com backend Supabase (self-hosted), integração oficial com a Meta Cloud API do WhatsApp Business, e um servidor MCP próprio. O deploy roda em Docker Compose atrás de Traefik no host `wfdb01` (`evolui-crm.vya.digital`).

## Decisões arquiteturais/técnicas duráveis

- Stack: Next.js 16 + React 19 + Tailwind 4 + TypeScript, com i18n via **next-intl** (não i18next — `defaultValue` em `t()` não é suportado e cai silenciosamente no fallback padrão de exibir a chave crua).
- Backend Supabase self-hosted: Postgres, GoTrue (auth), PostgREST (rest), Realtime, Storage, Kong (gateway) e postgres-meta, todos orquestrados via `docker-compose.yml` em `deploy/`.
- Autenticação de mensageria: hoje o app fala **somente com a Meta Cloud API oficial** (`src/lib/whatsapp/`); a integração com Evolution API (self-hosted, WhatsApp não-oficial via Baileys) foi projetada e adiada para "Fase 2" — infraestrutura de deploy (`docker-compose.evolution.yml`) existe, mas não há camada de provider no código do CRM ainda.
- Papéis de usuário são **por conta**, não globais: `account_role_enum` = owner (4) > admin (3) > agent (2) > viewer (1), definido em `src/lib/auth/roles.ts` e replicado em `supabase/migrations/017_account_sharing.sql`. Existe uma coluna legada `profiles.role TEXT DEFAULT 'user'` marcada "legacy, unused" — não usar.
- Trigger `handle_new_user` (Postgres) cria profile + conta própria com `account_role='owner'` automaticamente para todo novo `auth.users`; ele engole exceções, então falhas no insert do profile não abortam a criação do usuário — pode deixar usuário sem profile silenciosamente.
- Deploy Docker: aplicação e banco em containers separados; rede `app-network` (externa, Traefik) para app/Kong/Evolution e rede `db-network` **interna** (sem publicar porta) para os serviços de banco.
- Imagem da aplicação é **pré-buildada e publicada no Docker Hub** (`adminvyadigital/enterprise-evolui-crm`, tags `0.0.x` + `latest`) em vez de build no `docker compose up` — script `deploy/scripts/build-push.sh`. Build deve ser feito a partir da **raiz do repo** (não de dentro de `deploy/`).
- Imagem é **genérica** (sem `.env`/segredos): builda com placeholders para `NEXT_PUBLIC_*`, substituídos em runtime por `deploy/docker-entrypoint.sh`. Exceção: `NEXT_PUBLIC_APP_LOCALE=pt-BR` fixo em build-time.
- Flags `NEXT_PUBLIC_*` que dependem de runtime real não podem usar placeholder-substitution (minificador do Next dobra comparações de string constante) — solução: leitura dinâmica no servidor + página `force-dynamic`.
- Volumes de dados usam **bind mounts** parametrizados por `DATA_DIR`, padrão `/opt/docker_user/enterprise-evolui-crm/<subpasta>`.
- Migrations (`supabase/migrations/*.sql`, 35 arquivos) aplicadas por serviço one-shot idempotente `db-migrations`, executado a cada `up`, controlado via `public._migrations`. `deploy/migrations/` mantém cópia real versionada (não symlink) para `deploy/` ser autossuficiente.
- Ordem garantida pelo compose: `supabase-db` (healthy) → `supabase-storage` → `db-migrations` → `admin-bootstrap`/`app`. `admin-bootstrap` cria admin padrão via Admin API do GoTrue (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- Signup público desabilitável via `DISABLE_SIGNUP`/`NEXT_PUBLIC_SIGNUP_ENABLED`; SMTP no-reply (só envio) via `SMTP_*`.
- Segurança: RLS em todas as tabelas, tokens com AES-256-GCM, webhooks com HMAC-SHA256 timing-safe, rate limiting/CSP em `next.config.ts`.
- `GOTRUE_DISABLE_SIGNUP` não bloqueia a Admin API (usa service_role key).
- `gh repo set-default yvesmarinho/enterprise-evolui-crm` configurado — PRs sempre no fork, nunca no upstream.
- Sync com upstream é sempre ação explícita (`git fetch upstream && git merge upstream/main`).

## Convenções/padrões adotados

- Scripts operacionais em Python (`scripts/`) seguem as regras globais: `.secrets/*.json`, `requests` em vez de `curl` com credenciais, logging estruturado, type hints, docstrings RST com doctest.
- `scripts/generate_keys.py` mescla chaves em `.secrets/.env` sem sobrescrever (rotação só com `--rotate`), com backup timestampado.
- `scripts/create_admin_user.py` cria usuário via Admin API do GoTrue lendo `.secrets/create_account.json` e `.secrets/.env`; aplica `account_role` via PATCH pós-criação.
- Bug reports em `docs/bugs/YYYY-MM-DD-descricao.md`; anexos grandes em `docs/bugs/attachments/<slug>/`.
- Solicitações de melhoria em `docs/improvements/`, template em `docs/templates/SOLICITACAO_MELHORIA.md`.
- `.gitignore` do upstream foi reforçado com `.secrets/`, `logs/`, `.claude/`, `.vscode/`, `*.code-workspace`, `tmp/`, `__pycache__/`.
- Hook pre-commit local bloqueia credenciais; `${VAR}` em connection strings é tratado como seguro; credenciais de exemplo em docs devem ser ofuscadas.
- Projeto usa **npm** oficialmente — `pnpm-lock.yaml`/`pnpm-workspace.yaml` gerados localmente nunca devem ser commitados.
- Revisões de segurança automáticas por commit têm custo alto de tokens em sessões com muitos commits seguidos.

## Problemas relevantes resolvidos

- Kong em crash-loop: aspas duplas em `kong.yml` eram removidas pelo `eval` do entrypoint — corrigido com aspas simples.
- `supabase-auth`/`rest`/`storage` falhando autenticação com Postgres: senhas dos roles internos não alinhadas automaticamente — corrigido com init script `zz-align-role-passwords.sh`.
- `supabase-realtime` em crash-loop: faltava schema `_realtime`/`realtime` — corrigido com init script `zz-realtime-schema.sh`.
- Migrations não aplicadas automaticamente ao recriar volume — corrigido com serviço one-shot idempotente `db-migrations`.
- Pasta de migrations vazia no servidor (symlink não sobrevivia ao sync) — corrigido copiando arquivos reais versionados.
- TLS servindo cert default do Traefik: nome de certresolver/entrypoint divergente ou Kong em crash-loop bloqueando ACME.
- Admin criado sem papel/conta quando bootstrap rodava antes das migrations — corrigido com backfill idempotente + ordem garantida no compose.
- Build Docker falhando por contexto errado (`deploy/` em vez da raiz do repo).
- `.env` não pode entrar na imagem — resolvido com placeholders + substituição em runtime.
- Webhook Meta rejeitado por assinatura inválida: `META_APP_SECRET` divergente entre servidor e Meta Business Manager (não era bug de código).
- Texto quebrando caractere-por-caractere em Automations: causa raiz real era `InteractiveBuilder` alternando layout lado a lado por breakpoint de viewport dentro de card de 320px — corrigido com `showPreview={false}`.
- Cards de branch sobrepostos em Automations: cadeia de causas (larguras fixas por viewport, falta de `w-full`/`min-w-0` propagado, dropdown via Portal) — corrigido com combinação de fixes.
- Botão "Delete" de step em branch não funcionava sem erro: bug de lógica no path da árvore (`StepRenderer` concatenava em vez de substituir segmento placeholder).
- Chaves i18n cruas na UI: uso de `defaultValue` (opção do i18next, inexistente no next-intl usado) — corrigido adicionando chaves faltantes.
- `AuthApiError: Refresh Token Not Found` recorrente: rotação de refresh token com propagação de cookies incompleta no middleware.

## Pendências / próximos passos conhecidos

- Endpoint `/api/evolution/webhook` e camada de provider Evolution API ainda não implementados (Fase 2).
- Reforço adicional em `middleware.ts` para `refresh_token_not_found` cogitado, não implementado.
- Textos residuais mencionando "wacrm" ainda não atualizados para a marca nova; identificadores internos (`API_KEY_PREFIX`, chaves de localStorage) deixados intactos de propósito.
- 26 erros / 39 warnings de lint pré-existentes (React Compiler/hooks), não corrigidos.
- Fix do texto quebrado em Automations teve múltiplas iterações — vale reconfirmar em produção após deploy da imagem mais recente.
- Sem ferramenta de browser automatizada disponível neste ambiente — diagnósticos visuais dependem de prints fornecidos manualmente.
