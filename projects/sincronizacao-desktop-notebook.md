---
tags: [project, sincronizacao, linux-mint, unison, chezmoi, ansible, ssh, dotfiles]
aliases: [machine-sync, sincronização desktop notebook, plano-sincronizacao-mint22]
created: 2026-10-19
updated: 2026-10-23
source: projeto "Sincronização Desktop Notebook" no Claude (thread de análise do plano, 19/10/2026)
---

<!-- Criado em: 23/10/2026 10:34 -->
<!-- Modificado em: 23/10/2026 10:34 -->

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
- Rodar os roles com `--check --diff` nas máquinas (ou VMs) e aplicar.
- Fase 0 (inventário, incluindo segredos e pastas XDG) antes da baseline.
- Implementar o orquestrador Python (pré-voo, salvaguardas, wrapper do Unison, relatório) e os roles de C2/C2.5.
- CR-001 (segredos com chezmoi + age) aguardando reabertura.

## Histórico

- [[daily/2026-10-19]] — análise do plano, resumo, decisões D1–D17, CR-001 e Adendo 01 (sshd com Ansible e Python).
