---
tags: [project, knowledge-harvester-library, khl, python, cli, click, pydantic, copilot-api]
aliases: [KHL]
created: 2026-08-10
updated: 2026-08-10
source: graphify-out/GRAPH_REPORT.md (commit e0ad84da, 4077 nodes, 5944 edges, 248 communities)
---

<!-- Criado em: 10/08/2026 13:26 -->
<!-- Modificado em: 10/08/2026 13:26 -->

# knowledge-harvester-library

O **knowledge-harvester-library (KHL)** é um agregador de conhecimento local em Python: escaneia repositórios Git forkados, extrai e sanitiza documentos (JSONL), identifica/clusteriza "agentes" (definições reutilizáveis do tipo agent.md) e compila/enriquece esses agentes com recursos relacionados (skills, prompts, instructions) via um cliente **GitHub Copilot API**. Exposto como CLI (`khl`) via **Click**, com comandos `build`, `update`, `search`, `list`, `export`, `diff`, `doc` (audit/generate). Modelos de domínio em **Pydantic** (`Document`, `AgentCluster`, `DocumentType`, `Repository`, `RepositoryState`, `ClusterMetadata`).

## Arquitetura (inferida do grafo)

- CLI (Click, `src/khl/cli/`) → Compiler/Scanner (application) → Models (domain, Pydantic) → Integrations/Writers (infrastructure: JSONL/JSON atomic writers, Copilot client, embedding cache).
- God nodes (mais conectados, núcleo do domínio): `Document` (162 edges), `AgentCluster` (104), `DocumentType` (100), `CopilotSynthesizer` (79), `ResourceAggregator` (68), `ClusterMetadata` (68), `CopilotClient` (64), `AgentWithResources` (60), `build()` (53), `FallbackClusteringStrategy` (52).
- **Ciclo de import conhecido**: `src/khl/models/__init__.py → cluster.py → document.py → __init__.py` (3 arquivos) — acoplamento estrutural na camada de modelos que provavelmente deveria ser resolvido com um módulo de tipos base compartilhado.

## Componentes centrais

- **CopilotClient/CopilotSynthesizer** — wrapper da API Copilot com `RateLimiter` (token bucket) e `CircuitBreaker` (CLOSED/OPEN/HALF_OPEN) para chamadas externas; `CopilotSynthesizer` sintetiza definições canônicas de agente a partir de variantes, deduplicando seções via `difflib.SequenceMatcher`.
- **Clustering de agentes**: estratégia híbrida em duas etapas — `HybridClusteringStrategy` (TF-IDF local + refinamento via Copilot) com fallback determinístico offline `FallbackClusteringStrategy` (regras, sem API) quando o circuit breaker abre ou a API falha (ADR-015).
- **ResourceAggregator** — associa `AgentCluster` a recursos relacionados (skills/prompts/instructions) via 3 métodos: cross-reference textual, co-ocorrência (mesmo repo/pasta) e overlap de ferramentas mencionadas.
- **SecurityAuditor/SanitizationPolicy** — sanitização de conteúdo (Constitution Principle II) com log de auditoria de eventos de redação de segredos, configurável via `objetivo.yaml`.
- **Writers atômicos** — `JSONLWriter`/`JSONWriter` com padrão atomic-write (write-then-rename) para `documents.jsonl`, `index.json`, `state.json`.
- **EmbeddingCache** — cache em disco para embeddings da API Copilot, evita recomputar em builds incrementais.

## Decisões arquiteturais/técnicas duráveis

- ADR-015: clustering híbrido (TF-IDF + LLM) em vez de só-LLM ou só-regras — reduz custo/latência de API mantendo qualidade quando a API está indisponível (fallback determinístico).
- `RepositoryState`/incremental scan: builds subsequentes reaproveitam estado por repositório (SHA comparado via GitPython) em vez de rescanear tudo.
- Sanitização de segredos é etapa obrigatória do pipeline de scan (não opcional), com trilha de auditoria própria (`SecurityAuditor`).

## Convenções/padrões adotados

- Testes fortemente segmentados por camada/feature: unit (ex. `TestCircuitBreakerInitialization`, `TestSecretPatterns`), integração (`test_search_command.py`, `TestEndToEndWorkflow` build→search), property-based via Hypothesis (`test_properties.py`).
- VCR (`test_copilot_vcr.py`, cassettes) para gravar/reproduzir respostas da API Copilot em testes, evitando chamadas reais.
- Documentação extensa em `docs/` (architecture, decisions/ADRs, guides, retrospectives, templates, debates) — projeto documenta decisões e sessões de forma consistente (múltiplas notas "Session Recovery"/"Final Status" por sessão de trabalho).

## Pendências / próximos passos conhecidos (do relatório de cobertura)

- Cobertura crítica (<50%): `src/khl/__main__.py` (0%), `src/khl/cli/update.py` (~14%), `src/khl/integrations/embeddings.py` (~24%), `src/khl/scanner/repo_scanner.py` (~38%), `src/khl/cli/build.py` (~53%).
- Ciclo de import em `src/khl/models/` (ver acima) ainda não resolvido.
