---
tags: [project, mnemosine, obsidian, python, vault]
aliases: [worldmind-vault reorg]
created: 2026-08-03
updated: 2026-08-03
source: importado de 18 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Projetos-mnemosine/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:29 -->

# Mnemosine

Aplicação Python (uv, ruff, pytest, arquitetura em camadas domain/application/infrastructure) cujo propósito central é reorganizar e normalizar o vault Obsidian `worldmind-vault` (base de conhecimento pessoal, ~700+ notas) transformando-o em memória estruturada e pesquisável para o Claude, usando Spec Kit (speckit-constitution/specify/clarify/plan) para governar o desenvolvimento e um pipeline `vault_memory` (CLI `scan`/`apply`/`report`) para a execução.

## Decisões arquiteturais/técnicas duráveis

- Constituição do projeto (`.specify/memory/constitution.md` v1.0.0) formaliza como princípios não-negociáveis: modularidade em camadas, contratos/erros específicos, qualidade obrigatória (cobertura ≥90%, ruff/mypy/pytest), segurança de credenciais (`.secrets/`, GitGuardian), simplicidade/YAGNI, observabilidade — todos derivados do `CLAUDE.md` já vigente.
- Decisão arquitetural chave (ADR-0001): decisões semânticas (classificar assunto de clipping, gerar `description`) são feitas pelo Claude via um contrato de dados (`contracts/claude-classification-contract.md`), não por API de IA embutida no código — evita credencial nova e mantém o Python só com operações determinísticas.
- Schema-alvo de frontmatter das notas: `name`/`description`/`metadata.type`/`tags`, com `description` ausente gerado por resumo de IA (não heurística determinística) e `tags`/`metadata.type` como fonte de verdade da categoria (em vez de profundidade de pasta).
- Regra de profundidade de pastas: preferir nível ≤3 usando tags em vez de criar subpasta nova, exceto quando o volume de notas já justificar nível 4+ (indexador do Obsidian trabalha sobre o vault inteiro, profundidade de pasta não é gargalo técnico, só fricção de manutenção).
- Critério de deduplicação: completude (mais linhas/seções) tem prioridade sobre recência; recência só desempata em caso de tamanho equivalente.
- `4-Memória Pessoal/` (dados de saúde/reclamações pessoais) é fronteira de privacidade explícita: totalmente fora do escopo de reescrita de frontmatter/índices — a ausência de normalização ali é comportamento correto, não bug.
- Pastas/exceções nunca lidas/reescritas centralizadas em `src/vault_memory/vault_excluded_folders.json` (`EXCLUDED_ROOT_NAMES`: `.obsidian`, `Images`, `WorldMindDB.base`; `PERSONAL_DATA_ROOT_NAME`: `4-Memória Pessoal`), carregado por `scope_policy.py` em vez de constantes fixas no código.
- O vault real (`worldmind-vault`) é um **symlink gitignorado** apontando para um caminho pessoal fora do repo (Google Drive) — nunca é versionado; só código (`src/`, `tests/`) e artefatos de auditoria (`docs/decisions/`) ficam no Git. Backups point-in-time (~42 MB) também ficam fora do Git.

## Convenções/padrões adotados

- Índice de pasta: arquivo `{NomeDaPasta}.md` (ou `_index.md` quando colide com nota real existente) gerado por `write_folder_index`, listando `[[nota]]` + `description` + `tags` de cada filho direto.
- Toda alteração aplicada ao vault real passa por `scan --dry-run` (relatório de mudanças propostas) antes de `apply` (que já inclui backup automático).
- Trabalho de classificação semântica em lote (ex. 130 clippings) é feito via Workflow/agentes Claude em paralelo, com resultado consolidado num mapa JSON versionado em `docs/decisions/` para auditoria.
- Nunca commit direto em `main`/`master`: sempre branch de feature + PR; branch precisa seguir o padrão `tipo/descricao` exigido por workflow do GitHub.
- Lint (`ruff check .`) e testes (`pytest`) obrigatórios e verificados antes de cada commit.
- GitHub Advanced Security (CodeQL, Dependency Review) não está disponível neste repositório privado sem compra — checks correspondentes falham por configuração, não por código; não é bloqueante porque não há branch protection configurada.

## Problemas relevantes resolvidos

- CI/CD — regressão de segurança: remoção do trigger `pull_request` em `security-scan.yml` desligava o job TruffleHog (secret scanning) em PRs; secrets só seriam detectados após merge, já no histórico.
- `dependency-review.yml` sem fallback: após remover `pull_request`, o gate de dependências nunca mais roda automaticamente (sem `push`/`schedule` de reserva).
- Path traversal na classificação de clippings: `is_valid_clipping_destination` validava só `parts[0]` e comprimento, sem rejeitar `..`; `reclassify_clipping.py` chamava `mkdir(parents=True)` no path não-normalizado antes do `resolve()` de segurança, permitindo que uma classificação do Claude criasse diretórios dentro da área protegida `4-Memória Pessoal/` (sem escrever conteúdo, pois o move em si era bloqueado).
- Bug de dado: `tags:` string virando lista de caracteres — `normalize_note.py`/`cli.py` faziam `list(string)` quando o frontmatter original tinha `tags:` como string escalar (não lista YAML). Corrigido com teste de regressão; só 1 arquivo no vault foi afetado.
- Bug de perda de dado real: `write_folder_index` sobrescrevia qualquer arquivo cujo nome coincidisse com o nome da pasta, mesmo sendo nota real — apagou `2-Biblioteca/Python/Featuretools/Featuretools.md`. Corrigido (usa `_index.md` em caso de colisão), conteúdo restaurado do backup, teste de regressão adicionado.
- 234 índices de pasta sem frontmatter: `write_folder_index` sobrescrevia o arquivo inteiro sem gerar `name`/`description`/`metadata.type`. Corrigido reaproveitando `normalize_note.py`.
- Boilerplate do Web Clipper virando `description`: `_extract_valid_description` só rejeitava placeholders de template, não taglines de site do Web Clipper — 83 arquivos afetados. Corrigido com lista fechada de prefixos + teste de regressão.
- Deduplicação — falsos positivos: de 5 grupos flagados por similaridade de nome, só 2 eram duplicatas reais; 3 eram artigos distintos com prefixo de título igual — removidos manualmente só os reais, com registro em `docs/decisions/deduplication-log.md`.
- Colisão de slug `name` pré-existente de migração anterior (`Sip proxy/Prompt GPT.md` vs `0 - Readme.md`) encontrada e corrigida durante verificação de amostragem final.

## Pendências / próximos passos conhecidos

- 10 grupos de duplicata de baixa similaridade — 2 resolvidos manualmente; os demais permanecem para revisão (nenhuma exclusão automática, por decisão do plano).
- PR #7 (`feat-vault-memory-worldmind-reorg` → `main`) aberto mas não mergeado — aguardando decisão do usuário.
- Plano principal: `docs/planning/plano-reorganizacao-worldmind-vault.md`; spec: `specs/001-vault-worldmind-memory/`; relatório de performance do vault: `docs/architecture/vault-obsidian-performance.md`; auditoria/decisões: `docs/decisions/` (inclui `clippings-classification-map.json`, `deduplication-log.md`, `vault-memory-dry-run-latest.md`).
