---
tags: [project, enterprise-ansible, ansible, infra, vps, fwknop, ssh-spa, cloudflare-zero-trust, speckit, debian]
aliases: [enterprise-ansible, ansible enterprise, ssh-spa repo]
created: 2026-08-26
updated: 2026-08-26
source: sessão Claude Code 2026-08-26 (feature 006-server-inventory) + CLAUDE.md do repo + .specify/memory/constitution.md
---

<!-- Criado em: 26/08/2026 17:05 -->
<!-- Modificado em: 26/08/2026 17:05 -->

# enterprise-ansible

Automação de infraestrutura corporativa baseada em **Ansible** para a frota de VPS Debian 12 da Vya.Digital: config base, hardening de segurança, **SSH Single Packet Authorization via fwknop**, Cloudflare Zero Trust Access (WARP Connector), Docker e observabilidade de logs (Promtail/Loki). Repo em `~/Documentos/DevOps/Vya-Jobs/enterprise-ansible`. Ponto de entrada interativo: TUI `make manage` (`uv run manage.py`, Textual, PEP 723). Ansible 2.14+, Python 3.9+, gerido com `uv`. Governança **SpecKit** (`specs/NNN-slug/` → plan → tasks → implement), constituição vinculante em `.specify/memory/constitution.md` (v1.3.0).

Frota ativa (grupo `all_spa`, inventário `inventories/hosts.yml`): **wf001, wf008, wfdb01, wfdb02** — todos SSH porta 5010, user `archaris`, knock UDP 62201. wfdb02 é servidor de banco (sem Docker). Demais hosts do inventário (`vps_new`, `vps_hardened`, `cf_vpn_servers`, wfdb03) estão vazios/mortos — limpeza pendente (spec 007).

## Arquitetura — layout `services/<svc>/`

- Desde ago/2026 (commit `3468419`): um diretório por serviço, cada um com seu `roles/` e `playbooks/`. **8 serviços**: `vps-base-security`, `vps-logging`, `ssh-spa`, `docker`, `network-config`, `cloudflare-vpn-warp`, `cloudflare-zta`, `server-inventory`.
- `ansible.cfg` único na raiz: `roles_path` enumera os 8 `./services/<svc>/roles`. **`forks = 1` obrigatório** (mitigação CVE-2026-31431 — execução serial). `vault_password_file = ./.secrets/.vault_pass`. `[ssh_connection]` com `ControlMaster=auto ControlPersist=60s` + `pipelining=True`.
- Variáveis centralizadas: escopo host/grupo em `group_vars/<group>/` na raiz (nunca duplicado por serviço); escopo role em `roles/<role>/defaults/main.yml`. **Não existe tier `vars/` por serviço** (removido nesta sessão — não tinha mecanismo de auto-load).
- `playbooks/` na raiz = só entrypoints cross-service (`site-first-deploy.yml`, `validate-deployment.yml`). Playbooks single-service vivem em `services/<svc>/playbooks/`.
- `playbooks-archive/` e `old/kubernetes-deployment/` = arquivados (K3s/Kubespray, RabbitMQ, Redis), não estender.

## Decisões arquiteturais/técnicas duráveis

- **SSH SPA gate (Constituição Princípio VII)**: porta 5010 FECHADA por UFW por padrão, aberta só por knock fwknop HMAC-SHA256 autenticado, timeout curto (≥15s). Sequência obrigatória: instalar+testar fwknopd → confirmar knock → SÓ ENTÃO fechar a porta. Nunca abrir para `0.0.0.0/0`.
- **É fwknop, não "port-knocking SPA genérico" nem o plano Cloudflare VPN** (que foi abandonado). Acesso operacional real: scripts `~/.local/bin/ssh-<host>` (symlinks p/ `scripts/ssh-servers/ssh-*`) fazem `fwknop --named-config <host> --rc-file ~/.fwknoprc` → espera TCP 5010 → `ssh -p 5010 archaris@IP`. `~/.fwknoprc` tem uma seção `[<host>]` por servidor. Instalador do cliente: `client-packages/spa-client/linux/install.sh`.
- **Padrão de knock em playbook**: play "Pre-knock" (`hosts: localhost`, loop `fwknop --named-config` sobre `groups[...]`) + pausa; para runs longos com `forks=1`, adicionar `serial: 1` + re-knock por host nas `pre_tasks` (janela SPA fresca por host; conexões SSH abertas sobrevivem via ControlPersist). Modelo: `services/ssh-spa/playbooks/ssh-spa-deploy.yml` e `services/server-inventory/playbooks/inventory-collect.yml`.
- **Brownfield production safety (Princípio VIII, inegociável)**: nunca `state=restarted` direto em serviço de produção — handlers usam `reload` via `notify`/`listen`; `restart` exige comentário justificando. Todo arquivo de config tocado: backup antes (`.bak.<timestamp>` ou `backup: yes`). Todo playbook destrutivo/stateful tem `*-rollback.yml`. Mudanças **aditivas** — não modificar roles/playbooks existentes para adicionar capacidade; criar novos.
- **ZTA / WARP Connector (Princípio V)**: usar WARP Connector (cloudflared tunnel mode) em servidores, nunca o cliente WARP completo; nunca default gateway; rotas explícitas e escopadas ao serviço exposto; roles de VPN nunca tocam regras UFW existentes; um túnel por tenant/serviço.
- **Idempotência**: re-rodar playbook contra estado inalterado = zero tasks `changed`.
- **Segredos** só via Ansible Vault ou `.secrets/`; nunca plaintext em `group_vars`/templates. `.secrets/.vault_pass` é o password file.
- **fwknop `access.conf`**: usar `$IP`/`$SRC` para o IP de origem — nunca `%IP%`/`%SRC%` (passam literais, quebram geração de regra UFW). `ufw insert 1 allow from $IP ...` no `CMD_CYCLE_OPEN` (não `ufw allow`, que appenda no fim e perde para um `DENY` anterior). `ENABLE_CMD_EXEC` só no `access.conf` (stanza), nunca no `fwknopd.conf` (ignorado silenciosamente).
- **Auditoria (`services/server-inventory`)**: coleta **read-only** (toda task `changed_when: false`), saída SÓ em `.tmp/inventory/` (gitignored — contém IPs/hostnames reais, nunca commitar). Coleta por **allowlist** campo-a-campo (`roles/server-inventory/tasks/assemble.yml` + template Go `files/container-inspect.gotmpl` — o template FÍSICAMENTE não emite `Config.Env`/cmdline/`Mounts[].Source`). Nunca `docker inspect '{{json .}}'`, nunca ler `/etc/fwknop/`, `~/.ssh/`, `*.env`, `.secrets/`, `ss -p`. Gate `inventory-verify.yml` = JSON Schema (`contracts/inventory-schema.json`, `additionalProperties: false`) + varredura regex anti-segredo.

## Convenções/padrões adotados

- Commits Conventional Commits, corpo/docs em pt-BR; branch `NNN-feature-name` / `fix-*` / `docs-*`, dirigido por specs em `specs/`. Nunca commitar direto em `main` — sempre branch + PR.
- Verificação disponível: `make lint` (`yamllint . && ansible-lint`, profile `moderate`), `make syntax-check` (glob `playbooks/*.yml services/*/playbooks/*.yml`), `--check --diff`. **Molecule/pytest-ansible declarados em `pyproject.toml` mas sem cenários** — Constituição IV (test-first) é gap conhecido; `services/server-inventory/roles/server-inventory/molecule/default/` é o 1º (e único) cenário Molecule do repo (delegated/localhost).
- Docs em `docs/` (topic-organized, `docs/README.md` é o índice canônico); docs de sessão em `docs/SESSIONS/YYYY-MM-DD/` (append-only); bug-reports em `docs/bugs/`. `.specify/` nunca editar à mão.
- Jinja2 NÃO tem list/dict comprehension — usar `map`/`select`/`selectattr`/`community.general.json_query` (jmespath) ou `loop` + `set_fact` acumulado.
- `.claude/` (commands + skills speckit) versionado desde 26/08/2026; `.claude/settings.local.json` no `.gitignore` (allowlist de permissões da máquina, contém IPs).
- Tooling per-agente do GitHub Copilot (`.copilot-*`, `.github/agents/`, `.github/prompts/`, `.github/.copilot-instructions.md`) **removido** em 26/08/2026 — SpecKit agora só via `specs/` + `.specify/`.

## Problemas relevantes resolvidos (sessão 2026-08-26)

- **Refatoração `services/` incompleta**: 6 refs quebradas `{{ playbook_dir }}/../X` (playbooks desceram de 1→3 níveis; o refactor original só corrigiu `group_vars`). Corrigido p/ `../../../`.
- **Revisão de segurança PR #2** (`docs/bugs/2026-08-26_security-review-pr2.md`): senha de bootstrap `root` da VPS hardcoded em **6 playbooks ativos** + histórico git; migrados p/ `{{ vault_root_password }}` (var já existia no vault). Também: senha ArgoCD (K3s) e Cloudflare Global API key em texto plano em docs. **PR #2 (`005-ssh-spa` → `main`) segue bloqueado pelo GitGuardian** — rotação de credenciais + reescrita de histórico NÃO é possível agora (retrabalho demais, decisão do usuário).
- **feature 006-server-inventory**: serviço Ansible novo, aditivo, de inventário/auditoria read-only da frota. PR #3 (base `005-ssh-spa`). Primeiro run real 2026-08-26: 4/4 hosts, 0 failed (wf001 Debian 12.15 / 489 pkgs / 27 containers; wf008 610/9; wfdb01 12.12 / 478 / 64 containers; wfdb02 766 pkgs / sem Docker). Follow-up perf: `docker inspect` é 1 chamada SSH por container.

## Pendências / próximos passos conhecidos

- **PR #2** bloqueado (GitGuardian) até rotação de credenciais + `scripts/scrub-history-secrets.sh` + `git push --force` + recriar PR. Adiado pelo usuário.
- **PR #3** (feature 006) aberto, base `005-ssh-spa`; ordem esperada: mergear PR #2 → rebasear 006 na `main` → mergear PR #3.
- Apagar branches `003-ansible-service-api` e `004-wfdb03-cloudflare-fix` depois que PR #2 entrar.
- **spec 007 — limpeza de inventário**: remover hosts/grupos mortos (`vps_new`, `vps_hardened`, `cf_vpn_servers`, wf005/wf006/wfdb03). Requer decidir aposentadoria dos serviços `cloudflare-vpn-warp` (VPN já dada como morta) e `cloudflare-zta` (precisa confirmação) — blast radius documentado.
- Achado colateral: Cloudflare Global API key em texto plano em `docs/Integration/{CONFIG-BASED-CREDENTIALS,FEATURE-CONFIG-CREDENTIALS}.md` — redigir + rotacionar + adicionar como Achado I ao security-review.
- feature 006: cenário Molecule Docker-in-Docker p/ `tasks/docker.yml`; otimizar `docker inspect` para uma chamada única (`docker inspect $(docker ps -aq)`).

## Links relacionados

- [[cmdb-platform]] — CMDB Flask-AppBuilder que consumiria o inventário (integração invertida, abandonada)
- [[enterprise-observability]] — stack Prometheus/Grafana/Loki que monitora a mesma frota (wfdb01/wfdb02/wf001/wf008)
- [[local-bin-scripts]] — scripts `~/.local/bin/ssh-<host>` de knock+conexão
- [[infra-stack]] — stack de infra que administro
- [[2026-08-26]] — diária da sessão que criou esta nota
