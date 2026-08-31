---
tags: [project, scaffold-project, python, scaffold, tooling]
aliases: [scaffold-project, a-default-project, default-project, Vya Jobs scaffold]
created: 2026-08-03
updated: 2026-08-28
source: importado de 13 sessões do Claude Code + sessão de renomeação 2026-08-28
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 28/08/2026 12:18 -->

# scaffold-project

Ferramenta CLI/scaffold em Python para bootstrap e manutenção de projetos de desenvolvimento (novos e legados), com foco em automação de rituais de sessão do Claude Code, hooks de segurança pré-commit, e templates reutilizáveis (speckit, GitHub, profiles por linguagem/domínio). Stack: Python (uv/pytest/ruff), YAML para templates/config, scripts bash para hooks git.

## Identidade atual (pós-renomeação 2026-08-28)

- Repositório GitHub: `yvesmarinho/scaffold-project` (renomeado de `yvesmarinho/default-project`; GitHub mantém redirect das URLs antigas).
- Clone local canônico: `~/Documentos/DevOps/Projetos/scaffold-project` (movido de `~/Documentos/DevOps/Vya-Jobs/a-default-project`, que foi removido).
- Pacote Python: `src/scaffold_project/` (antes `src/default_project/`); `pyproject.toml` `name = "scaffold-project"`.
- Workspace VSCode: `scaffold-project.code-workspace`.
- Branch default: `master`.
- Renomeação executada por sed global (247 arquivos, 656 linhas) na branch `chore/rename-default-project-to-scaffold-project` → PR #29 → PR #30. Substituídas as formas `a-default-project`, `default-project`, `default_project`, `DEFAULT_PROJECT`, `Default Project`, `default project`, além de URLs (`yvesmarinho/`, `vyajobs/`) e caminhos absolutos.

## Decisões arquiteturais/técnicas duráveis

- Ferramenta central: `scripts/scaffold.py`, com subcomandos `new` (projeto do zero), `upgrade` (atualizar projeto já adotado) e `adopt` (adotar projeto legado existente) — `adopt` detecta linguagem (`pyproject.toml`/`package.json`/`go.mod`) e domínio (ex. `*.tf`, `Chart.yaml` → infrastructure) e delega ao pipeline de `upgrade`, preservando arquivos existentes (só `--force` sobrescreve, com backup).
- Estado do scaffold persistido em `.scaffold-state.yaml` na raiz do projeto alvo; presença desse arquivo é o sinal de "já adotado" (bloqueia `adopt` duplicado, indica usar `upgrade`).
- `scripts/session-manager.py` (com `scripts/lib/session_security.py`) automatiza rituais de início/fim de sessão via `--json start|status|recover|end`; saída JSON deve ser compacta (sem `indent=2`) e o flag global `--json` vai **antes** do subcomando (`session-manager.py --json start`), não depois.
- Scan de segurança de sessão (`security-scan`) agrega achados por `kind` (não lista cada arquivo individualmente) para reduzir tamanho de saída: campos `findings_total`, `findings_by_kind`, até 5 exemplos por tipo, `findings_omitted`.
- Hook pre-commit (`scripts/git-hooks/pre-commit`, fonte Python, e template bash embutido no scaffold em `scripts/lib/project.py` como `_PRE_COMMIT_SECRETS_HOOK`) roda em **modo manual por padrão** (imprime uma linha e sai 0, sem varrer nada) para não consumir tokens em commits/PRs frequentes; validação completa só com `PRE_COMMIT_VALIDATE=1 git commit` ou `--manual` explícito. Isso é uma exceção deliberada à regra global de "pre-commit sempre ativo" — decisão ciente do trade-off de segurança (recomendação registrada: mover scans de secrets/IPs para CI/GitHub Actions em vez de hook local).
- `session-manager.py`/`session_security.py` do próprio repositório (`_TEMPLATE_ROOT`) são copiados diretamente para projetos novos pelo scaffold — mudanças no CLI/lib se propagam automaticamente, sem necessidade de sincronizar cópias.
- Sistema de plugins de IA (`scripts/lib/ai/` — `base.py`, `registry.py`, `plugins/claude.py`, `plugins/copilot.py`) suporta seleção de assistente via `--ai-assistant`; entrou em `master` pelo commit `bd5337d` (a branch paralela `worktree-agent-a11d9f5d8c2bbb800` era a mesma feature, ficou obsoleta e foi descartada).
- Flags de log: `--log-dir` é a flag canônica; `--logdir` foi adicionada como alias (mesmo destino interno). `save_operation_log` (`scripts/lib/ui.py`) grava log em até 3 lugares: sempre em `<projeto>/logs/`, sempre em `logs/` do próprio scaffold-project, e adicionalmente no `--log-dir` customizado se passado.
- No dispatch de `scaffold.py`, a flag `--adopt` é avaliada antes de `--dry-run` no fluxo geral — por isso `--dry-run` precisa ser tratado internamente por cada `flow_*` (não é honrado automaticamente pelo dispatcher).

## Convenções/padrões adotados

- Mensagens de erro/hint dos hooks em português (pt-BR), incluindo dicas acionáveis (ex.: `make memory-cleanup`).
- Testes de segurança devem exportar `PRE_COMMIT_VALIDATE=1` via fixture `autouse` para continuar exercitando o hook mesmo com o modo manual como padrão.
- Bugs relevantes são documentados em `docs/bugs/BUG-N-<slug>.md` (regra do projeto: sempre registrar).
- PRs em vez de commit direto na master é a regra padrão.
- Nome de branch de trabalho segue convenção verificada por testes (`session_time_tracker`); branch fora do padrão quebra testes relacionados.
- `.env.example` e afins dentro de `scaffold/templates/**` são exemplos intencionais do produto — tratados como falsos positivos aceitos no scanner de segurança, não como vazamento real.
- `graphify-out/` é saída gerada — deve ficar no `.gitignore` (PR #32).

## Problemas relevantes resolvidos

- Renomeação `default-project` → `scaffold-project`: repo GitHub renomeado, clone recriado no novo local, sed global em 247 arquivos, suíte `pytest` 1702 passed / 28 skipped antes e depois, `ruff` sem novos erros. PRs #29 → #30. Branches `fix/pendencias-todo-sessao` e `worktree-agent-a11d9f5d8c2bbb800` ficaram redundantes e foram descartadas.
- Saída JSON excessiva no `session-manager`: causa raiz era `security-scan` listando cada arquivo individualmente (até 26–27 KB) e JSON com `indent=2`. Solução: agregação por `kind` + JSON compacto — reduziu `start` de 27.412 para 4.311 bytes (-84%) e `security-scan` de 26.271 para 3.185 bytes (-88%).
- Ordem inválida do flag `--json`: documentação e templates usavam `<cmd> --json` (falha no argparse), correto é `--json <cmd>`. Corrigido em 4 comandos `.claude/commands/session-*.md`, templates speckit do scaffold, e strings embutidas em `scripts/lib/project.py`/`scripts/lib/templates.py`.
- Regressão do padrão `credentials` no blocklist de nomes sensíveis: perdido numa reescrita anterior, restaurado em ambos os hooks (Python e template bash) — expansão puramente defensiva do blocklist, sem novo sink habilitado.
- BUG-26 — `scaffold adopt --dry-run` executava de verdade: causa raiz era `--adopt` avaliado antes de `--dry-run` no dispatch e `flow_adopt` não lia a flag; dry-run era silenciosamente ignorado, chegando a criar `.scaffold-state.yaml` em projeto real (`~/VyaJobs/enterprise-observability`). Corrigido tratando `--dry-run` internamente em `flow_adopt`. Commits `c570c50`+`acbd771` no PR #27 (mergeado em `master` via #30).
- Testes escrevendo artefatos em `Path.cwd()`: `objetivo-init*.yaml` apareciam na raiz do repo como efeito colateral de testes POC; corrigido redirecionando para `tmp_path`/`tempfile.mkdtemp()`.
- `--logdir` não reconhecido: só `--log-dir` existia; adicionado alias `--logdir` apontando para o mesmo destino interno.

## Pendências / próximos passos conhecidos

- Limpeza manual pendente em `~/VyaJobs/enterprise-observability` (reverter adoção acidental causada pelo BUG-26) — requer revisão do `git status` local antes de `git clean -fd` (pasta tem itens untracked não relacionados, ex. `.zip`, `backups/`, `old/`).
- `profile-descriptors/` duplicando `scaffold/profiles/` — sugerido consolidar em sessão futura.
- ~1295 erros de ruff pré-existentes no repositório (nenhum novo introduzido) — pendente de limpeza.
- `rich` e `pyyaml` são usados pelos scripts mas faltam em `pyproject.toml` (`[project.optional-dependencies].dev`) — a suíte só roda com eles instalados à mão.
- Mover scans de segurança de secrets/IPs do hook local (modo manual) para CI/GitHub Actions, para recuperar enforcement automático sem custo de tokens na sessão.
- PRs dependabot #22 (github-script 7→9), #23 (checkout 4→7), #24 (airflow) foram fechados sem merge — reavaliar se ainda interessam.
- PR #32 (`.gitignore` graphify-out/) aberto, aguardando merge.
- Opcional: renomear branch default `master` → `main`.
