---
tags: [project, enterprise-ansible, ansible, infra, vps, fwknop, ssh-spa, cloudflare-zero-trust, speckit, debian, security-update]
aliases: [enterprise-ansible, ansible enterprise, ssh-spa repo]
created: 2026-08-26
updated: 2026-08-27
source: sessão Claude Code 2026-08-26 (feature 006-server-inventory) + 2026-08-27 (plano security-update) + CLAUDE.md do repo + .specify/memory/constitution.md
---

<!-- Criado em: 26/08/2026 17:05 -->
<!-- Modificado em: 27/08/2026 15:11 -->

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
- **Auditoria (`services/server-inventory`)**: coleta **read-only** (toda task `changed_when: false`), saída SÓ em `.tmp/inventory/` (gitignored — contém IPs/hostnames reais, nunca commitar). Coleta por **allowlist** campo-a-campo (`roles/server-inventory/tasks/assemble.yml` + template Go `files/container-inspect.gotmpl` — o template FÍSICAMENTE não emite `Config.Env`/cmdline/`Mounts[].Source`). Nunca `docker inspect '{{json .}}'`, nunca ler `/etc/fwknop/`, `~/.ssh/`, `*.env`, `.secrets/`, `ss -p`. Gate `inventory-verify.yml` = JSON Schema (`contracts/inventory-schema.json`, `additionalProperties: false`) + varredura regex anti-segredo. **Gap conhecido do allowlist**: não captura pacotes/versão de MySQL/PostgreSQL — em `wfdb02` (único host com bancos nativos, sem Docker) o coletor não vê `mysql`/`postgresql` em `packages`, só as portas abertas (3306/5432/6432). Qualquer automação sobre versão de banco precisa de descoberta própria (`dpkg-query` + `mysql --version`/`psql --version`), não confiar no inventário.
- **Janela de manutenção da frota**: todos os hosts (`all_spa`) estão em produção ativa **segunda a sexta, 07h–21h**. Operações reais contra a frota (deploy, updates, restart) devem ficar fora desse horário — noite/madrugada ou fim de semana. Ferramentas puramente locais (lint, syntax-check) podem rodar a qualquer hora.
- **Padrão de guard de major version fixa** (usado em `services/security-update`): quando uma automação deve aplicar só patches/minor updates sem permitir troca de major version (Debian, MySQL, PostgreSQL), validar a major **antes** (assert em fact/descoberta) e **depois** (recoletar e comparar) do update, abortando com mensagem clara se divergir — nunca confiar que `apt upgrade`/`only_upgrade: true` sozinho garanta isso (repos de terceiros podem introduzir uma major nova).

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

## Feature `security-update` (sessão 2026-08-27)

- Novo serviço aditivo `services/security-update/` (não modifica `vps-base-security`/`vps-security` existentes) — plano de atualização de segurança da frota em 4 fases, ordem fixa, cada uma com par deploy/rollback: **1) Sistema Operacional** (`os-update-deploy/rollback.yml` — `apt upgrade dist`, major Debian fixada em **12/bookworm** com guard antes/depois via `/etc/os-release`, kernel novo só é avisado, reboot exige `-e confirm_reboot=true` explícito para não colidir com o SPA gate); **2) Segurança** (`security-hardening-update-deploy/rollback.yml` — openssh-server/sudo/ufw/fwknop-server/unattended-upgrades, `sshd` nunca `restart` direto — só `reload` após `sshd -t`, termina sempre lembrando `make ssh-spa-validate`); **3) Docker engine apenas** (`docker-engine-update-deploy/rollback.yml` — só docker-ce/docker-ce-cli/containerd.io, containers/imagens ficam para outro plano, pula `wfdb02` automaticamente); **4) Banco de Dados** (`db-security-update-deploy/rollback.yml` — só `wfdb02`, descoberta dinâmica de pacotes MySQL/Postgres pelo gap do inventário, aborta se algo fugir de MySQL 8.4.x/PostgreSQL 16.x, dump lógico `mysqldump`/`pg_dumpall` antes de qualquer update).
- Todos os 8 playbooks seguem o padrão de 2 plays (pre-knock SPA em `localhost` + play principal `serial: 1` com re-knock por host nas `pre_tasks`), confirmação interativa (`pause`) antes de qualquer mudança, e backup de versões pré-update em `/root/security-update-backups/<run_id>/` no host remoto (fonte da verdade para o rollback via `apt-get install pkg=versão`).
- Role compartilhada `services/security-update/roles/security-update/` só com a task `backup-package-versions.yml` (reuso via `roles: [{role: security-update, tasks_from: backup-package-versions}]`); `ansible.cfg` `roles_path` e `Makefile` (alvos `security-update-os/-security/-docker-engine/-db` + `-rollback`, `RUN_ID=`/`HOST=`) atualizados.
- Validado com `make syntax-check` (8/8 OK) e `yamllint` (limpo). `ansible-lint` (profile moderate) NÃO foi rodado até o fim nesta sessão — usuário interrompeu pedindo para não executar comandos, citando a janela de manutenção (ver decisão acima). Pendente: rodar `ansible-lint services/security-update/` e corrigir o que aparecer, fora do horário de produção.
- Ainda não executado contra a frota real — plano recomenda piloto em `wf008` (`--limit wf008`) antes de rodar em todos os hosts, e sempre fora de seg-sex 07h-21h.

## Pendências / próximos passos conhecidos

- **`security-update`**: rodar `ansible-lint` pendente; executar piloto (`--check --diff --limit wf008`) fora da janela de produção antes do primeiro run real.
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


## Onboarding de host + auto-detecção de conexão (sessão 2026-09-14)

- **Host novo em onboarding**: `buzzclub-srvr001` (82.38.173.184), branch `007-security-update`. Ainda não concluiu `site-first-deploy`/`ssh-spa-deploy` — não contar como membro efetivo de `all_spa` até isso terminar (ver `[[../daily/2026-09-14|nota diária]]` pros detalhes do processo).
- **Auto-detecção de conexão em runtime** (`services/vps-base-security/roles/common/tasks/detect-connection.yml`, novo): a porta/usuário SSH não devem ser assumidos só pelo grupo do inventário — um host pode reverter pra fresh (reset do provedor) sem o inventário refletir isso. Padrão: `wait_for` + `delegate_to: localhost` (TCP puro, sem SSH) testando a porta atual → 22 → 5010; `set_fact` de `ansible_port`/`ansible_user`/`ssh_hardened`; `meta: reset_connection` (**nunca** usar `when` nele — Ansible ignora silenciosamente e sempre executa); só então `ansible.builtin.setup`. Requer `gather_facts: false` na play chamadora. Adotado em `playbooks/site-first-deploy.yml` e `services/ssh-spa/playbooks/ssh-spa-deploy.yml`; os demais ~9 playbooks com grupo estático (`cf_vpn_servers`, `vps_hardened`, `all_spa` fora do ssh-spa) ainda não migraram — decisão explícita de escopo reduzido.
- **Checkpoint de execução por role** (`.tmp/state/<host>.json`, gitignored): `load-execution-state.yml`/`save-execution-state.yml` no role `common` gravam `{"<role>": {"status": "done", "timestamp": ...}}` ao final de cada role (via `include_role` dentro de um `block` com `when: execution_state[role].status != 'done'`). Permite retomar playbook interrompido sem repetir roles já concluídas. Risco conhecido: o estado pode "mentir" se o host for resetado externamente sem o checkpoint ser limpo.
- **`host_services` (lista por host) como alternativa a grupo-por-fase**: em vez de mover manualmente um host entre grupos (`vps_fresh_setup`→`vps_hardened`→`all_spa`), o host declara `host_services: [...]` e o playbook se auto-classifica via `community.general.group_by` em grupos estáticos existentes sem exigir membership prévia. Cuidado: grupo criado assim herda as `vars:` estáticas do grupo alvo se ele já existir com vars fixas — só é seguro se algo rodar depois (como a auto-detecção) sobrescrevendo via `set_fact`.
- **Ordem rígida de onboarding**: `site-first-deploy.yml` (autentica root/senha do vault, harden até porta 5010/archaris) **sempre antes** de `ssh-spa-deploy.yml` (assume host já com chave `archaris`) — rodar fora de ordem produz `Permission denied` que parece bug de config mas é pré-requisito não satisfeito.
- **`--limit` não filtra `groups['x']` referenciado num `loop`** — só restringe quais hosts a *play* roda. Corrigido no `ssh-spa-deploy.yml`: o knock fwknop, que antes fazia `loop: groups['all_spa']` numa play `hosts: localhost` (socava todo mundo mesmo com `--limit`), virou `pre_tasks` delegados a `localhost` dentro da própria play `hosts: all_spa`.
- **Bugs pré-existentes corrigidos** (não causados por mudança recente, só nunca exercitados com host fresh real): `ssh-port-migration.yml` não atualizava `ansible_user` ao migrar de porta 22→5010 (reconectava como `root`, já trancado pelo próprio hardening que acabara de rodar); `group_vars/security.yml` estava órfão (grupo `security` inexistente no inventário) desde a reorganização `93c5ad9` — movido para `group_vars/all/security.yml`.
- **Pendência nova**: migrar sessões antigas de `docs/SESSIONS/` (nov/2025–ago/2026, ~115 arquivos) pro vault — adiado pelo usuário, só a sessão de hoje foi registrada.

Detalhes completos, arquivos modificados e gotchas: `[[../daily/2026-09-14|2026-09-14]]`.


## Correções pós-onboarding: UFW/fwknop e checkpoint em outros playbooks (sessão 2026-09-15)

- **`community.general.ufw` com `policy`/`default` sem `direction` aplica à direção `incoming` por padrão** (confirmado no código-fonte do módulo) — `services/ssh-spa/roles/ssh-spa/tasks/firewall.yml` usava isso pra "habilitar o UFW" e sobrescrevia silenciosamente o `ufw_default_incoming: deny` da `vps-security` toda vez que `ssh-spa-deploy` rodava. Nunca usar `policy:`/`default:` num módulo `ufw` sem `direction` explícito, mesmo com intenção só de habilitar o serviço.
- **Checkpoint (`.tmp/state/<host>.json`) tem que ser ancorado em `{{ inventory_dir }}/../.tmp/state/`**, não em path relativo puro — path relativo em task `delegate_to: localhost` resolve contra o diretório do *playbook de entrada*, fragmentando o checkpoint por playbook (`./playbooks/.tmp/state/` vs `./services/x/playbooks/.tmp/state/`) em vez de ser um único estado por host.
- **Padrão de checkpoint estendido para `services/docker/playbooks/docker-install.yml`** (antes só em `site-first-deploy`/`ssh-spa-deploy`): knock SPA + `gather_facts: false` + `common/detect-connection` + checkpoint da role `docker-setup`. Sem isso o playbook travava em `Gathering Facts` contra hosts já SPA-gated, sem erro nenhum, até o timeout de 600s.
- **Gotcha genérico de checkpoint/`when` em qualquer playbook deste padrão**: `register: X` numa task com `when: false` ainda sobrescreve `X` com um dict "skipped" mínimo — nunca confiar que pular a task preserva o valor anterior. Corrigir com var temporário coletado incondicionalmente + `set_fact` condicional. E `defaults/main.yml` de uma role só carrega quando ela é de fato incluída — se `post_tasks`/templates fora da role dependem dessas vars, precisa de `include_vars` incondicional do `defaults/main.yml` da role.
- **`ufw_additional_services` (portas de banco) deve ser host-specific**, nunca em `group_vars/all` — só `host_vars/wfdb02/main.yml` (único host com banco nativo) declara isso agora.
- **`ssh_whitelist_ips_archaris`/`archyros` em `group_vars/all/security.yml`**: só IPs públicos reais (ex.: `177.11.48.73`) — faixas RFC1918 não têm rota até um VPS público, é lixo que só engana quem lê a config achando que restringe algo.

Detalhes completos, diagnóstico linha-a-linha dos logs e gotchas: `[[../daily/2026-09-15|2026-09-15]]`.
