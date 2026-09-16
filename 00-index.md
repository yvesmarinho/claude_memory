---
tags: [moc, index]
created: 2026-08-03
updated: 2026-09-15
---

<!-- Modificado em: 15/09/2026 -->

# 00 — Índice mestre (Map of Content)

Ponto de entrada da memória. Consulte antes de responder.

## Memória

- [[profile]] — quem sou e no que trabalho
- [[preferences]] — como quero que o Claude se comporte
- [[infra-stack]] — stack de infraestrutura que administro
- [[bug-freeze-nouveau-2026-09-12]] — freeze de GPU (nouveau) em home016, corrigido com driver NVIDIA

## Projetos

- [[enterprise-evolui-crm]] — CRM WhatsApp (Next.js/Supabase), fork de wacrm
- [[enterprise-evo-crm-community]] — CRM community (Rails/Go/Python), deploy home011→wfdb02
- [[enterprise-observability]] — stack Prometheus/Grafana/Loki em produção (wfdb01)
- [[mnemosine]] — reorganização do vault Obsidian worldmind-vault
- [[scaffold-project]] — scaffold Python de bootstrap de projetos (repo yvesmarinho/scaffold-project, ex-default-project)
- [[cmdb-platform]] — CMDB Flask-AppBuilder + inventário via Ansible
- [[enterprise-hermes-agent]] — stack Docker do Hermes Agent (bots WhatsApp/IA)
- [[enterprise-n8n-workflow]] — gestão de e-mail via n8n (reescrita v2)
- [[email-auto-manager]] — gestão de e-mail via n8n (versão legada, ver enterprise-n8n-workflow)
- [[linkedin-profile-yves]] — geração automatizada de conteúdo para perfil LinkedIn
- [[claude-code-config]] — configuração/hooks do ambiente Claude Code global (~/.claude)
- [[skill-doc-python]] — skill de documentação de código Python (Sphinx/RST)
- [[skill-grill-with-docs]] — skill de interrogatório de planos/PRs/docs
- [[local-bin-scripts]] — scripts CLI pessoais em ~/.local/bin
- [[conky]] — config do monitor de sistema Conky (desktop)
- [[portfolio-generator]] — CLI de scan/geração de portfólio de projetos, com descrição via README/IA
- [[enterprise-ansible]] — automação Ansible da frota VPS (hardening, SSH SPA fwknop, ZTA, inventário)
- [[indice-vya-jobs]] — índice das pastas de projeto em ~/DevOps/Vya-Jobs/ (descrição, lastchange, status)
- [[knowledge-harvester-library]] — agregador de conhecimento local (CLI `khl`, clustering de agentes via GitHub Copilot API)
- [[buzzclubhub]] — SPA de gestão para agência de influência (React/Supabase), refatoração/hardening em andamento
- [[devops-containers]] — central de configs de containers/Dockerfiles/Compose (containers/, Traefik v3.7, modelo-traefik)
<!-- adicione links para projects/*.md conforme forem criados -->

## Diárias

- [[2026-08-03]] — importação de histórico de sessões + triagem de ~/Documentos/DevOps/
- [[2026-08-11]] — ajuste do Conky (campos de hardware CPU/GPU/placa-mãe, remoção de bateria)
- [[2026-08-21]] — portfolio-generator: lint/type quebrados corrigidos, auditoria e correção de qualidade das descrições, PR #7
- [[2026-08-26]] — enterprise-ansible: pendências da refatoração services/, feature 006 (inventário read-only), knock fwknop automático, config Claude versionada
- [[2026-09-03]] — buzzclubhub: bug report RLS (import de jornalistas), ambiente DEV local, T053 cobertura de hooks 0→96%
- [[2026-09-12]] — home016: freeze de vídeo por driver nouveau diagnosticado e corrigido, driver NVIDIA validado pós-reboot
<!-- daily/YYYY-MM-DD.md -->
- [[2026-09-14]] — enterprise-ansible: onboarding do host buzzclub-srvr001 (auto-detecção de conexão, checkpoint de execução)
- [[2026-09-15]] — enterprise-ansible: correções de UFW/fwknop (policy allow indevido) e checkpoint em docker-install.yml, PR #5; devops-containers: estrutura de containers e revisão de segurança do Traefik
