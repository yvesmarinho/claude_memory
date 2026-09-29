---
tags: [project, consulta-ai-ia-br, novo-produto, sdd, ia, multi-tenancy, claude]
aliases: [consulta-ai-ia-br, Novo produto]
created: 2026-09-28
updated: 2026-09-28
---

<!-- Criado em: 28/09/2026 12:31 -->
<!-- Modificado em: 28/09/2026 12:31 -->

# consulta-ai-ia-br

Produto de automação com IA baseado em spec-driven development (SDD), em fase de descoberta. Projeto "Novo produto" no Claude.

## Visão geral

- Automação com IA, on-premise e cloud, baseada em spec-driven development.
- Público: leigos em especificação, com demandas de qualquer tamanho.
- Interface inicial: um consultor que debate cada etapa até ter a especificação completa.
- Owner: Yves Marinho, com agentes de IA (ASM-10).
- Status: descoberta (questionário v1 aberto, 🔴 bloqueantes pendentes).

## Hipótese central

- A saída do consultor é um `objetivo-init` v2 válido (gate `spec_validation`), com perfis por porte P/M/G.
- Relação com o [[praxisforge]] ainda em aberto (pergunta A-01).

## Artefatos

- `questionario-descoberta-v1.md`: 166 perguntas (55 bloqueantes 🔴), blocos A–O mapeados ao schema `objetivo-init` v2, com linha **Resposta:** em cada pergunta. Cópia em `raw/questionario-descoberta-v1.md` neste vault.
- Base: `objetivo-init-schema-v2.json` e `proposta-atualizacao-objetivo-init.md` (ver [[objetivo-init-minimal-readme]]).

## Decisões

- **H-04 · Multi-tenancy na cloud (VPS + Docker)** — modelo híbrido:
  - Padrão *pool*: app e PostgreSQL compartilhados, isolamento por `tenant_id` + Row-Level Security (`SET app.tenant_id` por transação; usuário da app ≠ dono das tabelas ou `FORCE ROW LEVEL SECURITY`).
  - Mesmo isolamento em pgvector, Redis/fila (prefixo `t:{tenant_id}:`), MinIO/S3 (prefixo), Traefik (subdomínio por tenant), limites de tokens por tenant e `tenant_id` obrigatório no log.
  - Enterprise: *silo* com stack compose ou VPS dedicada, mesma imagem (mesmo artefato do on-premise).
  - Evitar: schema por tenant; banco por tenant no mesmo servidor.

## Premissas padrão (valem se não forem respondidas)

- ASM-01: saída = `objetivo-init` v2 por porte.
- ASM-02: o MVP só especifica (não executa).
- ASM-03: MVP em cloud; on-premise na fase 2.
- ASM-04: público PMEs/analistas, pt-BR.
- ASM-05: Python + PostgreSQL/pgvector + Traefik + Grafana (ver [[infra-stack]], [[devops-containers]]).
- ASM-06: IA via adapter; híbrido no on-premise.
- ASM-07: gate = spec-lint + revisão por IA.
- ASM-08: efeito externo exige aprovação humana.
- ASM-09: sem treino com dados do cliente sem opt-in.
- ASM-10: equipe = Yves + agentes de IA.

## Próximos passos

1. Responder os 🔴 dos blocos A, B, C, D, E e M.
2. Consolidar as respostas no `objetivo-init` v2 do produto.
3. Rodar o gate (check-jsonschema + revisão ISO/IEC/IEEE 29148) e listar lacunas.

## Sessões

- [[2026-09-28]] — questionário de descoberta, decisão H-04, premissas ASM-01..10.
