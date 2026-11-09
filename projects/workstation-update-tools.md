---
tags: [project, tooling, shell, workstation, git]
aliases: [update-tools, update-tools.sh]
created: 2026-10-19
updated: 2026-11-09
---

<!-- Criado em: 19/10/2026 10:01 -->
<!-- Modificado em: 09/11/2026 09:58 -->

# update-tools.sh — atualizador de ferramentas da workstation

Script bash `~/.local/bin/update-tools.sh` que atualiza programas instalados fora do apt, **somente se houver versão nova**. Sem repositório git. Sessão de criação: [[2026-10-19]]. Correção da etapa `omz` e do resumo: [[2026-10-30]].

> Caminho corrigido em 30/10/2026: o arquivo real está em `~/.local/bin/` (a nota registrava `~/scripts/`, que não contém o script). Backup da versão de 19/10: `~/.local/bin/update-tools.sh.bak-20261030`.

## update and new features
- [x] update node/nvm — etapa `node` (09/11/2026)
- [x] update oterm — já é `uv tool`, coberto pela etapa `tools`
- [x] update ansible — migrado de pip --user para `uv tool` (09/11/2026)
- [x] update terraform/tools — etapas `terraform` e `tftools` (09/11/2026)
- [x] update kula — etapa `kula` (09/11/2026)
- [x] update semgrep — instalado como `uv tool` (09/11/2026)
- [x] update aws cli(verificar se está instalado) — instalado (v2 em /usr/local/aws-cli); etapa `aws`
- [x] update sublime — etapa `sublime` (snap)

## remover
- [x] conda — `~/.condarc` (09/11/2026)
- [x] virtualenvs — `~/.virtualenvs` + virtualenvwrapper/virtualenv-clone/stevedore (pip --user); `python3-virtualenv` do apt removido (09/11/2026)
- [x] .swt
- [x] agentlytics
- [x] codex — `~/.codex`
- [x] copilot — binário `~/.local/bin/copilot`, `~/.copilot`, `~/.config/github-copilot`, aliases no `.zshrc` (backup `~/.zshrc.bak-20261109`; `~/Documentos/DevOps/.copilot-shared` mantido)
- [x] poetry — venv `~/.local/share/pypoetry`, configs e link
- [x] dotnet — `~/.dotnet`
## Uso

- `update-tools.sh --check` — só lista o que tem atualização.
- `update-tools.sh` — checa e atualiza o que estiver desatualizado.
- `--only uv,tools,claude,ollama,rust,cargo,omz,atuin,node,terraform,tftools,kula,aws,sublime` — escolhe etapas; `--dry-run` mostra os comandos.
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
- `node`: nvm (git em `~/.nvm`) → GitHub releases do nvm + `nodejs.org/dist/index.json` (LTS) → checkout da tag do nvm; `nvm install <LTS> --reinstall-packages-from=<default> --latest-npm` + `nvm alias default`; reinstala corepack se faltar (Node ≥ 25 não traz). Versões antigas ficam instaladas.
- `terraform`: binário oficial em `~/.local/bin` (precede `/usr/bin` no PATH) → checkpoint-api.hashicorp.com → zip de releases.hashicorp.com com SHA256.
- `tftools`: tflint, trivy, terraform-docs, gitleaks em `~/.local/bin` → GitHub releases → archive + checksums do release (helper genérico `update_gh_bin`).
- `kula`: `.deb` (c0m4r/kula) → GitHub releases → `sudo apt-get install ./kula-<v>-amd64.deb` após SHA256.
- `aws`: AWS CLI v2 em `/usr/local/aws-cli` → `git ls-remote` tags `2.*` → instalador oficial `sudo ./aws/install --update` (sem checagem de assinatura GPG).
- `sublime`: snap `sublime-text` → `snap refresh --list` → `sudo snap refresh sublime-text`.
- ansible (+ansible-lint, builder, runner) e semgrep são `uv tool` → etapa `tools`.

## Histórico

- **19/10/2026** — criação; primeira checagem (`--check`) com pendências em uv tools, rust, nu/plugins, atuin e plugins do omz.
- **30/10/2026** — primeira execução real. Aplicadas: claude 2.1.312 → 2.1.314, atuin 18.24.3 → 18.24.4. Falhou `omz:/custom/themes/powerlevel10k` (27 commits): `git pull --ff-only` → `fatal: Not possible to fast-forward` por **branch divergente** (commit só no local ou upstream reescrito por force-push). Bug paralelo: o resumo listava o powerlevel10k como "aplicado" porque mostrava tudo o que estava pendente, não o que foi instalado (valia para todas as etapas).
  - Correção: tratamento de divergência no `omz` (acima), resumo aplicadas × não aplicadas, log em arquivo, erro do `git fetch` passou a ser logado (antes ia para `/dev/null`).
  - Validação: `bash -n` + `shellcheck` sem avisos; testes com repositórios simulados — upstream reescrito + alteração não commitada (sincronizado, alteração preservada), commit local sem conflito (rebase OK), commit local com conflito (abortado, repo intacto, exit 1), fast-forward simples, 2ª execução idempotente.
  - Resultado na máquina: execução com sucesso após a correção.
- **09/11/2026** — novas etapas `node`, `terraform`, `tftools`, `kula`, `aws`, `sublime`; `--help` passou a ler o bloco por padrão (não por número de linha). Backup: `~/.local/bin/update-tools.sh.bak-20261109`.
  - Migração: ansible pip --user → `uv tool install ansible-core --with ansible` + ansible-lint/builder/runner; semgrep instalado via `uv tool`.
  - .deb removidos pelo usuário: `terraform` (só o de `~/.local/bin` em uso) e `python3-virtualenv`.
  - Aplicadas: nvm 0.40.3 → 0.41.0, node default v22.23.1 → v26.13.0 (LTS), terraform 1.16.2 → 1.17.1 (agora em `~/.local/bin`), tflint 0.64.0 → 0.66.0, trivy 0.74.0 → 0.76.2, gitleaks 8.30.0 → 8.30.1. Pendentes (sudo): kula 0.18.3 → 0.21.0, aws 2.27.2 → 2.39.6.
  - Remoções definitivas (rm -rf, confirmado): poetry, copilot, codex, agentlytics, dotnet, .swt, virtualenvs, .condarc.
  - Validação: `bash -n` + `shellcheck` sem avisos; `--check` → execução real → `--check` de novo sem pendências (idempotente).
  - Execução completa pelo usuário (09:51): aplicadas kula 0.18.3 → 0.21.0, aws cli 2.27.2 → 2.39.6, omz (4 commits) e powerlevel10k (5 commits); node/nvm já atualizados (etapa roda, mas item "atualizado" não entra no resumo final). Sem falhas. Daily: [[2026-11-09]].
  - Bug (corrigido 09:58): o resumo lista "uv tool ansible-core v2.21.6 [latest: 2.22.0]" como aplicado, embora `uv tool upgrade` não mude nada (core preso pelo pacote `ansible`).
  - Correção: `update_uv_tools` compara a versão antes/depois do upgrade; se não mudou, não conta como aplicado e grava `<tool> <latest>` em `~/.local/state/update-tools/uv-pinned`. Execuções e `--check` seguintes ignoram essa versão (volta a tentar quando sair uma mais nova). Apagar a linha do arquivo força nova tentativa.

## Decisões e cuidados

- `rustup check` sai com código != 0 quando há atualização; validar pela saída.
- Comparação de versões com `sort -V`, removendo o prefixo `v`.
- O zsh é do apt — fora do escopo do script.
- Ruff deve existir só via `uv tool`; a cópia antiga em `~/.cargo/bin` foi removida em 19/10/2026 porque sombreava a outra no PATH.
- O repositório do oh-my-zsh tem deleções locais intencionais em `plugins/conda`.
- Plugins/temas do omz: nunca usar `pull --ff-only` puro — divergência (force-push do upstream ou commit local) trava a atualização para sempre. O rebase usa `--fork-point` para não reaplicar commits que o upstream descartou.
- Backups de rebase ficam em `refs/update-tools/*` dentro de cada repo; listar com `git -C <repo> for-each-ref refs/update-tools` e apagar com `git update-ref -d <ref>` quando não forem mais necessários.
- `uv tool list --outdated` sempre aponta ansible-core mais novo: o pacote `ansible` (coleções) fixa a minor do core; `uv tool upgrade` responde "Nothing to upgrade" — não é falha.
- Node ≥ 25 não inclui corepack: sem ele, pnpm/yarn somem na nova versão.
- Descartar mudanças locais de um tema/plugin (quando não há customização própria): `git -C <repo> reset --hard @{u}`.
