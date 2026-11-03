---
tags: [memory, preferences]
aliases: [preferencias, prefs]
created: 2026-08-03
updated: 2026-10-28
---

# Preferências de comportamento

- Respostas técnicas completas, complexas e detalhadas, sem limite de tamanho.
- Código com tratamento completo de erros para não quebrar em execução.
- Toda função/classe valida parâmetros quanto a vazio e tipagem.
- Docstrings no padrão reStructuredText, incluindo doctest.
- Sempre gerar logs para facilitar o debug.
- `docker-compose.yaml` sem o parâmetro `version`; usar `docker compose` (não `docker-compose`).
- Documentação de sessão: **nada em `docs/SESSIONS/` nos projetos** (desde 28/10/2026). Registro no vault em `projects/<projeto>/sessions/YYYY-MM-DD.md` (append) + `projects/<projeto>.md` (fatos duráveis), lidos/gravados via MCP `obsidian-rest` ([[scaffold-project]] implementa isso nos rituais `/session-start` e `/session-end`).
- Orientações de tarefas sempre no formato "how to, step-by-step": passos numerados, com máquina/diretório, comando exato, se exige sudo, resultado esperado e o que fazer se falhar (regra também no `~/.claude/CLAUDE.md` global).
- Não usa GitGuardian/ggshield (pago). Scanner de secrets nos hooks pre-commit = **gitleaks** (instalado em `~/.local/bin`), modo pre-commit com `--staged --redact`.

- (03/11/2026 10:01) Vault `claude_memory`: acessar **sempre via MCP `obsidian-rest` (REST API do Obsidian)** — não ler/gravar pelo filesystem (cat/ls/Read), mesmo estando disponível localmente.
