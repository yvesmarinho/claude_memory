---
tags: [project, claude-code, skill, doc-python, python, sphinx]
aliases: [doc-python]
created: 2026-08-03
updated: 2026-08-03
source: importado de 1 sessão do Claude Code (~/.claude/projects/-home-yves-marinho--claude-skills/)
---

<!-- Criado em: 03/08/2026 09:44 -->
<!-- Modificado em: 03/08/2026 09:40 -->

# Skill: doc-python

Sessão em `~/.claude/skills` usando o `skill-creator` para criar do zero a skill `doc-python`, que documenta classes, funções e arquivos Python no padrão reStructuredText com doctests, compatível com Sphinx. Escrita em `~/.claude/skills/doc-python/SKILL.md` (mais `references/sphinx.md`), testada com um eval (`file_sync.py`) rodado via subagente com e sem a skill, verificando que os doctests passam e que nenhuma linha de código foi alterada/removida (só docstrings).

## Decisões e convenções estabelecidas

- Formato de docstring: reStructuredText (`:param:`, `:type:`, `:return:`, `:rtype:`, `:raises:`), compatível com `sphinx.ext.autodoc` e `sphinx.ext.doctest`/`pytest --doctest-modules`.
- Princípio "curta mas suficiente": primeira linha resume em modo imperativo; detalhes só quando o comportamento não é óbvio pela assinatura.
- Todo parâmetro documentado com `:param:`/`:type:`; todo retorno com `:return:`/`:rtype:` — inclusive o caso de retorno `False` em erro (padrão do projeto, alinhado às regras globais de Python).
- Doctest (`:Example:` com `>>>`) incluído quando viável — sem rede, arquivos externos ou estado; senão, exemplificar caso de erro/validação ou omitir.
- Idioma: descrições em pt-BR; código e nomes em inglês (alinhado à regra global de idioma).
- Regra de não-intervenção: documentar é mudança só de docstrings/comentários/cabeçalhos — nunca refatorar código junto, a menos que pedido (alinhado à regra global "mudanças cirúrgicas").
- Cabeçalho de módulo padronizado (`NOME`, `LANG`, `TITULO`, `DATA`, `MODIFICADO`, `VERSÃO`, `HOST`, `LOCAL`, `OBS`, `DEPEND`, tabela `Modifications`, `STATUS: DEV | PROD`) — mesmo padrão já definido nas regras globais de Python do usuário.
- Fluxo de trabalho definido: ler arquivo inteiro → documentar módulo → classes → funções públicas → privadas (funções privadas triviais <3 linhas só levam linha-resumo) → preservar docstrings corretas existentes → atualizar campo `MODIFICADO` → validar doctests com `python -m doctest arquivo.py -v` → relatar ao usuário (arquivos, quantidade de objetos, resultado dos doctests).
- Docstring de classe usa `:ivar:`/`:vartype:` para atributos (inclusive dataclasses); `__init__` dispensa docstring própria se a classe já documenta os parâmetros.

## Problemas resolvidos

- Validação automatizada confirmou que a skill gera docstrings sem alterar nenhuma linha de código funcional (checado via `diff` entre input e output do eval) e que os doctests executam com sucesso (`python -m doctest` + import test).

## Pendências

- Não há evidência na sessão de que a etapa de otimização de descrição (trigger eval / `run_loop`) ou o empacotamento (`package_skill.py`) tenham sido executados — a sessão aparenta ter parado após o primeiro ciclo de eval/iteração. Vale confirmar se a skill `doc-python` já está considerada finalizada ou se ainda há iteração pendente.
