---
tags: [project, world-mind, obsidian, vault, pkm, triagem]
aliases: [vault pessoal worldmind]
created: 2026-09-18
updated: 2026-09-18
source: sessão Claude Code em /home/yves_marinho/Documentos/DevOps/world-mind
---

<!-- Criado em: 18/09/2026 -->
<!-- Modificado em: 18/09/2026 -->

# World-Mind

Vault Obsidian pessoal (PKM/DevOps) do usuário, mantido com apoio do Claude
Code. Segue fluxo captura (`raw/`) → triagem → promoção a conhecimento
permanente (camadas `0-Projetos`, `1-Anotações e Estudos`, `2-Biblioteca`,
`3-Arquivo`, `5-Diário`, `6 - Cases`, `Clippings`). Repositório Git próprio
(`yvesmarinho/world-mind`), distinto do `claude_memory` (memória do
Claude) e do `mnemosine` (ferramenta Python que reorganiza o
`worldmind-vault`, outro vault). Acesso sempre por filesystem
(Read/Write/Edit), nunca via `obsidian-rest` (reservado ao `claude_memory`).

## Sessão de 18/09/2026 — Triagem em lote de `raw/` + síntese de Agents

- Executada a skill `triagem-raw` sobre as 24 notas pendentes de `raw/`
  (tag `reclassify` ou sem `type`): frontmatter migrado para o **esquema
  plano** do vault (`title`/`description`/`created`/`source`/`tags`/`type`
  no nível raiz — não o legado aninhado `metadata.*`), tag `reclassify`
  removida, cada nota movida para a pasta definitiva.
- **Critério de fusão de duplicatas** (aprovado pelo usuário, "fundir"):
  quando duas notas cobrem o mesmo livro/tema, manter a versão **mais
  completa** como arquivo canônico e anexar a versão menor como seção
  `## Anexo: versão resumida/curta/alternativa` ao final, apagando o
  arquivo menor — nunca reescrever o corpo da versão mantida. Aplicado a:
  Learning to Think Strategically (Sloan), Meditações Livro 1 (Marco
  Aurélio), Refactoring (Fowler v1/v2).
- Nomes de arquivo com espaço/maiúsculas irregulares → renomear para
  kebab-case só quando o usuário aprovar explicitamente (não é regra
  automática da skill `triagem-raw`).
- `raw/` fica só com `index.md` (painel de triagem permanente) depois da
  triagem — nunca deletado.
- Todo lote de triagem é registrado em `5-Diário/YYYY-MM-DD.md` (objetivo,
  tabela nota→destino, fusões, exceções) — mesma convenção usada em
  02/09/2026.
- A partir da triagem, gerada uma nota de síntese consolidando conhecimento
  de agent/skill-building das notas de `1-Anotações e Estudos/AI/`:
  `1-Anotações e Estudos/AI/sintese-tecnologias-para-criar-agents-claude.md`
  — cobre arquitetura de Claude Code Skills, CLAUDE.md/AGENTS.md, MCP,
  Spec-Driven Development/Wayfinder, recursos de plataforma Claude. Notas
  de opinião/mercado (ex.: "AI Engineers", "vibe coding") e as subpastas
  `Livekit/`/`Openai/` (infra de voz/API, não sobre agent-building) foram
  deliberadamente excluídas dessa síntese.
- Fluxo de trabalho git usado: branch `docs-triagem-raw-18-09` → commit →
  push → PR (`gh pr create`) → **PR #2 mergeado em `main`** (fast-forward,
  `--delete-branch`) a pedido explícito do usuário.

## Convenções confirmadas nesta sessão

- Pastas temáticas já existentes (evitar duplicar): `1-Anotações e
  Estudos/AI`, `.../Books`; `2-Biblioteca/Filosofia` (com subpasta
  `Neurociência`), `.../Aprendizado`, `.../PKM`, `.../Software Eng`.
- Índices de pasta estáticos (`{Pasta}.md`) são gerados manualmente/pontual
  e **não** se atualizam sozinhos — precisam ser reescritos à mão a cada
  nota nova/movida (o `CLAUDE.md` do vault já avisa que não são fonte de
  verdade, a fonte é o `WorldMindDB.base`, mas o usuário ainda pede updates
  manuais neles).
