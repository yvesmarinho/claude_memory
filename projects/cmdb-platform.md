---
tags: [project, cmdb-platform, flask-appbuilder, sqlalchemy, ansible, cmdb]
aliases: []
created: 2026-08-03
updated: 2026-08-03
source: importado de 10 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Projetos-cmdb-platform/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:30 -->

# cmdb-platform

O **cmdb-platform** é uma aplicação CMDB (Configuration Management Database) em Python, stack **Flask-AppBuilder (FAB) 5 + SQLAlchemy 2 + Pydantic 2 + MySQL 8**, com migrations via **Alembic** e gerenciamento de dependências via `uv`. Cobre cadastro manual de infraestrutura (organização/geografia, DCIM, IPAM, services, tasks) em 5 fases via views CRUD do Flask-AppBuilder, e desde a feature 003 também inventário automatizado via **Ansible** (role `cmdb_inventory`) que popula o CMDB via API REST idempotente. Arquitetura em camadas: Presentation (views) → Application (services) → Domain (models SQLAlchemy) → Infrastructure (DB/config).

## Decisões arquiteturais/técnicas duráveis

- Staging genérico para descoberta: dados coletados pelo Ansible entram em `DiscoveredResource`/`HostSnapshot` (tabela genérica com `resource_type` enum) em vez de uma tabela por tipo — decisão D-04.
- Identidade estável de host: coluna `stable_host_key` UNIQUE em `devices` (prioridade: `machine-id` → UUID DMI → MAC) — D-03.
- Separação técnico vs. cadastral (drift): campos coletáveis por facts do host (hardware, SO, pacotes, serviços) são técnicos e auto-atualizáveis; campos de decisão humana/negócio (site, provider, organização, criticidade, notas) geram `DriftEvent` em vez de sobrescrita automática — D-05.
- Promoção automática restrita: só `network_interface`/`ip_address` (D-09) e `application`/`container` (via endpoint manual `POST /applications/promote`) têm caminho de promoção de `DiscoveredResource` para tabelas de domínio reais. `package`, `service`, `port`, `database`, `config_file` ficam presos indefinidamente em staging — lacuna arquitetural identificada e não implementada (proposta: novo serviço `inventory_promoter.py`).
- Sem vínculo automático cliente/organização/serviço no inventário: o payload Ansible carrega `cmdb_claim_provider`/`cmdb_claim_site`, mas o `inventory_reconciler.py` os ignora e usa `config.defaults.provider` fixo — hosts novos são criados vinculados a um provider genérico "Other". Gap real entre `spec.md` (FR-007, aspiracional) e implementação.
- Reconciliação 100% automática e síncrona: todo `upsert_host` ocorre em uma única transação que já comita sozinha; não há estado "pendente"/fila de aprovação humana para hosts novos nem para drift cadastral. Precedente de humano-no-loop existe via `ChangeRequest` (workflow DRAFT→SUBMITTED→APPROVED/REJECTED→IMPLEMENTED), mas não é usado no fluxo de inventário.
- Segredos do CMDB: cofre próprio via `ServiceComponentSecret` (Fernet AES-256, LGPD Art. 46), API `creds_api_views.py`. Endpoint `GET /<id>/reveal` (D-10) com controles fail-closed (token dedicado via env, 403 se não configurado), rate limit, `Cache-Control: no-store`, auditoria via `AuditLogger` em sucesso e negação, checagem de expiração (410).
- Vault do Ansible (segredos de bootstrap do playbook, ex. senha de `become`/sudo): deve viver em `.secrets/ansible_vault.yml`, nunca em `ansible/` versionado. Segredos de `service_component`/device específico NÃO vão para o Vault: ficam no CMDB (`ServiceComponentSecret`) e a role busca via HTTP em tempo de execução.
- Camada de views: padrão `sync_fk_from_relationship` no `BaseModelView` — copia PK do objeto de relacionamento selecionado no form para a FK antes da validação `pre_add`, evitando falso-negativo de campo obrigatório quando o form usa o relacionamento em vez da coluna FK direta.

## Convenções/padrões adotados

- Documentos em `docs/architecture/` devem refletir a contagem real de tabelas/views/menus lida do código, não estimativas — auditoria feita achou 89 tabelas (67 master + 22 lookup), 88 ModelViews, 78 menus ativos.
- Migrations Alembic novas que adicionam coluna/constraint precisam de guards de idempotência (`has_table`/`_column_exists`) porque a baseline do projeto recria o schema inteiro via `db.metadata.create_all()` com os models atuais.
- `.gitignore` trata `.specify/*` (SpecKit) e `.github/agents|prompts/*` como scaffolding ignorável, com exceções para `.specify/memory/constitution.md` e `.github/prompts/domain/`.
- Fluxo SDD do projeto: `objetivo.yaml` → questionário de esclarecimento → `/speckit.specify` → `/speckit.clarify` (máx. 5 perguntas) → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`, com decisões D-0x documentadas em `research.md`/`data-model.md`.
- Commit via `./scripts/git-commit-with-file.sh`, nunca commit direto sem pedido explícito do usuário.
- Testes: gate de cobertura mínimo 80% (real: 85-86%), suíte roda com `logs/pytest.log` (nível INFO) e `logs/pytest-results.xml` (JUnit).

## Problemas relevantes resolvidos

- BUG-043 — Provider Type "obrigatório" mesmo selecionado: form usava `provider_type_rel` mas a validação `pre_add` lia a FK `id_provider_type`, só preenchida no flush do SQLAlchemy. Corrigido com `sync_fk_from_relationship`, aplicado também em `DevicesModelView`/`NetworkInterfaceModelView` com o mesmo defeito latente.
- 75 falhas de suíte completa (pré-existente): `tests/test_form_hints/conftest.py` instalava `MagicMock` em `sys.modules["flask_appbuilder.models.sqla.interface"]` e nunca restaurava, poluindo o cache de import para todos os testes seguintes. Corrigido removendo o mock.
- BUG-044 — 23 cenários falhos em `test_relationship_validation_post.py`: 7 tinham causa real (contexto de sessão + ordem de consumo do flash), corrigidos; 16 têm 3 causas distintas documentadas (fixture incompleta, nome de campo errado, bug real no `flask_appbuilder` — `EnumField.pre_validate` levanta `ValueError` em vez de `ValidationError`) e ficaram marcados `xfail`.
- Listagem de Devices exibia "Server" em vez do nome do device: `DevicesModelView` não definia `list_columns`/`show_columns` explícitos, caindo no fallback padrão do FAB. Corrigido definindo colunas explícitas.
- Ansible sem `roles_path`: `ansible.cfg` real precisava de `roles_path = ./roles` para `include_role` funcionar; criado a partir do `ansible.cfg.example`.
- GitGuardian bloqueou PR #19: senha hardcoded `Admin123!` em `scripts/create_admin_user.py:47`. Usuário optou explicitamente por override (`gh pr merge 19 --admin --merge`); a senha permanece no histórico como credencial comprometida e precisa ser rotacionada.

## Pendências / próximos passos conhecidos

- Camada de transformação/promoção ausente para `package`, `service`, `port`, `database`, `config_file` — hoje ficam permanentemente em `DiscoveredResource`.
- Sem vínculo automático de hosts novos a Organization/Customers/Service — `ServiceComponentToDeviceMapping` existe no schema mas não é preenchido pelo reconciler.
- Sem revisão/aprovação humana para hosts novos ou drift cadastral antes da persistência.
- Tela "Tasks" não exibe `IntegrationRun`/`InventoryRun` — módulo Integration desativado no menu; feature `004-inventario-visibilidade-tasks` especificada (23 tasks, MVP = US1 somente-leitura), estado de implementação não confirmado.
- **Rotacionar a senha `Admin123!`** de `scripts/create_admin_user.py`, comprometida desde o merge do PR #19.
- Vault do Ansible (`.secrets/ansible_vault.yml`) discutido mas não implementado até o fim das sessões capturadas.
- T042 (validação E2E) da feature 003 parcialmente executada contra host real `home011` — cenários de "alteração técnica" e "recurso removido" não testados por restrição de blast-radius do classificador de permissões.
- Endpoint `/reveal` de secrets (D-10) em implementação ao final da captura de sessões — não confirmado como concluído/commitado.
