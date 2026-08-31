---
tags: [project, knowledge-harvester-library, khl, python, cli, click, pydantic, copilot-api]
aliases: [KHL]
created: 2026-08-10
updated: 2026-08-31
source: graphify-out/GRAPH_REPORT.md (commit e0ad84da, 4077 nodes / 248 comm.) + reexecução 31/08 (commit 5500909d, 4130 nodes, 5634 edges, 293 comm.)
---

<!-- Criado em: 10/08/2026 13:26 -->
<!-- Modificado em: 31/08/2026 09:14 -->

# knowledge-harvester-library

O **knowledge-harvester-library (KHL)** é um agregador de conhecimento local em Python: escaneia repositórios Git forkados, extrai e sanitiza documentos (JSONL), identifica/clusteriza "agentes" (definições reutilizáveis do tipo agent.md) e compila/enriquece esses agentes com recursos relacionados (skills, prompts, instructions) via um cliente **GitHub Copilot API**. Exposto como CLI (`khl`) via **Click**, com comandos `build`, `update`, `search`, `list`, `export`, `diff`, `doc` (audit/generate). Modelos de domínio em **Pydantic** (`Document`, `AgentCluster`, `DocumentType`, `Repository`, `RepositoryState`, `ClusterMetadata`).

## Arquitetura (inferida do grafo)

- CLI (Click, `src/khl/cli/`) → Compiler/Scanner (application) → Models (domain, Pydantic) → Integrations/Writers (infrastructure: JSONL/JSON atomic writers, Copilot client, embedding cache).
- God nodes (reexecução 31/08, commit 5500909d): `Document` (98), `CopilotSynthesizer` (74), `ResourceAggregator` (68), `DocumentType` (59), `AgentCluster` (58), `build()` (53), `AgentIdentifier` (47), `CopilotClient` (47), `FallbackClusteringStrategy` (45), `CircuitBreaker` (40). (contagem de edges caiu vs. leitura de 10/08 — o grafo passou a extrair só código, sem enriquecimento LLM.)
- **Ciclo de import conhecido**: `src/khl/models/__init__.py → cluster.py → document.py → __init__.py` (3 arquivos) — acoplamento estrutural na camada de modelos que provavelmente deveria ser resolvido com um módulo de tipos base compartilhado.

## Componentes centrais

- **CopilotClient/CopilotSynthesizer** — wrapper da API Copilot com `RateLimiter` (token bucket) e `CircuitBreaker` (CLOSED/OPEN/HALF_OPEN) para chamadas externas; `CopilotSynthesizer` sintetiza definições canônicas de agente a partir de variantes, deduplicando seções via `difflib.SequenceMatcher`.
- **Clustering de agentes**: estratégia híbrida em duas etapas — `HybridClusteringStrategy` (TF-IDF local + refinamento via Copilot) com fallback determinístico offline `FallbackClusteringStrategy` (regras, sem API) quando o circuit breaker abre ou a API falha (ADR-015).
- **ResourceAggregator** — associa `AgentCluster` a recursos relacionados (skills/prompts/instructions) via 3 métodos: cross-reference textual, co-ocorrência (mesmo repo/pasta) e overlap de ferramentas mencionadas.
- **SecurityAuditor/SanitizationPolicy** — sanitização de conteúdo (Constitution Principle II) com log de auditoria de eventos de redação de segredos, configurável via `objetivo.yaml`.
- **Writers atômicos** — `JSONLWriter`/`JSONWriter` com padrão atomic-write (write-then-rename) para `documents.jsonl`, `index.json`, `state.json`.
- **EmbeddingCache** — cache em disco para embeddings da API Copilot, evita recomputar em builds incrementais.
- **AgentIdentifier** — orquestra a identificação de agentes (varre documentos `agent.md`, aplica a estratégia de clustering, produz `AgentCluster`); virou god node na reexecução de 31/08.
- **HallucinationValidator** (`src/khl/...`, community própria de 46 nós) — validação anti-alucinação da síntese de agentes (Constitution P0): compara conteúdo sintetizado com as fontes, detecta termos novos e entidades nomeadas ausentes das fontes (spaCy NER, degrada sem o modelo instalado) e mede similaridade via cosseno TF-IDF; retorna `HallucinationValidationResult`. Testes dedicados: `test_p0_validation.py`, `TestHallucinationValidatorInitialization`, `TestNovelTermsDetection`.
- **CompiledAgent** (Pydantic, `models/`) — modelo do agente sintetizado/compilado final, com métricas de deduplicação (nº de variantes-fonte, word count sintetizado vs. total das fontes, ratio de compressão) e `SourceVariant` por documento contribuinte. Distinto de `AgentCluster` (agrupamento) — é o produto de saída.
- **`khl doc`** (audit/generate) — skill de documentação integrada ao CLI: `khl doc audit` (enforce de threshold de cobertura de docstrings, saída JSON) e `khl doc generate`; scripts `audit-docs.py`/`generate-docstrings.py`, config `docstring-config.yaml` (formato restructuredtext).

## Decisões arquiteturais/técnicas duráveis

- ADR-015: clustering híbrido (TF-IDF + LLM) em vez de só-LLM ou só-regras — reduz custo/latência de API mantendo qualidade quando a API está indisponível (fallback determinístico).
- `RepositoryState`/incremental scan: builds subsequentes reaproveitam estado por repositório (SHA comparado via GitPython) em vez de rescanear tudo.
- Sanitização de segredos é etapa obrigatória do pipeline de scan (não opcional), com trilha de auditoria própria (`SecurityAuditor`).
- Validação anti-alucinação (`HallucinationValidator`) é gate P0 da síntese de agentes — conteúdo sintetizado que introduz termos/entidades fora das fontes é reprovado.

## Convenções/padrões adotados

- Testes fortemente segmentados por camada/feature: unit (ex. `TestCircuitBreakerInitialization`, `TestSecretPatterns`), integração (`test_search_command.py`, `TestEndToEndWorkflow` build→search), property-based via Hypothesis (`test_properties.py`).
- VCR (`test_copilot_vcr.py`, cassettes) para gravar/reproduzir respostas da API Copilot em testes, evitando chamadas reais.
- Documentação extensa em `docs/` (architecture, decisions/ADRs, guides, retrospectives, templates, debates) — projeto documenta decisões e sessões de forma consistente (múltiplas notas "Session Recovery"/"Final Status" por sessão de trabalho).

## Pendências / próximos passos conhecidos (do relatório de cobertura)

- Cobertura crítica (<50%): `src/khl/__main__.py` (0%), `src/khl/cli/update.py` (~14%), `src/khl/integrations/embeddings.py` (~24%), `src/khl/scanner/repo_scanner.py` (~38%), `src/khl/cli/build.py` (~53%).
- Ciclo de import em `src/khl/models/` (`__init__.py → cluster.py → document.py → __init__.py`) **ainda presente** na reexecução de 31/08.

## Trabalho recente (branch `chore-vscode-activate-env`, ago/2026)

- Commit `9edec8c`: ativação automática do ambiente Python no terminal integrado do VS Code.
- Commit `5500909`: config de tooling do graphify + índice do projeto; `graphify-out/` gerado adicionado ao `.gitignore`.
- Novo `scripts/orchestrate_graphify_scan.py` (community própria no grafo, 50 nós) — orquestrador que descobre repos, roda graphify com checkpoint (`tmp/graphify_scan_state.json`), sintetiza via Ollama (`call_ollama`, `build_synthesis_prompt`), lê segredos com `load_secrets`. Ainda não commitado.
- `feat(session-manager)` (`14c11ff`): persistência de memória MCP no workflow `end.session`.
