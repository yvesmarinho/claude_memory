---
tags: [moc, index]
created: 2026-08-03
updated: 2026-09-24
---

<!-- Modificado em: 24/09/2026 16:56 -->

# 00 — Índice mestre (Map of Content)

Ponto de entrada da memória. Consulte antes de responder.

## Memória

- [[profile]] — quem sou e no que trabalho
- [[preferences]] — como quero que o Claude se comporte
- [[infra-stack]] — stack de infraestrutura que administro
- [[bug-freeze-nouveau-2026-09-12]] — freeze de GPU (nouveau) em home016, corrigido com driver NVIDIA (GPU substituída depois por AMD RX 580, ver [[2026-09-19]])

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
- [[praxisforge]] — curadoria e engenharia de agentes para Claude (agentic AI), skills/templates e fontes com proveniência
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
- [[2026-09-18]] — praxisforge: objetivo-init atualizado para usar o vault Obsidian (daily/ para sessões, projects/ para o projeto)
- [[2026-09-21]] — praxisforge: correção do CI, pyproject com uv e planejamento completo da feature 001 (PR #10)
- [[2026-09-19]] — home016: troca de GPU NVIDIA GT 740 → AMD RX 580 (amdgpu/Mesa), driver NVIDIA removido e estado validado
- [[2026-09-22]] — praxisforge: implementação completa da feature 001-registro-pastas-curadoria (73 tarefas TDD, 187 testes, cobertura 96%)
- [[2026-09-23]] — praxisforge: features 004 (detecção de mudança via git, PR #14) e 005 (caminho absoluto no registro, constituição v2.0.0)
- [[2026-09-24]] — praxisforge: CI do PR #15, features 006 (política de licença), 007 (registro fora do repo) e 008 (biblioteca de skills)
- [[2026-09-25]] — praxisforge: PRs #20–#24, debate da curadoria automatizada, constituição v4.0.0, features 009 (acervo library/, PR #26) e 010 (inventário de curadoria, PR #27)
