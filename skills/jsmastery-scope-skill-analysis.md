---
name: jsmastery-scope-skill-analysis
description: Análise técnica do skill "scope" (pacote jsmastery-skills) — validade, necessidade e escopo de instalação (global vs projeto). Ler ao decidir instalar/usar esse pacote de skills em algum repositório.
sources: [chat]
aliases: [scope skill, jsmastery-skills, agent skills scope]
tags: [claude-code, agent-skills, jsmastery-skills, devops]
---

# Análise: skill "scope" (jsmastery-skills)

Data da análise: 2026-09-17.
Localização real no disco (destino do symlink em `repos/jsmastery-skills`): `/home/yves_marinho/Documentos/DevOps/github_forks/jsmastery-skills/skills/scope`
Nota: `Projetos/knowledge-harvester-library/repos/jsmastery-skills` é apenas um symlink que aponta para esse caminho real.

## O que é

Pacote de Agent Skills (compatível com Claude Code e outros clientes, inclui adaptador `agents/openai.yaml` para Codex) para planejamento de produto/feature scoping. `/scope` transforma uma ideia em um plano vivo (`docs/scope/`), coarse, com fases, ordem de build e tiers de rigor (Prototype/Alpha/Beta/GA). Não escolhe stack/ferramentas (isso é trabalho do skill irmão `/architect`).

Estrutura: `SKILL.md` (regras gerais + dispatch), `modes/` (plan, replan, add, plan-greenfield, plan-brownfield, plan-monorepo), `approaches/` (4 personas de decomposição: tracer-bullet, skateboard, facade, journey), `scope-template.md` (formato de saída).

Faz parte de um pipeline maior no mesmo repo `jsmastery-skills/skills/`: `architect`, `audit`, `check`, `debug`, `develop`, `document`, `scope`, `sync`, `test` (9 skills no total, todos confirmados presentes).

## Validade estrutural — CONFIRMADA

- Frontmatter YAML válido (`name`, `allowed-tools`, `description`) seguindo a spec de Agent Skills.
- `allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion` — sem tools destrutivas ou de rede; escreve apenas em `docs/scope/` (ou `.workflow/scope/` se detectar site de docs publicado via mkdocs/docusaurus/vitepress/astro).
- Referências internas entre `SKILL.md` → `modes/*.md` → `approaches/*.md` → `scope-template.md` consistentes, sem links quebrados ou contradições.
- Desenhado para portabilidade multi-agente (seção "Portability" explícita: degrada para perguntas em texto puro quando não há picker interativo).
- Conclusão: skill bem escrito e internamente coerente.

## Necessidade — DEPENDE DO TIPO DE PROJETO

- `scope` é voltado a planejamento de **produtos com camada de aplicação/UI** (MVP, fases, user journeys, design system, capabilities tipo auth/billing/multi-tenant/SEO). Tecnologicamente agnóstico (nunca escolhe stack), mas conceitualmente pensado para apps/produtos, não para infraestrutura.
- NÃO se aplica a: scripts de automação, playbooks Ansible, configuração de Traefik/Grafana/OpenLDAP/Asterisk/Chatwoot/N8N, pipelines Airflow, hardening de firewall (Iptables/UFW), administração de cluster Percona/MySQL/PostgreSQL — ou seja, a maior parte do trabalho de infra/DevOps do usuário.
- É útil e necessário apenas nos projetos que são efetivamente "produto" com fases de feature e UI (ex.: portfolio-generator, linkedin-profile-yves, dashboards/frontends de ferramentas internas, um futuro SaaS).
- Só entrega valor completo junto com os 8 skills irmãos do pacote (sem eles, os comandos recomendados no relatório final, como `/architect` e `/develop`, ficam órfãos).

## Escopo recomendado: POR PROJETO, não global

Motivos:
1. Instalar globalmente (`~/.claude/skills/`) faria o Claude Code oferecer `/scope` em todo repositório, inclusive nos de infraestrutura pura, onde não se aplica (ruído/sugestões fora de contexto).
2. Depende dos skills irmãos do mesmo pacote para fazer sentido completo — melhor tratar o pacote inteiro (`scope` + `architect` + `audit` + `check` + `debug` + `develop` + `document` + `sync` + `test`) como uma instalação por projeto.
3. Recomendação prática: copiar (não symlink) o pacote para `.claude/skills/` apenas nos repositórios que são produtos reais com camada de aplicação. Promover para global só se o padrão de uso em 3+ projetos de produto justificar.

## Ação sugerida (ainda não executada)

Copiar `jsmastery-skills/skills/{scope,architect,audit,check,debug,develop,document,sync,test}` para `.claude/skills/` nos projetos de produto identificados, mantendo fora dos repositórios de infraestrutura/automação.
