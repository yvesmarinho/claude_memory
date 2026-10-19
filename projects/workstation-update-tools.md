---
tags: [project, tooling, shell, workstation]
aliases: [update-tools, update-tools.sh]
created: 2026-10-19
updated: 2026-10-19
---

<!-- Criado em: 19/10/2026 10:01 -->
<!-- Modificado em: 19/10/2026 10:01 -->

# update-tools.sh — atualizador de ferramentas da workstation

Script bash `~/scripts/update-tools.sh` que atualiza programas instalados fora do apt, **somente se houver versão nova**. Sem repositório git. Sessão de criação: [[2026-10-19]].

## Uso

- `update-tools.sh --check` — só lista o que tem atualização.
- `update-tools.sh` — checa e atualiza o que estiver desatualizado.
- `--only uv,tools,claude,ollama,rust,cargo,omz,atuin` — escolhe etapas; `--dry-run` mostra os comandos.
- Falha de uma etapa é logada e não interrompe as demais; termina com exit 1 e lista as etapas com falha.

## Etapas (origem da instalação → checagem → atualização)

- `uv`: pipx → PyPI → `pipx upgrade uv` (`uv self update` não funciona em instalação via pipx).
- `tools`: `uv tool` → `uv tool list --outdated` → `uv tool upgrade <nome>`.
- `claude`: instalador nativo (`~/.local/share/claude/versions`) → npm `@anthropic-ai/claude-code` → `claude update`.
- `ollama`: script oficial em `/usr/local/bin`, serviço systemd → GitHub releases → `curl -fsSL https://ollama.com/install.sh | sh` (pede sudo; só roda se houver versão nova).
- `rust`: rustup → `rustup check` → `rustup self update` (se preciso) + `rustup update`.
- `cargo`: crates do crates.io → API crates.io → `cargo install --locked <crate>`; crates instalados de git/path são ignorados.
- `omz`: núcleo do oh-my-zsh + plugins/temas git em `custom/` → `git fetch` + `rev-list HEAD..@{u}` → `tools/upgrade.sh` (rebase com autoStash, preserva alterações locais) / `git pull --ff-only`.
- `atuin`: instalador próprio (`~/.atuin/bin`) → GitHub releases → `atuin-update`.

## Decisões e cuidados

- `rustup check` sai com código != 0 quando há atualização; validar pela saída.
- Comparação de versões com `sort -V`, removendo o prefixo `v`.
- O zsh é do apt — fora do escopo do script.
- Ruff deve existir só via `uv tool`; a cópia antiga em `~/.cargo/bin` foi removida em 19/10/2026 porque sombreava a outra no PATH.
- O repositório do oh-my-zsh tem deleções locais intencionais em `plugins/conda`.
