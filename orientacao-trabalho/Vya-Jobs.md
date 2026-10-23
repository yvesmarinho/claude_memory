---
pasta: Vya-Jobs
caminho: /home/yves_marinho/Documentos/DevOps/Vya-Jobs
gerado_em: 2026-10-23T12:03:06-03:00
total_com_readme: 40
tags: [orientacao-trabalho]
---

# Vya-Jobs

Subpastas da raiz de `/home/yves_marinho/Documentos/DevOps/Vya-Jobs` que possuem README. Pastas sem README estão em `~/temp/pastas_sem_readme_*.json`.

| Nome | Resumo | Prioridade |
| ---- | ------ | ---------- |
| enterprise-agentics-knowledge-collaboration | README é template não preenchido (${PROJECT_ABOUT}…); objetivo real deve estar em objetivo.yaml/ROADMAP.md. |  |
| enterprise-ansible | Estrutura Ansible para VPS: provisionamento, hardening (SSH, UFW), logs, Cloudflare Zero Trust (tunnels, WARP), Docker. Status mai/2026: validação pendente do SSH SPA. |  |
| enterprise-applications-config | Configurações de aplicações da Vya.Digital por software: Azure TTS MRCP, Chatwoot, CPQD, GlusterFS, Ganesha, IPsec, monit, PMM2, ProFTPD, VyaCRM, YOURLS. |  |
| enterprise-backup | Backup corporativo MySQL/PostgreSQL com Percona XtraBackup, pgBackRest, BorgBackup e Ansible (Debian 12, 1 master + 2 slaves). |  |
| enterprise-chathoot-migration | Migração por merge entre instâncias Chatwoot (SOURCE→DEST) por account, com deduplicação por chave de negócio. |  |
| enterprise-consultor-ai | Desenvolvimento do novo produto consultor-ai (criado out/2026, só scaffold). |  |
| enterprise-database-docker | Casos enterprise de deploy de bancos em Docker (deploy.sh idempotente, volumes externos, PgBouncer, smoke tests). US-002 em wfdb02/wf008; US-001 em progresso. |  |
| enterprise-database-install | Suíte modular de instalação, migração, performance e monitoramento de MySQL 8.4 e PostgreSQL 16 (7 sub-projetos). |  |
| enterprise-database-migration | Sistema de migração PostgreSQL v4 em 3 fases (extração→geração→execução), validado na migração WF004→WFDB02 (39 usuários, 29 bases). |  |
| enterprise-database-tests | Framework de tuning MySQL 8.4 + PostgreSQL 16 no wfdb02 (kernel, memória, I/O, rede). README registra que o objetivo não foi alcançado. |  |
| enterprise-docker | Coleção de stacks docker-compose (Chatwoot, n8n, Traefik, Typebot, Flowise, Botpress, Airflow, Asterisk, Grafana/Prometheus…) e notas de volumes GlusterFS do Swarm. |  |
| enterprise-evo-crm-community | EVO CRM Community (Evolution API): plataforma open source de atendimento com IA; monorepo de submódulos (auth, CRM, agentes, frontend). v1.0.0-rc1. |  |
| enterprise-evolui-crm | Fork do wacrm: CRM self-hosted para WhatsApp (inbox compartilhada, contatos, pipelines Kanban, broadcasts, automações). Next.js + Supabase. |  |
| enterprise-hermes-agent | Projeto enterprise para automação com o agente Hermes (scaffold, jul/2026). |  |
| enterprise-infra-docker | Ferramentas Python + Ansible para publicar containers e diagnosticar/resolver problemas (MySQL, PostgreSQL) com templates compose. |  |
| enterprise-kubernets | K8S Audit & Validation Tool: auditoria de clusters (saúde, configs, redundância, CIS Benchmark). Fase 2 em desenvolvimento. |  |
| enterprise-kubernets-operation | (via CLUSTER_README.md) Documentação operacional do cluster K3S Vya.Digital: 4 nós, Traefik v3, Let's Encrypt, templates de deploy e troubleshooting. |  |
| enterprise-n8n-backup | Repositório de backup do n8n (credenciais e workflows). Atenção: guarda credenciais. |  |
| enterprise-n8n-workflow | Projeto de workflows do n8n (scaffold, jun/2026). |  |
| enterprise-node-journey-chat-flow | Journey Chat Flow: app Node 20 (yarn) na porta 3035, com Dockerfile/compose. |  |
| enterprise-observability | Stack de observabilidade (Prometheus/Loki/Grafana) no WFDB01: governança de logs, labels, Node Exporter, regras de alerta e scripts de validação. |  |
| enterprise-observability-dashboards | Templates e automação de dashboards Grafana (v1.7.0); stack Prometheus fica no enterprise-observability. |  |
| enterprise-pgbounc-dynamic-setup | PgBouncer Dynamic Setup v2.1 operacional: configuração dinâmica de PgBouncer com abordagem híbrida Shell+Python e deploy tar.gz com SHA256. |  |
| enterprise-php-site-corporativo | Site corporativo PHP (public_html). README só com o título. |  |
| enterprise-python-analysis | Análise de 4 servidores Docker + n8n para consolidação; identificou wf005 para desligamento (economia R$ 7,8–12,6 mil/ano). Concluído mar/2026. |  |
| enterprise-python-ansible | Projeto de automação Ansible com vault de credenciais, dados, hosts, playbooks e roles, parametrizado por variáveis de ambiente. |  |
| enterprise-python-backup | Vya BackupDB 2.0: backup/restore de MySQL, PostgreSQL e arquivos, multi-servidor, notificações, agendamento e métricas Prometheus (Spec Kit). |  |
| enterprise-python-n8n-backup | Módulo de backup/restore do n8n em Docker, plugin do enterprise-python-backup (namespace enterprise_backup.n8n). |  |
| enterprise-python-n8n-tunning | Analisa e aplica as ações propostas na análise de ambiente do n8n. |  |
| enterprise-python-snipetts | Snippets Python para problemas comuns (Redis, Postgres, Khomp, hash, diagnóstico de rede, ERD…). |  |
| enterprise-reverse-proxy | Repositório de configurações e CI/CD do reverse proxy (scaffold). |  |
| enterprise-seax-auto-vending | README documenta o template objetivo-init-minimal v2 (spec em camadas validada por JSON Schema antes do plano/código), não o produto SEAX em si. |  |
| enterprise-update-lab-n8n | Laboratório de upgrade sequencial do n8n (2.6.4 → mais recente) com gates GO/NO-GO, rollback e evidências, no wfdb01. |  |
| enterprise-vya_backupbd | vya_backupbd: backup/restore MySQL e PostgreSQL com dry-run e notificação por e-mail/Slack (README em UTF-16, título herdado de dialer.sys). |  |
| enterprise-workforce-vertical-agent | Plataforma jurídica multi-agent: upload de documentos, análise por agentes especialistas (advogados, peritos) e RAG (FastAPI + ChromaDB + OpenAI, React). |  |
| enterprise.dialer.sys | Sistema de discador (etc/usr/var + install_sys.sh). README só com o título (UTF-16). |  |
| enterprise.workforce | Ativos de bots (Botpress custom, Dialogflow, Rocket.Chat, flows). README vazio (2 bytes). |  |
| vya-repositorio | (via README.txt) Repositório de arquivos de configuração e scripts (kickstarts CentOS, OpenSIPS, monit, Zabbix) hospedado na Locaweb; .py renomeados para .txt. Contém id_rsa — revisar. |  |
| vya_backupbd | Gerador de código de backup por servidor com agendamento por dia/horário, senhas codificadas e testes (MySQL/PostgreSQL). |  |
| vya_global | Biblioteca de funções Python reutilizáveis da Vya.Digital (2021): conversão de bytes, criação de pastas, download, FTP etc. |  |
