---
tags: [project, tooling, shell, workstation, git]
aliases: [update-tools, update-tools.sh]
created: 2026-10-19
updated: 2026-10-30
---

<!-- Criado em: 19/10/2026 10:01 -->
<!-- Modificado em: 30/10/2026 08:52 -->

# update-tools.sh — atualizador de ferramentas da workstation

Script bash `~/.local/bin/update-tools.sh` que atualiza programas instalados fora do apt, **somente se houver versão nova**. Sem repositório git. Sessão de criação: [[2026-10-19]]. Correção da etapa `omz` e do resumo: [[2026-10-30]].

> Caminho corrigido em 30/10/2026: o arquivo real está em `~/.local/bin/` (a nota registrava `~/scripts/`, que não contém o script). Backup da versão de 19/10: `~/.local/bin/update-tools.sh.bak-20261030`.

## Uso

- `update-tools.sh --check` — só lista o que tem atualização.
- `update-tools.sh` — checa e atualiza o que estiver desatualizado.
- `--only uv,tools,claude,ollama,rust,cargo,omz,atuin` — escolhe etapas; `--dry-run` mostra os comandos.
- Falha de uma etapa é logada e não interrompe as demais; termina com exit 1 e lista as etapas com falha.
- Resumo final separa **"Atualizações aplicadas"** de **"Atualizações NÃO aplicadas"** (desde 30/10/2026); em `--dry-run` aparece "simuladas (dry-run)".
- Log em arquivo: `~/.local/state/update-tools/update-tools.log` (toda a saída via `tee -a`, inclusive dos comandos chamados).

## Etapas (origem da instalação → checagem → atualização)

- `uv`: pipx → PyPI → `pipx upgrade uv` (`uv self update` não funciona em instalação via pipx).
- `tools`: `uv tool` → `uv tool list --outdated` → `uv tool upgrade <nome>`.
- `claude`: instalador nativo (`~/.local/share/claude/versions`) → npm `@anthropic-ai/claude-code` → `claude update`.
- `ollama`: script oficial em `/usr/local/bin`, serviço systemd → GitHub releases → `curl -fsSL https://ollama.com/install.sh | sh` (pede sudo; só roda se houver versão nova).
- `rust`: rustup → `rustup check` → `rustup self update` (se preciso) + `rustup update`.
- `cargo`: crates do crates.io → API crates.io → `cargo install --locked <crate>`; crates instalados de git/path são ignorados.
- `omz`: núcleo do oh-my-zsh + plugins/temas git em `custom/` → `git fetch` + `rev-list --left-right --count HEAD...@{u}` (ahead/behind) →
  - núcleo: `tools/upgrade.sh` (rebase com autoStash, preserva alterações locais);
  - plugin/tema só atrasado (ahead=0): `git merge --ff-only @{u}`;
  - plugin/tema divergente (ahead>0): backup do HEAD em `refs/update-tools/backup-<AAAAMMDDhhmmss>` + `git rebase --autostash --fork-point @{u}`; em conflito, `rebase --abort` (repo volta ao estado anterior) e a etapa falha com instrução de resolução manual.
- `atuin`: instalador próprio (`~/.atuin/bin`) → GitHub releases → `atuin-update`.

## Histórico

- **19/10/2026** — criação; primeira checagem (`--check`) com pendências em uv tools, rust, nu/plugins, atuin e plugins do omz.
- **30/10/2026** — primeira execução real. Aplicadas: claude 2.1.312 → 2.1.314, atuin 18.24.3 → 18.24.4. Falhou `omz:/custom/themes/powerlevel10k` (27 commits): `git pull --ff-only` → `fatal: Not possible to fast-forward` por **branch divergente** (commit só no local ou upstream reescrito por force-push). Bug paralelo: o resumo listava o powerlevel10k como "aplicado" porque mostrava tudo o que estava pendente, não o que foi instalado (valia para todas as etapas).
  - Correção: tratamento de divergência no `omz` (acima), resumo aplicadas × não aplicadas, log em arquivo, erro do `git fetch` passou a ser logado (antes ia para `/dev/null`).
  - Validação: `bash -n` + `shellcheck` sem avisos; testes com repositórios simulados — upstream reescrito + alteração não commitada (sincronizado, alteração preservada), commit local sem conflito (rebase OK), commit local com conflito (abortado, repo intacto, exit 1), fast-forward simples, 2ª execução idempotente.
  - Resultado na máquina: execução com sucesso após a correção.

## Decisões e cuidados

- `rustup check` sai com código != 0 quando há atualização; validar pela saída.
- Comparação de versões com `sort -V`, removendo o prefixo `v`.
- O zsh é do apt — fora do escopo do script.
- Ruff deve existir só via `uv tool`; a cópia antiga em `~/.cargo/bin` foi removida em 19/10/2026 porque sombreava a outra no PATH.
- O repositório do oh-my-zsh tem deleções locais intencionais em `plugins/conda`.
- Plugins/temas do omz: nunca usar `pull --ff-only` puro — divergência (force-push do upstream ou commit local) trava a atualização para sempre. O rebase usa `--fork-point` para não reaplicar commits que o upstream descartou.
- Backups de rebase ficam em `refs/update-tools/*` dentro de cada repo; listar com `git -C <repo> for-each-ref refs/update-tools` e apagar com `git update-ref -d <ref>` quando não forem mais necessários.
- Descartar mudanças locais de um tema/plugin (quando não há customização própria): `git -C <repo> reset --hard @{u}`.
