---
tags: [project, praxisforge, agentic-ai, claude, python]
aliases: [PraxisForge]
created: 2026-09-18
updated: 2026-09-21
---

<!-- Criado em: 18/09/2026 16:50 -->
<!-- Modificado em: 21/09/2026 17:05 -->

# PraxisForge

Curadoria e engenharia de agentes para Claude — pesquisa, síntese e refino contínuo de conhecimento aplicado ao desenvolvimento de agentic AI.

## Visão geral

- Repositório local: `~/Documentos/DevOps/Projetos/praxisforge` (Python 3.12+, `uv`, scaffold criado em 18/09/2026).
- Owner: Yves Marinho (projeto individual, sem RBAC por ora).
- Rascunho do objetivo: `objetivo-init-praxisforge.md` (na raiz do projeto, versão final aprovada em 18/09/2026; PR #1).

## Objetivos

- Curar e consolidar fontes de conhecimento sobre engenharia de agentes e agentic AI aplicada ao Claude.
- Manter biblioteca de skills, padrões e templates de agentes reutilizáveis e versionados.
- Documentar boas práticas de engenharia de agentes (arquitetura, prompts, avaliação, observabilidade).

## Decisões

- Arquitetura: camadas + casos de uso (Presentation/CLI → Application → Domain → Infrastructure), DDD leve; portas/adapters só onde há integração externa. Exceções específicas (nunca `BaseException`), Python 3.12+, `ruff format` (sem black), ADRs em `docs/decisions/`, pre-commit com GitGuardian.
- Dependências-chave: pyyaml, pydantic, jsonschema, requests, pytest, ruff, mypy; provider de IA atrás de interface (SDK Anthropic como 1º adapter).
- Ciclo de curadoria mensal, com revisão registrada em `daily/`; critério de sucesso: ≥ 95% das skills/agentes publicados aprovados na validação.
- Toda informação persistente (sessão e projeto) vive no vault Obsidian `claude_memory`: sessões em `daily/`, projeto em `projects/` — não mais em `docs/SESSIONS/`.
- Qualidade: ruff, mypy, pytest com cobertura mínima 90%, gates bloqueantes no CI.
- Proveniência obrigatória para toda fonte curada (origem, data, licença).
- Biblioteca de skills: fonte de verdade em `skills/` no repo (versionada em git, com CI/lint); o vault não guarda cópias das skills, apenas catálogo neste arquivo e templates/guias em `skills/` do vault.
- Skills chegam a outros projetos via `scripts/publish-skills` (repo → `~/.claude/skills/` global ou `.claude/skills/` do projeto, cópia/symlink idempotente).

- Fontes curadas: registro versionado em `src/data/sources/<categoria>/<slug>.md` no repo (proveniência + relevância + notas/extratos); material bruto fica fora do repo em `~/DevOps/github_forks` (forks de repositórios), referenciado por `alias` com caminho resolvido por config/variável de ambiente. Licença validada por fonte (campo `license` obrigatório; sem licença = status "pendente", sem extrato copiado).

- O projeto mantém uma base de dados das pastas que contêm informações a serem curadas (caminho, descrição, tipo, licença, última varredura, status de curadoria). Armazenamento em YAML versionado no repo em `src/data/folders.yaml`, validado por schema versionado (`schemas/folders-schema-v1.json`); `schema_version` obrigatório em JSON, YAML e frontmatter. Catálogo de skills também em `skills/README.md` no repo.

## Catálogo de skills

- (vazio — registrar aqui nome, propósito, versão e caminho no repo de cada skill criada)

## Pendências

- CI corrigido e mergeado (PRs #7, #9): regex de branch aceita `tipo-desc`/`NNN-desc`/`dependabot/*`, CodeQL só Python, TruffleHog pulado em push na `main`, Validation Summary aceita PR title `skipped`. `pyproject.toml`/`uv.lock` mergeados (PR #8). PRs do Dependabot (#2, #3, #4, #6) resolvidos.
- PR #10 aberto (`001-registro-pastas-curadoria` → `main`): só documentação (spec, plano, tasks) da feature 001; aguardando merge.
- Feature 001 pronta para `/speckit-implement`; MVP = US1 (T001–T040).
- Dívida: `scripts/` do scaffold tem 472 violações de ruff (257 `print`) e está excluído do gate até ser refatorado.
- Catálogo de skills continua vazio; varredura das pastas (inclui detectar mesma pasta física sob dois aliases) fica para a feature 002.

## Feature 001 — registro-pastas-curadoria (planejada em 21/09/2026)

- Spec em `specs/001-registro-pastas-curadoria/` (repo): 4 user stories, 17 FR, 7 SC, 3 clarificações; `tasks.md` com 73 tarefas em ordem TDD.
- Decisões: Domain só com stdlib (pydantic na fronteira); validação em 2 etapas (JSON Schema + invariantes); alias só minúsculo com env `PRAXISFORGE_FOLDER_<ALIAS>`; escrita atômica do YAML sem preservar comentários; `update` aceita status, última varredura e licença (atômico); arquivo do registro ausente é erro (só `add` cria); link simbólico seguido e destino real validado; camadas verificadas por teste AST; CLI `argparse` (`folders add|list|show|update|validate|resolve`, `sources validate`).
- Armadilhas descobertas: `yaml.safe_load` converte datas em `datetime`/`date` (usar loader sem timestamp); `format: date-time` exige `jsonschema[format]`; `github_forks` nasce `unknown`/`pending`.
- Gates da constituição incluídos na feature: `bandit`, `safety` (`make security`), `.pre-commit-config.yaml` manual e workflow `quality-gates.yml`.

## Próxima sessão

- Ponto de partida: mergear o PR #10 (planejamento da feature 001) e atualizar a `main`.
- Fluxo SDD: constituição, specify, clarify, plan, tasks e analyze já feitos para a 001; próximo comando: `/speckit-implement` (MVP T001–T040) em branch de implementação.
- Entregas da 001: estrutura em camadas, schemas (`source-schema-v1`, `folders-schema-v1`), registro de pastas em `src/data/folders.yaml` (primeiro alias: `github_forks`).
- Seguir TDD: contrato → exceções semânticas → testes de falha → implementação.

## Relacionadas

- [[2026-09-18]] — nota diária da sessão de definição do objetivo
- [[2026-09-21]] — correção do CI e planejamento da feature 001
- [[claude-code-config]] — regras globais do ambiente Claude Code

## Atualização — 22/09/2026: Feature 001 implementada e mergeada

- `/speckit-implement` executado por completo: 73 tarefas (Setup, Foundational, US1–US4, Polish), TDD rigoroso (vermelho→verde em cada grupo).
- Entregas: registro versionado `src/data/folders.yaml` (CLI `praxisforge folders add|list|show|update|validate|resolve`); resolução de caminho real via `PRAXISFORGE_FOLDER_<ALIAS>` (segue symlink); contratos `schemas/folders-schema-v1.json` e `schemas/source-schema-v1.json` (Draft 2020-12); `praxisforge sources validate`; guarda de arquitetura por AST em `tests/architecture/` (4 camadas, zero violações).
- Achado real do guarda de camadas: pegou duas violações genuínas introduzidas durante a implementação (Application→Infrastructure via logging; `cli.py`→Domain direto) — corrigidas sem afrouxar a matriz (`application/logging_events.py`, `application/errors.py`).
- Métricas finais: 187 testes verdes, cobertura 96%, `ruff`/`mypy --strict` limpos, `bandit`/`safety` limpos.
- Docs: `docs/architecture/overview.md`, 4 ADRs em `docs/decisions/`, `.pre-commit-config.yaml` (modo manual) + `.github/workflows/quality-gates.yml`.
- Pendências atualizadas: catálogo de skills segue vazio; feature 002 (varredura das pastas) é o próximo passo natural.
- Ver [[2026-09-22]] para o log da sessão.

## Atualização — 22/09/2026 (mais tarde): PR #11 mergeado

- PR #11 mergeado em `main` (merge commit `02572a5`); branch
  `001-registro-pastas-curadoria` deletada (local e remota).
- Achado extra no CI: `Review Dependencies` bloqueou o PR por
  GHSA-8mgp-746c-j5xp (high, `nltk@3.10.3`, transitiva de `safety`, sem
  patch disponível). Corrigido com `allow-ghsas` pontual no workflow,
  documentado em `docs/bugs/2026-09-22-ci-dependency-review-nltk.md`
  (repo). Risco inatingível: o código nunca importa `nltk`.
- **Próximo passo**: feature 002 (varredura das pastas registradas —
  scanner que popula `status`/`last_scanned`, detecta mesma pasta física
  sob dois aliases).
