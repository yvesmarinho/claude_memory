---
tags: [project, sincronizacao, linux-mint, unison, chezmoi, ansible, ssh, dotfiles]
aliases: [machine-sync, sincronização desktop notebook, plano-sincronizacao-mint22]
created: 2026-10-19
updated: 2026-10-26
source: projeto "Sincronização Desktop Notebook" no Claude (thread de análise do plano, 19/10/2026)
---

<!-- Criado em: 23/10/2026 10:34 -->
<!-- Modificado em: 26/10/2026 15:42 -->

# Sincronização Desktop ↔ Notebook (Linux Mint 22) — machine-sync

Processo repetível e bidirecional para manter desktop e notebook (Mint 22 Cinnamon, mesma rede cabeada) iguais em arquivos, aplicações, configurações e ambiente de desenvolvimento. Plano original v1.0.0 (16/10/2026) com 5 camadas: C1 sistema, C2 pacotes por manifesto, C3 dotfiles + dconf, C4 dados via Unison, C5 dados vivos. Status: **planejamento concluído, implementação iniciada (sshd)**.

## Decisões (D1–D17, 19/10/2026)

- D1 motor de dados: Unison (baseline com `rsync --delete` ou `unison -force`; conflitos em `batch` tratados por wrapper).
- D2 dotfiles: chezmoi (templates por host).
- D3 repositório de dotfiles: GitHub privado com segredos cifrados por age.
- D4 VS Code: chezmoi para settings/keybindings/snippets + manifesto de extensões; Settings Sync desligado.
- D5 escopo: home **inteira** com lista de exclusão (pré-voo barra caminhos do chezmoi e repositórios Git sem exclusão).
- D6 chaves SSH pessoais: uma por máquina, distribuídas por Ansible ou `sshPublicKey` no OpenLDAP.
- D7 gatilho: **sempre manual** (sem Wake-on-LAN, timer ou `--auto`); chave de sincronização com passphrase.
- D8 implementação: Python fino (pré-voo, salvaguardas, conflitos, relatório) + Ansible para sistema/pacotes/`/etc` + Bash só no bootstrap.
- D9 backup dedicado da home: **não adotado** (bancos são de dev em containers); rede de segurança = cópias do Unison (`maxbackups` maior) + travas obrigatórias contra apagamentos e alterações em massa; backup único do notebook antes da baseline continua obrigatório.
- D10 Docker: **tudo** — compose, volumes (export/import a frio com checksum e escolha de lado em conflito) e imagens (lista de registry ou `docker save/load`).
- D12 segredos: manter `.secrets/` via Unison sobre SSH (700/600); migração para chezmoi + age adiada no CR-001.
- D13 Terraform: só treinamento → `*.tfstate` sincronizado, `.terraform/` excluído; não rodar `apply` no mesmo projeto nas duas máquinas entre ciclos.
- D14 histórico do terminal: sincronizado por união de linhas com timestamp (`merge` do Unison + `HISTTIMEFORMAT`/`histappend`).
- D15 kubeconfig: só treinamento → sincronizado (cache excluído).
- D16 painel e applets do Cinnamon: por máquina (dependem do layout de monitores).
- D17 sincronização: só rede local.
- Firewall: **nunca sincronizado**; notebook com política mais restrita; regras por host no Ansible.
- Orquestrador: **desktop** (decidido pelo Yves); só o notebook roda sshd.

## Achados da análise crítica

- Primeira execução do Unison sem archive ressuscita arquivos apagados no desktop: `prefer` só resolve conflitos.
- Sudoers com curinga no apt equivale a root (opções `-o` executam comandos) → wrapper validado ou senha no início do ciclo.
- dconf não tem timestamp por chave → merge de três vias por chave; `dconf load` não remove chaves.
- C3 fazia pull/push antes do gate de aprovação; dconf era importado antes de instalar applets.
- Bind mounts de bancos dentro de projetos e `~/.local/bin` com links do pipx não podem ir pelo Unison.

## Implementação

- sshd (Adendo 01): roles Ansible `sshd_sync_server` (notebook) e `sshd_sync_client` (desktop) + despachante Python `machine-sync-remote` (lista branca, sem shell, log JSON + syslog).
- Controles de acesso do notebook ficam root-owned fora da home (`/etc/ssh/authorized_keys/%u`, `/etc/machine-sync/`), porque a home é sincronizada inteira.
- sshd do notebook só liga na conexão cabeada de casa (gatilho do NetworkManager por UUID); UFW libera a porta 22 só para o IP do desktop.
- Ansible roda local em cada máquina (`-c local -K`); a chave de sincronização não permite rodar Ansible remotamente (proposital).
- Gotcha: o Unison 2.53.3 (Noble/Mint 22) chama o servidor como `unison -server __new-rpc-mode`; a lista branca precisa desse argv exato.
- Gotcha: `ListenAddress` com IP inexistente impede o sshd de subir; por isso o gatilho de rede.
- Validação: ansible-lint perfil production; 46 doctests, 16 pytest, ruff e mypy strict; sshd real + sincronização Unison bidirecional em Ubuntu 24.04. Execução completa dos roles com systemd ainda não testada.

## Arquivos (pasta compartilhada do projeto no Claude)

- `analise-plano-sincronizacao/analise-plano-sincronizacao-mint22.md` — análise crítica completa.
- `analise-plano-sincronizacao/resumo-simplificado.md` — versão em linguagem simples.
- `analise-plano-sincronizacao/decisoes-d1-d10.md` — registro de D1–D17 e impactos.
- `analise-plano-sincronizacao/change-requests/CR-001-segredos-chezmoi-age.md` — CR adiado.
- `analise-plano-sincronizacao/adendo-01-sshd-ansible-python.md` — substitui as seções 7.2 e 7.3 do plano.
- `implementacao/sshd/` — Ansible (inventory, playbook, roles) e Python (despachante + testes).

## Pendências

- Preencher `host_vars` reais (IPs, chave pública de sincronização, UUID da conexão cabeada, impressão digital do notebook).
- Rodar os roles com `--check --diff` nas máquinas (home015 primeiro) e aplicar.
- Criar a chave `~/.ssh/machine_sync_ed25519` com passphrase; nenhuma chave atual de `~/.ssh` tem passphrase. Chave do archaris = `~/.ssh/id_rsa` (mesma das VPS).
- Excluir `~/.ssh/` da sincronização (chaves por máquina, D6).
- Fase 0 (inventário, incluindo segredos e pastas XDG) antes da baseline.
- Mergear o PR #3, aplicar roles (home015 → home016) e rodar `machine-sync baseline docker --from <lado>`; validar com Unison real.
- Roles de C2/C2.5 (pacotes) e expansão para a home inteira (cache de hash).
- CR-001 (segredos com chezmoi + age) aguardando reabertura.

## Revisão de 26/10/2026 (questionário respondido)

- Máquinas: **home016** = desktop e master (orquestrador); **home015** = notebook e slave. home011 não participa.
- Questionário respondido: `~/Documentos/DevOps/Projetos/sync-note-desktop/questionario-2026-10-26.md`.
- Transporte: **Unison sobre SSH** (como no plano D1; despachante `machine-sync-remote` com lista branca). sshfs descartado de todo o projeto (decisão do Yves, 26/10/2026).
- Script CIFS `~/.local/bin/home015-mount.sh` (share `docs_share`, senha em texto puro) a descartar; acesso entre as máquinas só por chave SSH.
- Deleções: perguntar sempre, em lote com relatório + confirmação no terminal; opções apagar no outro lado / restaurar / ignorar desta vez; apagado×alterado é conflito.
- Lixeira: backups do Unison em `~/.local/share/machine-sync/backups/` (excluída da sincronização), limpos (> 7 dias) no início de cada ciclo manual.
- Renomeação/movimento: detectada por hash (apagado × criado) e aplicada **automaticamente** no outro lado, só registrada no relatório (exceção ao "perguntar sempre").
- Piloto: pasta `~/Documentos/DevOps/docker` (só DEV, nada sigiloso), **incluindo** dados de bancos em bind mount (donos de container): containers parados nas duas máquinas antes do ciclo; Unison com sudo no wrapper para esses arquivos. Containers rodam sob demanda nas duas máquinas.
- Ordem: 1) Ansible (unison 2.53.x, chaves SSH por máquina, sshd no notebook + client no desktop, UFW) → 2) orquestrador Python no piloto → 3) home inteira → 4) chezmoi. Instalação de Unison e chezmoi autorizada.
- Script CIFS `home015-mount.sh`: movido para a lixeira em 26/10/2026 (senha do Samba da home011 continua válida até ser trocada).

## Reescrita do passo 1 (26/10/2026)

- O código da sessão de 19/10 (roles + despachante) não existia localmente; reescrito do zero.
- Repositório: `~/Documentos/DevOps/Projetos/sync-note-desktop`, remoto GitHub privado `yvesmarinho/sync-note-desktop` (criado vazio em 26/10/2026), branch `001-ansible-sshd-sync`; questionários em `docs/questionarios/`.
- Usuário administrativo `archaris` (ADR-003): existe no home016 (uid 1501, grupos adm/sudo); role `admin_user` cria igual na home015, senha bloqueada, só chave (`/etc/ssh/authorized_keys/archaris`, from= desktop), `NOPASSWD: ALL`. Permite Ansible remoto desktop → notebook (flexibiliza "Ansible só local").
- sshd ativo na home016 (`ssh.socket`) mantido de propósito (Yves, 26/10/2026).
- Despachante `machine_sync_remote` (só stdlib, Python 3.12): argv exato da lista branca → `os.execve` sem shell; auditoria JSON em `/var/log/machine-sync/` + syslog AUTH; saídas 0/1/2/3/4.
- Lista branca: `unison -server __new-rpc-mode` (usuário), `unison-root -server __new-rpc-mode` (sudo -n, via `servercmd` no cliente, só com `sshd_sync_server_allow_root_unison`), `machine-sync docker-running` (pré-voo).
- Roles: `machine_sync_common` (Unison 2.53.x, assert de série), `sshd_sync_server` (home015: authorized_keys root-owned com `restrict,from=,command=`, drop-in sshd, sudoers argv exato, ssh.socket/ssh.service desabilitados + gatilho NetworkManager por UUID, UFW por IP), `sshd_sync_client` (home016: exige `~/.ssh/machine_sync_ed25519` com passphrase, alias `home015-sync`, known_hosts dedicado, remove script CIFS).
- host_vars reais em `<host>.yml` (gitignored); `.example` versionados com `CHANGE_ME` barrado por assert.
- ADR-002: Unison servidor como root aceita qualquer raiz pedida pelo cliente → chave de sincronização equivale a root no notebook (risco aceito, mitigado por from=/AllowUsers/UFW/gatilho de rede).
- Gotcha: `ruff --fix` remove `# -*- coding: utf-8 -*-` (UP009); ignorar UP009 no pyproject.
- Validação: 64 testes, cobertura 96%, ruff, mypy strict, ansible-lint production, templates renderizados e validados (sshd -t, visudo -cf, bash -n). Hook de secrets: gitleaks (GitGuardian descartado). PR #1 mergeado em 26/10/2026: https://github.com/yvesmarinho/sync-note-desktop/pull/1 (main = commit inicial vazio).

## Passo 2 — orquestrador (26/10/2026)

- PR #2 (empilhado no #1) mergeado na branch do #1 depois do #1 → PR #3 leva o mesmo conteúdo para a `main`: https://github.com/yvesmarinho/sync-note-desktop/pull/3. Gotcha: com PRs empilhados, mergear de cima para baixo ou retargetar para `main` antes.
- Detecção por **manifesto** (ADR-004): base do último ciclo × manifestos atuais (caminho, tipo, tamanho, mtime, sha256) varridos como root nas duas pontas; Unison só copia (passe principal `-nodeletion`; decisões/renomeações com `-path … -force <vencedor>`).
- CLI `machine-sync` no home016: `baseline <perfil> --from home016|home015` (1ª vez, exige digitar o perfil), `status` (sem alterações), `sync`.
- Pré-voo: `sudo -v`, chave no ssh-agent (`ssh-add -t 3600`), `docker ps` vazio nas duas pontas; lixeira > 7 dias limpa no início; base gravada só sem erro (atômica + flock).
- Sem config SSH de arquivo: o Unison pode rodar como root e o ssh recusa `~/.ssh/config` de outro dono → opções `-o` inline.
- Lista branca do notebook: `unison[-root] -server __new-rpc-mode`, `machine-sync docker-running|manifest <p>|clean-backups <p>` (root via sudoers de argv exato).
- Perfis em `group_vars/all.yml` (`machine_sync_profiles`) → `/etc/machine-sync/profiles.json` (duas pontas) e `~/.config/machine-sync/config.json` (desktop).
- Achado: na pasta piloto há arquivos ilegíveis ao usuário (ex.: `mysql/db_data/binlog.index`) → scanner aborta como usuário; precisa root.
- Achado 26/10/2026: home015 tinha as **mesmas chaves de host SSH** do home016 (clone); chaves do notebook regeneradas pelo Yves. Verificar `/etc/machine-id` duplicado.
- Chave `~/.ssh/machine_sync_ed25519` criada com passphrase (guardar em gerenciador de senhas; carregar com `ssh-add -t 1h`).

## Histórico

- [[daily/2026-10-19]] — análise do plano, resumo, decisões D1–D17, CR-001 e Adendo 01 (sshd com Ansible e Python).
- [[daily/2026-10-26]] — revisão, correção dos hosts (home016 ↔ home015) e questionários de decisões (deleções, piloto); sshfs descartado em favor de Unison sobre SSH; passo 1 reescrito (PR #1) e passo 2 orquestrador (PRs #2/#3).
