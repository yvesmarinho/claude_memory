---
tags: [memory, infra]
aliases: [stack, infraestrutura]
created: 2026-08-03
updated: 2026-08-03
---

# Stack de infraestrutura administrada

- Bancos: MySQL, PostgreSQL, cluster Percona (MySQL e Postgres).
- Orquestração: Docker, Kubernetes, [[traefik]], Airflow, Ansible, Terraform.
- Observabilidade: Grafana, OpenSearch.
- Comunicação/CRM/automação: Asterisk, Chatwoot, Typebot, FlowiseAI, Botpress, N8N, Vtiger CRM community.
- Diretório/segurança: OpenLDAP, iptables, UFW.
- MCP `obsidian-rest` (pacote `mcp-obsidian`, até a v0.2.2 no PyPI) só conecta na porta `27124` (HTTPS) — porta fixa no código-fonte, sem suporte a `OBSIDIAN_PORT`/`OBSIDIAN_HOST` via env var. O vault `claude_memory` roda a Local REST API na porta `27125` (para não conflitar com outro vault na 27124) — por isso o MCP nunca alcança esse vault, mesmo com a API key correta. Acesso ao `claude_memory` deve ser feito por filesystem direto (`~/Documentos/DevOps/claude_memory/claude_memory/`), não via MCP.
