---
tags: [project, enterprise-evo-crm-community, evolution-api, crm, rails, go, python, docker]
aliases: [evo-crm-community, evocrm]
created: 2026-08-18
updated: 2026-08-18
source: sessão Claude Code em ~/Documentos/DevOps/Vya-Jobs/enterprise-evo-crm-community
---

<!-- Criado em: 18/08/2026 13:15 -->
<!-- Modificado em: 18/08/2026 13:16 -->

# enterprise-evo-crm-community

CRM community edition da Vya, composto por múltiplos serviços em submódulos git, orquestrados via `docker-compose.prod.yml`:

- `evo-crm` (Ruby/Rails) — app principal, porta 3000, roteado via Traefik em `evocrm-api.vya.digital`.
- `evo-auth` (Ruby/Rails) — serviço de autenticação, porta 3001.
- `evo-core` (Go/Gin) — porta 5555, migrations via `golang-migrate` (`evo_core_community_schema_migrations`).
- `evo-processor` (Python/FastAPI) — migrations via `alembic`.
- `evo-bot-runtime`, `evo-frontend` (nginx).
- Workers Sidekiq: `evo-auth-sidekiq`, `evo-crm-sidekiq`.
- Submódulos: `evo-ai-crm-community`, `evo-ai-processor-community`, `evo-auth-service-community`.

Banco Postgres compartilhado `evocrm_db`. Ver [[infra-stack]] para o par de servidores `home011`/`wfdb02` e o fluxo de migration/restore entre eles.

## Decisões/achados duráveis

- Fluxo de deploy de schema: aplicar todas as migrations pendentes em `home011` (sem PgBouncer) e depois `pg_dump`/`pg_restore` para `wfdb02` (produção, atrás de PgBouncer) — nunca rodar migrations direto contra produção.
- `evo-processor` (Python) usa Alembic; carimbo de versão fica em `alembic_version` — checar com `alembic current` dentro do container.
- `evo-core` usa `golang-migrate`, mas o entrypoint padrão (`./migrate up`) trava contra PgBouncer (`pg_advisory_lock`). Workaround: `command: ["./main"]` no compose (pula o migrate automático) + `scripts/run_evo_core_migrations.py` (aplica via psycopg2 puro, tabela de controle `evo_core_community_schema_migrations`).
- `scripts/mark_migration_applied.py` e `scripts/test_postgres_connection.py` completam o kit de diagnóstico/reparo de migrations Rails quando o DDL já rodou mas o registro em `schema_migrations` ficou incompleto (containers mortos no meio de um `db:prepare`).
- Bug de compose corrigido: `evo-auth-sidekiq`/`evo-crm-sidekiq` sem `networks: app-network` — ficavam sem acesso a `redis.vyadigital` e entravam em crash loop.
- Bug no submódulo `evo-ai-crm-community` corrigido: `config/initializers/facebook_webhook_logger.rb` usava `Rails.application.config.middleware.include?`, método que não existe mais em `Rails::Configuration::MiddlewareStackProxy` no Rails 7.1 — trocado por `begin/rescue`.
- Bug no Dockerfile do `evo-ai-crm-community` corrigido: `curl` só era instalado quando `RAILS_ENV != production`, mas o healthcheck do `evo-crm` no compose depende de `curl` sempre — movido para instalação incondicional.
- PR aberto para essas correções: https://github.com/yvesmarinho/enterprise-evo-crm-community/pull/1 (branch `chore/enterprise-setup-updates`).

## Convenções

- Scripts operacionais em `scripts/` seguem as regras globais Python (uv, logging, type hints, docstrings RST) e leem credenciais de `.secrets/.env` (nunca hardcoded).
- Nunca commitar `.env.prod`, dumps `evocrm_db-*.sql` nem `logs/` — ficam fora do git propositalmente.

## Pendências conhecidas

- Tabela órfã `evo_core_schema_community_migrations` (nome com palavras trocadas) presente em `home011`, não removida (destrutivo, sem confirmação clara de que é lixo).
- `evo-frontend`: healthcheck usa `wget` contra `localhost:80`, que resolve para `::1` (IPv6) dentro do container e recebe "connection refused" — nginx só escuta IPv4. Não bloqueia o serviço, mas o container aparece como "unhealthy".
- Submódulos `evo-ai-crm-community` e `evo-auth-service-community` ficaram com mudanças locais não commitadas (fix do initializer, `db/schema.rb`, `config/database.yml`) — precisam de commit/PR próprios nos respectivos repositórios antes de atualizar a referência no repo principal.
