---
tags: [project, local-bin, python, scripts, tooling]
aliases: [~/.local/bin]
created: 2026-08-03
updated: 2026-08-03
source: importado de 1 sessão do Claude Code (~/.claude/projects/-home-yves-marinho--local-bin/)
---

<!-- Criado em: 03/08/2026 09:40 -->
<!-- Modificado em: 03/08/2026 09:40 -->

# Scripts em ~/.local/bin

Diretório de scripts CLI pessoais do usuário. A sessão registrada criou e testou `~/.local/bin/gen_secrets.py`, um gerador de secrets (senhas, API keys e chaves GPG) executável via CLI, com idempotência e registro extensível de tipos.

## Decisões e convenções duráveis

- Arquitetura: padrão Strategy + registry — novos tipos de secret são adicionados criando subclasse de `SecretGenerator` com decorator `@register("tipo")`, implementando apenas `generate(opcoes)`.
- Somente stdlib — sem dependências externas; GPG é gerado chamando o binário `gpg` via `subprocess` (`--quick-generate-key`, curva ed25519).
- Idempotência: cada secret é identificado por `tipo:nome` e persistido em `.secrets/generated_secrets.json` (relativo ao diretório de execução), com permissões restritas (dir `0700`, arquivo `0600`). Chamada repetida com mesmo nome retorna o valor salvo; flag `--force` regenera.
- Segurança do GPG: só o fingerprint da chave é salvo no JSON de estado — a chave privada permanece no keyring do GnuPG, nunca é persistida em arquivo.
- Exibição: valor sai mascarado (`********`) por padrão; flag `--show` exibe em claro.
- Script segue as regras globais de Python do usuário: shebang `#!/usr/bin/env python3`, logging estruturado, type hints, docstrings RST com doctest, validação de parâmetros, exceções específicas, `pathlib`, timezone `America/Sao_Paulo`, cabeçalho padrão com metadados.
- Uso: `gen_secrets.py <password|apikey|gpg> <nome> [opções]`, `gen_secrets.py --list-types`.

## Problemas resolvidos

- Testes confirmaram que a idempotência funciona: segunda chamada com o mesmo nome não regera o secret, apenas retorna o registro existente.

## Pendências

- Nenhuma pendência explícita registrada na sessão.
