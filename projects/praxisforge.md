---
tags: [project, praxisforge, agentic-ai, claude, python]
aliases: [PraxisForge]
created: 2026-09-18
updated: 2026-09-24
---

<!-- Criado em: 18/09/2026 16:50 -->
<!-- Modificado em: 24/09/2026 18:08 -->

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

- O projeto mantém uma base de dados das pastas que contêm informações a serem curadas (caminho, descrição, tipo, licença, última varredura, status de curadoria). Armazenamento em YAML **fora do repo** (`~/.config/praxisforge/folders.yaml`, feature 007; repo versiona só `src/data/folders.example.yaml`), validado por schema versionado (`schemas/folders-schema-v2.json`); `schema_version` obrigatório em JSON, YAML e frontmatter. Catálogo de skills também em `skills/README.md` no repo.

## Catálogo de skills

- `diretrizes-codificacao` — diretrizes de comportamento para codificar sem os erros típicos de LLMs (premissas explícitas, simplicidade, mudanças cirúrgicas, critérios verificáveis); v1.0.0; `skills/diretrizes-codificacao/`; fonte `karpathy-guidelines` (summary, MIT).
- Desde a feature 008 o catálogo canônico é gerado em `skills/README.md` por `praxisforge skills catalog`; este catálogo do vault continua manual.

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

## Atualização — 23/09/2026: features 002 e 003 mergeadas (registro retroativo de 22/09)

- Feature 002 (varredura das pastas, PR #12, mergeado em 22/09 12:36): `praxisforge folders scan <alias>|--all` atualiza `status`/`last_scanned`, isola falha por item no lote e detecta aliases que apontam para o mesmo caminho real; sem camada/porta nova (reaproveita `FolderRegistry.update()`, `PathResolver`, `ItemFailure`); 23/23 tasks, 212 testes, cobertura 96,19%.
- Feature 003 (bootstrap do registro, PR #13, mergeado em 22/09 16:53): `praxisforge folders bootstrap <root>` registra subpastas de 1º nível ainda ausentes, extraindo `description`/`license` de README/LICENSE; idempotente, nunca sobrescreve pasta registrada; 40/40 tasks, 262 testes, cobertura 96,49%.
- Decisão (003): novo status `ignore`, atribuído só manualmente (`folders update --status ignore`); bootstrap e `scan --all` pulam essas pastas.
- Decisão (003): mudança no `folders-schema-v1.json` é aditiva (novo valor de enum + invariante relaxada) — permanece v1.
- Decisão (003): nova porta `RootFolderProbe` + adapter `FilesystemFolderProbe` (heurística de texto, sem dependência nova).
- Bugs reais achados na 003: colisão de alias mascarada como no-op idempotente em `registry.add()`; registro ausente não tratado como vazio no primeiro bootstrap — ambos corrigidos.
- Lacuna conhecida (commit `d5e7e19`, `docs/reference/folders-yaml.md`): `last_scanned` só confirma acessibilidade, não compara conteúdo; comportamento planejado é reverter `curated`→`in_curation` ao detectar mudança do hash do HEAD.
- **Próximo passo**: candidata natural é a detecção de mudança de conteúdo pós-curadoria; catálogo de skills segue vazio; dívida de ruff em `scripts/` segue aberta.
- Ver [[2026-09-23]].

## Atualização — 23/09/2026: feature 004 (detecção de mudança de conteúdo) — MVP

- Spec/plan/tasks em `specs/004-deteccao-mudanca-conteudo/` (18 FR, 6 SC, 42 tarefas TDD); MVP (US1, T001–T023) implementado na branch `004-deteccao-mudanca-conteudo`.
- Decisão: `last_curated_commit` opcional em `folders-schema-v1.json` (aditivo, sem v2); grava o HEAD ao marcar `curated`; mantido como histórico nos demais status.
- Decisão: integração git via executável (`GitCliInspector`, porta `GitContentInspector`), sem dependência nova; mudança = diff entre hash gravado e HEAD restrito à pasta (`-- .`).
- Decisão: legado curado sem hash recebe baseline na varredura; reversão `curated`→`in_curation` só na varredura (US2, pendente).
- Pendente: US2/US3, teste de escala (100 pastas < 30 s), ADR 0005, docs, PR.
- Ver [[2026-09-23]].

## Atualização — 23/09/2026 (mais tarde): feature 004 completa, PR #14

- 42/42 tarefas; US2 (reversão na varredura) e US3 (baseline do legado) implementadas; ADR 0005 em `docs/decisions/`.
- 346 testes, cobertura 96,42%; teste de escala com 100 repositórios reais.
- PR #14 aberto (`004-deteccao-mudanca-conteudo` → `main`), aguardando CI/merge.
- **Próximo passo**: merge do PR #14; candidatos seguintes — catálogo de skills (vazio), dívida de ruff em `scripts/` e `ruff format --check` fora do `make lint`.

- 23/09/2026 12:28: PR #14 mergeado (`c6d5d59`); feature 004 entregue. Próximo: catálogo de skills, dívida de ruff em `scripts/`, `ruff format --check` no `make lint`.

## Atualização — 23/09/2026 (noite): feature 005 — caminho absoluto no registro

- Constituição **v2.0.0**: Princípio V agora exige `path` absoluto por pasta no `folders.yaml` (antes proibido); caminho absoluto segue proibido no código e restrito em logs.
- Decisão: `folders-schema-v2.json` (breaking), `PRAXISFORGE_FOLDER_<ALIAS>` abandonado (só a migração lê), caminho único e sem aninhamento (case-insensitive).
- Decisão: alias do bootstrap = `<raiz>__<subpasta>`, sufixo `_N` em colisão (inclui raízes homônimas), truncamento a 63; raiz nunca registrada.
- Decisão: `folders migrate [--root]` converte v1 → v2 (variável → subpasta da raiz), remove raiz registrada, grava só sem pendências.
- Bug corrigido: `update` não regrava mais a versão curada ao editar outro campo (só em `--status curated`).
- Registro versionado zerado; usuário refará o bootstrap. ADR 0006.
- **Próximo passo**: PR da 005; depois catálogo de skills, dívida de ruff em `scripts/`, remover detecção de duplicados morta no scan.

## Atualização — 24/09/2026: CI do PR #15 e bugs do registro

- CI do PR #15 falhou no teste de escala (35,5 s > 30 s), não no lint: `scan_all_folders` relia e regravava o YAML por pasta (O(n²)) + checagem de caminho por pares da 005. Corrigido com 1 load/1 save por lote e `lru_cache` em `_componentes` (commit `5aeaf74`); escala 10,6 s → 2,5 s.
- Bugs corrigidos (commit `c02f7f4`): `scan`/`resolve` davam traceback com registro inválido (agora código 1 + dica `folders validate`); detector de licenças passou a reconhecer `Elastic-2.0`.
- Achado: edição manual do `folders.yaml` pós-bootstrap deixou 5 pastas fora do contrato v2 (unknown+not_scanned, description vazia) — corrigidas localmente.
- Decisão: registro populado **não é versionado** — repositório é público e `/home/...` ficaria exposto; guarda `test_no_absolute_paths` mantido. Conflito aberto com a constituição v2 (exige path absoluto no `src/data/folders.yaml`): definir onde o registro real vive (fora do repo / gitignored via `--registry`). Enquanto isso, `make test` local falha com o registro populado no lugar.
- **Próximo passo**: merge do PR #15; feature para localização do registro real; depois catálogo de skills, dívida de ruff em `scripts/` (+ `ruff format --check` em `make lint`, `filesystem_folder_probe.py` fora do formato), remover detecção de duplicados morta no scan.

## Atualização — 24/09/2026 (tarde): PR #15 mergeado; PR #16; feature 006 implementada

- PR #15 mergeado (`d693ba6`), mas **no commit `5aeaf74`**: o `c02f7f4` (traceback em registro inválido + Elastic-2.0) ficou de fora. Levado à `main` pelo **PR #16** (`fix-registro-invalido-traceback-elv2`, cherry-pick). Lição: conferir os commits do PR antes do merge.
- Decisão (conversa com o usuário): licença importa quando se **copia/publica**; citar a fonte não dá permissão. Regra virou a feature 006.
- Feature 006 (`006-politica-extracao-licenca`, baseada no PR #16): `extract_policy` (`link` < `summary` < `verbatim`) substitui `extract_allowed`; tabela em `domain/license_policy.py` (MIT/BSD-3/Apache → verbatim; GPL-3.0 → verbatim só `extract_scope: docs`, senão summary; Elastic-2.0 → summary; unknown/não classificada → link); `source-schema-v2.json` (breaking); caso de uso `validate_sources` + porta `SourceReader` (regra saiu da CLI); `sources validate` recursivo; `folders show/list` exibem a política máxima; `make validate-data` valida `src/data/sources/` quando existir; ADR 0007; `docs/reference/sources-frontmatter.md`.
- Clarificações: licença da fonte independente da pasta; extratos no mesmo `.md` (campos declarados `notice_preserved`/`modified`); licença não classificada → link sem aviso.
- 40/40 tarefas, 554 testes, cobertura 97,06%; lint, format, validate-data, security limpos.
- **Próximo passo**: merge do PR #16, commit/PR da 006; depois onde o registro real vive (fora do repo público), catálogo de skills, dívida de ruff em `scripts/`.

## Atualização — 24/09/2026 (tarde): feature 007 — registro fora do repositório

- PRs #16 (fix traceback/ELv2) e #17 (feature 006) mergeados; PR #18 aberto com constituição **v3.0.0**, spec da 007 e seção da CLI no README.
- Decisão (usuário): registro de pastas **fora do repositório público** — `$XDG_CONFIG_HOME/praxisforge/folders.yaml` (fallback `~/.config/praxisforge/folders.yaml`); precedência `--registry` > `PRAXISFORGE_REGISTRY` > XDG (só absoluta) > `~/.config`. Repo versiona só `src/data/folders.example.yaml` (caminhos `/srv/praxisforge/...`); `src/data/folders.yaml` no `.gitignore`.
- Novo `folders relocate [--from]` (≠ `migrate`): valida origem, recusa destino existente/origem vazia/v1, cópia verificada + troca atômica, origem só removida no fim; falha de I/O → exit 3. Dica de relocate quando há registro antigo. ADR 0008.
- Guarda `test_no_absolute_paths` passou a olhar só arquivos versionados (`git ls-files`); fixture autouse isola `XDG_CONFIG_HOME` nos testes.
- Registro real do usuário (55 pastas) **realocado** para `~/.config/praxisforge/folders.yaml` com conteúdo idêntico.
- 40/40 tarefas; 618 testes, cobertura 97,86%. Limitação: CLI resolve `schemas/` pelo cwd (rodar na raiz).
- Bug achado após realocar: teste de contrato da 005 lia `src/data/folders.yaml` (verde só pela cópia local) → aponta para o exemplo; `docs/bugs/2026-09-24-teste-lia-registro-local.md`. Lição: rodar gates sem arquivos ignorados presentes.
- **Próximo passo**: commit/PR da implementação da 007; depois catálogo de skills e dívida de ruff em `scripts/`.

## Atualização — 24/09/2026 (fim de tarde): feature 008 — biblioteca de skills

- PR #18 (feature 007) mergeado em `03a6ca9`; registro real já em `~/.config/praxisforge/folders.yaml`.
- Feature `008-biblioteca-skills` (branch homônima): specify → clarify → plan → tasks → analyze → implement; 44/44 tarefas.
- Decisões de clarify: skill não autoral precisa de ≥ 1 fonte `summary`/`verbatim` (FR-007a); `--all` lista órfãs e só `--prune` remove (só as nossas); conteúdo alterado com a mesma `metadata.version` → recusado (não vale para symlink; troca cópia↔symlink sempre publica).
- Entregue: `skills/_template/`, `skills validate`, `skills catalog` (`skills/README.md` sem data, determinístico), `skills publish --target global|<pasta> [--mode copy|symlink] [--prune]`, `scripts/publish-skills`; ADR 0009 e guia `docs/guides/criar-publicar-skills.md`.
- Publicado pelo praxisforge = cópia com marcador `.praxisforge-skill.json` (schema `skill-publication-v1`: versão + SHA-256 de caminho+bytes) ou symlink para `skills/<nome>`; resto é terceiro e nunca é tocado.
- Validador JSON Schema passou a exigir `schema_version` só quando o schema o declara (frontmatter de skill é versionado pelo nome `skill-frontmatter-v1`).
- Bug achado no quickstart: link de exemplo em código no template contava como referência → `docs/bugs/2026-09-24-template-skill-link-em-codigo.md`. Lição: testar uma **cópia** do template.
- Gates: 784 testes, cobertura 98,07%, lint/format/bandit/safety ok. Limitação: comandos `skills` resolvem `skills/`/`src/data/sources/` pelo cwd (script contorna).
- **Próximo passo**: commit/PR da 008; depois primeiras skills reais (dependem de registros em `src/data/sources/`) e dívida de ruff em `scripts/`.

## Atualização — 24/09/2026 (noite): PR #19 mergeado; primeira curadoria real

- PR #19 (feature 008) mergeado em `7aa01fa`.
- Primeira fonte: `src/data/sources/praticas-agentes/karpathy-guidelines.md` (forrestchang/andrej-karpathy-skills; MIT declarada só no README, sem arquivo LICENSE — decisão do usuário: reclassificar a pasta para MIT; política `summary`).
- Primeira skill: `diretrizes-codificacao` 1.0.0 (síntese autoral em pt-BR); pasta marcada `curated` (versão curada `2c60614`).
- Não publicada no `~/.claude/skills` global: as mesmas diretrizes já estão no CLAUDE.md global (publicar só se for útil em outras ferramentas/projetos).
- Descrição da pasta no registro está errada (heurística do bootstrap); `folders update` não tem `--description`.
- Teste do atalho `publish-skills` compartilhava `HOME` entre as duas execuções — corrigido ao surgir a primeira skill real.
- Commit `feat(skills): primeira curadoria` na branch `feat-skill-diretrizes-codificacao`; **PR #20** aberto (aguardando CI/merge).
- **Estado ao encerrar (24/09/2026)**: `main` em `7aa01fa` (PR #19); PR #20 pendente. Registro real em `~/.config/praxisforge/folders.yaml` com a pasta `github_forks__andrej_karpathy_skills` = MIT/curated.
- **Próxima sessão**: merge do PR #20; decidir publicação global da skill; próximas fontes (ex.: `agent_skills`, `claude_code_best_practice`, `superpowers`); `--description` no `folders update`; dívida de ruff em `scripts/`; limitação do diretório atual na CLI.
