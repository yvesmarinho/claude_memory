---
tags: [project, claude-code, config, hooks, meta]
aliases: [ambiente claude code, ~/.claude]
created: 2026-08-03
updated: 2026-08-03
source: importado de 4 sessões do Claude Code (~/.claude/projects/-home-yves-marinho--claude/)
---

<!-- Criado em: 03/08/2026 09:36 -->
<!-- Modificado em: 03/08/2026 09:36 -->

# Manutenção do ambiente Claude Code (~/.claude)

Escopo das sessões: quatro sessões (12/07 a 24/07/2026, mais uma isolada de 03/08) rodadas em `~/.claude` (diretório de configuração global, não um projeto de código). O foco foi evoluir o `~/.claude/CLAUDE.md` (regras globais aplicadas a todos os projetos), estruturá-lo em regras por linguagem, e automatizar via hooks de `settings.json` regras que antes dependiam do modelo "lembrar".

## Decisões e convenções duráveis estabelecidas

- `~/.claude/CLAUDE.md` foi reescrito e reduzido (~500 → ~120 linhas) por injetar contexto em toda sessão; tratamento de erro corrigido de `except BaseException` (que engolia `KeyboardInterrupt`/`SystemExit`) para exceções específicas, com `except Exception` só como último recurso em fronteiras (`main()`).
- Estrutura adotada: `CLAUDE.md` só com regras universais (segurança, idioma, arquitetura, git, documentação) + imports `@rules/<linguagem>.md` por linguagem — hoje `rules/python.md` (uv, logging, docstrings RST, requests via `.secrets/`, ruff/mypy/pytest) e `rules/node-typescript.md` (pnpm, TS strict, zod, Tailwind, ESLint/vitest).
- Seções incorporadas ao `CLAUDE.md`: Localização pt-BR (timezone `America/Sao_Paulo`, formato `DD/MM/AAAA HH:MM`, números `1.234.567,89`, moeda `R$`), Arquitetura de Software (camadas Presentation→Application→Domain→Infrastructure, modularidade obrigatória, SOLID como checklist, contratos validados via dataclasses/pydantic), Diretrizes Comportamentais Gerais (pensar antes de codificar, mudanças cirúrgicas, execução orientada a objetivo).
- Convenção fixada: campo `Modificado em:` do cabeçalho de arquivos deve ser obtido do sistema (`TZ=America/Sao_Paulo date '+%d/%m/%Y %H:%M'`), nunca estimado — após o modelo ter inventado horários incorretos numa sessão anterior.
- `gh` CLI definido como ferramenta padrão para operações GitHub (autenticado via SSH, conta `yvesmarinho`, escopos `gist`, `read:org`, `repo`).
- `~/.claude` foi mantido deliberadamente sem versionamento git (não é um repositório e a decisão foi não inicializar um).

## Hooks configurados (ativos em `~/.claude/settings.json`, scripts em `~/.claude/hooks/`)

- `update-header-modificado.sh` (PostToolUse em `Write|Edit`) — atualiza automaticamente o campo "Modificado em" no cabeçalho conforme extensão (`.md`, `.sh`, `.py`, `.json` com ISO 8601 `-03:00`).
- `block-curl-credenciais.sh` (PreToolUse em `Bash`) — bloqueia `curl`/`wget`/`http` com `Authorization:`, `Bearer`, `token=`, `api_key`, `--user user:senha` ou referência a `.secrets/` na linha de comando.
- `pre-commit-guard.sh` (PreToolUse em `Bash`, filtro `if: "Bash(git *)"`, timeout 300s) — bloqueia `git commit --no-verify`, bloqueia commit direto em `main`/`master`, roda `ruff check` (Python) ou `pnpm lint` (Node); para testes, valida o log mais recente de `./tmp/pytest-logs/` (não reexecuta a suíte), rejeitando se não houver log, se o log indicar falha, ou se o log for mais antigo que os arquivos staged.
- `pytest-background.sh` (PreToolUse em `Bash`) — reescreve chamadas de `pytest`/`uv run pytest`/`python -m pytest` para rodar em background via `nohup`, gravando saída em `./tmp/pytest-logs/pytest_AAAAMMDD_HHMMSS.log`; retorna só PID + caminho do log, evitando gastar tokens com output completo. Ignora `--version`/`--collect-only` e comandos que já usam redirecionamento/pipe/nohup.
- Plugins habilitados globalmente: `skill-creator`, `claude-md-management`, `feature-dev`, `security-guidance`, `claude-code-setup`, `commit-commands`, `pyright-lsp`, `atomic-agents`, `cloudflare` (via `enabledPlugins` em `settings.json`).
- MCP server `memory` configurado via `npx` em `settings.json`, além do vault Obsidian ([[00-index]]) como memória principal.

## Problemas relevantes resolvidos

- Hook novo não disparava na mesma sessão em que foi escrito: causa raiz — o watcher de configuração só observa diretórios que já tinham arquivo de settings no início da sessão. Solução: abrir `/hooks` uma vez ou reiniciar o Claude Code para recarregar.
- `pre-commit-guard.sh` inicialmente reexecutava toda a suíte pytest de forma síncrona a cada commit, tornando-o lento em projetos com suítes grandes. Resolvido migrando a validação para leitura do log gerado assincronamente pelo `pytest-background.sh`, comparando mtime do log com os arquivos staged.
- Import de arquivo externo (`~/Downloads/CLAUDE.md`, caminho corrigido de um `~/Download/` incorreto assumido inicialmente) mesclado com deduplicação manual de conteúdo já coberto no CLAUDE.md.

## Pendências / próximos passos conhecidos

- Nenhuma pendência explícita registrada nas sessões; hooks e estrutura de regras por linguagem estão ativos e validados.
- Ponto de atenção: `rules/node-typescript.md` assume pnpm/vitest/playwright — não há confirmação nas sessões revisadas de que essa stack foi validada contra o uso real do usuário (poderia ser npm/yarn ou jest em algum projeto).
