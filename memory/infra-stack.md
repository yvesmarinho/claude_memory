---
tags: [memory, infra]
aliases: [stack, infraestrutura]
created: 2026-08-03
updated: 2026-09-19
---

<!-- Modificado em: 19/09/2026 10:34 -->

# Stack de infraestrutura administrada

- Bancos: MySQL, PostgreSQL, cluster Percona (MySQL e Postgres).
- Orquestração: Docker, Kubernetes, [[traefik]], Airflow, Ansible, Terraform.
- Observabilidade: Grafana, OpenSearch.
- Comunicação/CRM/automação: Asterisk, Chatwoot, Typebot, FlowiseAI, Botpress, N8N, Vtiger CRM community.
- Diretório/segurança: OpenLDAP, iptables, UFW.
- MCP `obsidian-rest` (pacote `mcp-obsidian`, até a v0.2.2 no PyPI) só conecta na porta `27124` (HTTPS) — porta fixa no código-fonte, sem suporte a `OBSIDIAN_PORT`/`OBSIDIAN_HOST` via env var. O vault `claude_memory` roda a Local REST API na porta `27125` (para não conflitar com outro vault na 27124) — por isso o MCP nunca alcança esse vault, mesmo com a API key correta. Acesso ao `claude_memory` deve ser feito por filesystem direto (`~/Documentos/DevOps/claude_memory/claude_memory/`), não via MCP.
- Servidores Postgres administrados: `home011` (LAN, `192.168.15.196`, usuário `postgres`, sem PgBouncer — usado como ambiente de referência para aplicar migrations "limpas") e `wfdb02` (VPS Contabo, IP público `82.197.64.145` / hostname `vmi1334319.contaboserver.net`, Postgres 16.x atrás de PgBouncer em modo transaction pooling). Fluxo padrão: migrar em `home011` → `pg_dump`/`pg_restore` para `wfdb02` (produção), evitando rodar migrations diretamente contra o PgBouncer.
- PgBouncer em transaction pooling não suporta `pg_advisory_lock` nem prepared statements entre transações — ferramentas de migration que dependem disso (ex.: `golang-migrate`) travam mesmo sem nada a migrar. Workaround: aplicar/checar via script Python direto (psycopg2), sem passar pelo PgBouncer, ou pular a etapa de migrate automática no entrypoint do serviço.
- `pg_dump`/`pg_restore`: a versão do cliente importa mais que a do servidor-alvo. Um dump gerado por `pg_dump` 17.x (formato custom, `-Fc`) não pode ser lido por `pg_restore` 16.x (`unsupported version (1.16) in file header`) — falha total ou, pior, silenciosa em parte das tabelas se o restore "continuar em erro". Solução: rodar `pg_dump`/`pg_restore` via `docker run postgres:17-alpine ...` para casar a versão do arquivo, independente da versão instalada localmente ou da versão do servidor Postgres de destino (restaurar um dump PG17 num servidor PG16 funciona normalmente, desde que o *cliente* pg_restore seja >= versão do dump).
- Máquina `home016` (desktop de trabalho) teve a GPU trocada em 19/09/2026: NVIDIA GeForce GT 740 → **AMD Radeon RX 580 2048SP (Polaris 20)**. Driver NVIDIA 470-server removido (`apt purge` dos pacotes `*nvidia*470*`, autoremove e `update-initramfs -u`); AMD usa o `amdgpu` do kernel + Mesa (RADV/radeonsi), sem driver proprietário. Validado: `Kernel driver in use: amdgpu`, OpenGL 4.6 `radeonsi`, Vulkan `RADV POLARIS10`, VA-API ok, sem módulos nvidia/nouveau. O histórico abaixo refere-se à GPU NVIDIA anterior.
- Histórico (GPU NVIDIA GT 740, já substituída): `home016` sofreu congelamento total do desktop em 12/09/2026 por hang da engine gráfica do driver livre `nouveau` (mesmo com `nvidia_drm.modeset=1` na cmdline do kernel), disparado pelo GStreamer (`gst-plugin-scan`). Corrigido no mesmo dia: driver trocado para o **proprietário NVIDIA** e validado após reboot (`lspci -k` mostra `Kernel driver in use: nvidia`, `nvidia-smi` responde). Detalhes completos em [[bug-freeze-nouveau-2026-09-12]].
