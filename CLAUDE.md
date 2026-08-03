# Vault Obsidian como memória do Claude

Este diretório é um vault Obsidian que funciona como minha memória persistente
entre sessões do Claude Code.

## Regras de operação

- **Antes de responder** a perguntas sobre mim, meus projetos ou preferências,
  consulte `00-index.md` e as notas relevantes em `memory/` e `projects/`.
  Use `grep -ri` / glob para localizar.
- **Ao aprender fatos duráveis** (que ainda serão verdade em meses), grave em
  `memory/<tópico>.md`. Fatos efêmeros (estado de hoje) não vão para memória.
- Conecte notas com **wikilinks** `[[nome-da-nota]]` do Obsidian.
- Todo arquivo de memória começa com **frontmatter YAML**
  (`tags`, `aliases`, `created`, `updated`).
- **Nunca sobrescreva** uma nota inteira sem confirmar; prefira append ou
  edição pontual (str_replace / patch).
- Um fato por linha, prefixado com `- `. Não duplique fatos já registrados;
  edite a linha existente.

## Estrutura

- `memory/`   — fatos persistentes que você grava (perfil, preferências, stack)
- `projects/` — uma nota por projeto
- `daily/`    — notas diárias (`YYYY-MM-DD.md`)
- `.claude/`  — configuração e slash commands do Claude Code

## O que NÃO gravar em memória

Não registre dados sensíveis: senhas, tokens, chaves de API, IDs de governo,
números de cartão. Se aparecerem numa conversa, não os persista.
