<!--
Criado em: 26/08/2026 09:40
Modificado em: 28/08/2026 12:17
-->
---
tags: [indice, vya-jobs, projetos]
aliases: [Índice Vya-Jobs, Projetos Vya-Jobs]
created: 2026-08-26
updated: 2026-08-26
---

> Removidas do índice (pastas apagadas do disco): `enterprise-python-backup.backup-20260130-092642`, `enterprise-python-n8n-collector`, `enterprise-treafik-test`, `enterprise-observability-main-sync`.
> Movida para fora de Vya-Jobs (2026-08-28): `a-default-project` → `~/Documentos/DevOps/Projetos/scaffold-project` (repo renomeado para `yvesmarinho/scaffold-project`; ver [[scaffold-project]]).

# Índice de Projetos — ~/DevOps/Vya-Jobs/

Índice das pastas de projeto em `~/DevOps/Vya-Jobs/`.

- **nome** — nome da pasta do projeto
- **descrição** — resumo do `README.md`
- **lastchange** — data do último commit (`git log -1`); `mtime` quando não há repositório git
- **status** — preenchimento manual

| nome                                        | descrição                                                                                                                                | lastchange         | status  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------- |
| docker-swarm                                | Artefatos de configuração de cluster Docker Swarm (sem README)                                                                           | 2025-08-30 (mtime) | init    |
| enterprise-agentics-knowledge-collaboration | Projeto de colaboração de conhecimento com agentes (README ainda em template/placeholders)                                               | 2025-09-08         | stag    |
| enterprise-ansible                          | Estrutura Ansible para automação de VPS — provisionamento, hardening, Cloudflare Zero Trust Access, SSH SPA                              | 2026-08-07         | active  |
| enterprise-applications-config              | Configurações específicas de aplicações/serviços da infra Vya.Digital (scripts de instalação e docs por software)                        | 2026-02-12         | stag    |
| enterprise-backup                           | Sistema corporativo de backup para MySQL e PostgreSQL com automação via Ansible                                                          | 2025-10-02         | stag    |
| enterprise-chathoot-migration               | Migração por merge de dados entre instâncias do Chatwoot com deduplicação por chave de negócio (Python)                                  | 2026-06-01         | complet |
| enterprise-chathoot-migration.worktrees     | Worktrees auxiliares do projeto enterprise-chathoot-migration (sem README)                                                               | 2026-05-28 (mtime) | stag    |
| enterprise-database-docker                  | Coleção de casos de uso enterprise para deploy de bancos de dados em Docker (receitas testadas, production-ready)                        | 2026-04-06         | complet |
| enterprise-database-install                 | Suite modular para instalação, migração, teste de performance e monitoramento de MySQL 8.4 e PostgreSQL 16                               | 2026-04-02         | complet |
| enterprise-database-migration               | Sistema de migração PostgreSQL v4.0.0, validado na migração WF004→WFDB02 (CLI + orquestrador)                                            | 2026-04-07         | stag    |
| enterprise-database-tests                   | Framework de tuning de performance para MySQL 8.4 + PostgreSQL 16 simultâneos no wfdb02 (objetivo não alcançado)                         | 2026-06-09         | stag    |
| enterprise.dialer.sys                       | Sistema de discador (dialer) enterprise (README mínimo)                                                                                  | 2024-12-17         | stag    |
| enterprise-docker                           | Projetos Docker e pastas compartilhadas nos servidores Docker Swarm (/mnt/gfs/)                                                          | 2026-06-11         | active  |
| enterprise-evo-crm-community                | EVO CRM Community — plataforma open-source single-tenant de atendimento com IA (Rails/Go/Python)                                         | 2026-08-20         | active  |
| enterprise-evolui-crm                       | wacrm — template de CRM self-hostable para WhatsApp (inbox compartilhada, contatos, pipelines, automações)                               | 2026-07-22         | active  |
| enterprise-hermes-agent                     | Automação enterprise com o agente Hermes (stack Docker, bots WhatsApp/IA), Python                                                        | 2026-08-04         | active  |
| enterprise-infra-docker                     | Ferramentas e playbooks (Python + Ansible) para diagnóstico e resolução de problemas em publicações Docker                               | 2026-03-16         | stag    |
| enterprise-kubernets                        | K8S Audit & Validation Tool — auditoria e validação de clusters K8S alinhada ao CIS Kubernetes Benchmark                                 | 2026-02-19         | stag    |
| enterprise-kubernets-operation              | Operação de clusters Kubernetes (sem README)                                                                                             | 2025-11-17 (mtime) | stag    |
| enterprise-n8n-backup                       | Repositório de backup do N8N — credenciais e workflows                                                                                   | 2026-01-23         | stag    |
| enterprise-n8n-workflow                     | Projeto de workflows do N8N (gestão de e-mail, Python)                                                                                   | 2026-07-31         | stag    |
| enterprise-node-journey-chat-flow           | Journey Chat Flow — fluxo de chat/jornada em Node (README mínimo)                                                                        | 2024-09-25         | stag    |
| enterprise-observability                    | Stack de observabilidade enterprise (Prometheus/Grafana/Loki) em produção no WFDB01, com governança de logs                              | 2026-07-03         | active  |
| enterprise-observability-dashboards         | Sistema de templates de dashboards Grafana com automação para monitoramento multi-tecnologia (v1.7.0)                                    | 2026-06-26         | active  |
| enterprise-pgbounc-dynamic-setup            | Enterprise PgBouncer Dynamic Setup v2.1 — configuração dinâmica de pooling PostgreSQL (operacional)                                      | 2025-10-10         | stag    |
| enterprise-php-site-corporativo             | Site corporativo em PHP (README mínimo)                                                                                                  | 2024-12-16         | stag    |
| enterprise-python-analysis                  | Análise técnica de 4 servidores Docker em produção para consolidação e redução de custos (N8N monitoring)                                | 2026-04-02         | active  |
| enterprise-python-ansible                   | Projeto Python para automação de tarefas com Ansible e ansible-vault                                                                     | 2025-07-17         | active  |
| enterprise-python-backup                    | Vya BackupDB — backup/restore automatizado de MySQL, PostgreSQL e arquivos/diretórios (v2.0.0, Python 3.12+)                             | 2026-02-13         | stag    |
| enterprise-python-n8n-backup                | Módulo especializado de backup/restore para N8N (namespace enterprise_backup.n8n), submódulo de enterprise-python-backup                 | 2026-01-27         | stag    |
| enterprise-python-n8n-tunning               | Projeto para analisar e aplicar as ações propostas na análise do ambiente N8N (Python)                                                   | 2026-05-21         | stag    |
| enterprise-python-snipetts                  | Coleção de snippets Python para problemas comuns                                                                                         | 2026-04-27         | active  |
| enterprise-reverse-proxy                    | Repositório de configurações e CI/CD de reverse proxy (infra, Python)                                                                    | 2026-06-25         | stag    |
| enterprise-update-lab-n8n                   | Laboratório para planejar, validar e executar atualizações seguras do n8n (SDD, governança de risco, rollback)                           | 2026-05-08         | active  |
| enterprise-vya_backupbd                     | vya_backupbd — sistema de backup e restore para MySQL e PostgreSQL (instalação via symlink em /usr/local/bin)                            | 2025-03-24         | stag    |
| enterprise.workforce                        | Projeto enterprise.workforce (README vazio)                                                                                              | 2026-01-26         | stag    |
| enterprise-workforce-vertical-agent         | Plataforma jurídica multi-agent — processamento de documentos, análise por especialistas de IA, RAG vetorial                             | 2025-12-12         | stag    |
| vya_backupbd                                | VYA Backup Database — template para geração de código de backup por servidor, com agendamento inteligente                                | 2025-12-23         | stag    |
| vya_global                                  | Biblioteca com as funções Python mais utilizadas da Vya.Digital (desde 2021)                                                             | 2025-08-30 (mtime) | stag    |
| vya-repositorio                             | Repositório Vya Digital / Locaweb — scripts `.py` renomeados para `.txt` por limitação de download da Locaweb                            | 2025-08-30 (mtime) | stag    |
