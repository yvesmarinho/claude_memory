---
tags: [project, claude-code, skill, grill-with-docs]
aliases: [grill-with-docs]
created: 2026-08-03
updated: 2026-08-03
source: importado de 1 sessão do Claude Code (~/.claude/projects/-home-yves-marinho--claude-skills-grill-with-docs/)
---

<!-- Criado em: 03/08/2026 09:44 -->
<!-- Modificado em: 03/08/2026 09:40 -->

# Skill: grill-with-docs

Skill do Claude Code, localizada em `~/.claude/skills/grill-with-docs/`, que "interroga" (grill) planos/designs, PRs ou documentação em busca de lacunas, decisões não registradas e divergências entre docs e código — funciona em três modos (A, B, C). A sessão registrada foi de edição/revisão do `SKILL.md` original (42 linhas): identificação de ambiguidades e referências quebradas, e reescrita para ficar autocontida e mais completa.

## Decisões e convenções duráveis

- A skill tem 3 modos: **Modo A** (interrogatório de plano/design, gera ADRs e entradas de glossário), **Modo B** e **Modo C** (checagem de divergência entre documentação e código/PR).
- Modo A é autocontido — não depende mais de skills externas inexistentes (`/grilling`, `/domain-modeling`, referências quebradas que foram removidas).
- ADRs gerados pelo Modo A devem ir em `docs/adr/NNNN-title.md`, com numeração sequencial determinada olhando os arquivos já existentes na pasta.
- ADR/glossário só devem ser criados depois que algo foi de fato decidido — nunca de forma especulativa.
- Idioma dos documentos gerados (ADR/glossário) deve seguir o idioma predominante do repositório/projeto onde a skill está sendo usada (não fixo em pt-BR).
- Modo B inclui instrução explícita de como obter o diff/PR a analisar: `git diff` ou `gh pr diff <N>`.
- Seções que tratam de divergência doc-vs-código são rotuladas explicitamente como aplicáveis só a "Modes B & C", para não confundir com o Modo A.
- Seção "Wrapping up" cobre os três modos: resumo de decisões/ADR no Modo A, resumo de divergências nos Modos B/C.

## Problemas resolvidos

- Referências quebradas a skills inexistentes (`/grilling`, `/domain-modeling`) no Modo A foram removidas, tornando o modo autocontido.
- Ambiguidade sobre como obter o diff no Modo B foi resolvida com instrução explícita de comandos.
- Falta de regra de numeração de ADR e de idioma dos documentos gerados foi resolvida.

## Pendências

- Nenhuma pendência explícita — sessão encerrada com o skill considerado completo.
- Front-matter `allowed-tools` mencionado como opcional, não implementado.
