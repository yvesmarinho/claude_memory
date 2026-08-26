---
tags: [project, linkedin-profile-yves, speckit, automation]
aliases: []
created: 2026-08-03
updated: 2026-08-03
source: importado de 2 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Projetos-linkedin-profile-yves/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:30 -->

# linkedin-profile-yves

O projeto **linkedin-profile-yves** automatiza a geração de conteúdo textual para o perfil do LinkedIn de Yves (headline, "Sobre", experiências, skills) a partir de uma fonte única de dados no repositório `yves-eti-br`, seguindo o fluxo Spec-Driven Development (Spec Kit): objetivo → constitution → spec → plan → tasks → implementação.

## Decisões arquiteturais/técnicas duráveis

- Fonte única da verdade: dados vêm exclusivamente de `yves-eti-br/data/*.json` (`bio.json`, `experience.json`, `skills.json`); nunca duplicados manualmente no perfil.
- Decisão arquitetural chave (R1, revertida durante a pesquisa técnica): a LinkedIn API pública não permite escrita programática de headline/resumo/experiências/skills sem parceria aprovada pelo LinkedIn — por isso o projeto gera conteúdo automaticamente, mas a aplicação final no perfil é manual (copiar/colar campo a campo), com destaque dos campos que mudaram a cada execução.
- Sincronização entre repositórios: cópia/sincronização periódica dos dados de `yves-eti-br` para um cache local (`data/synced/`), via `scripts/sync_source_data.py` — não usa git submodule nem checkout no CI.
- Fluxo funcional: `yves-eti-br/data/*.json` → `sync_source_data.py` → `data/synced/` (cache) → `generate_content.py` → `output/linkedin_content_<data>.json`.
- Arquitetura em camadas (DDD leve): `src/domain` (exceções tipadas, validação, contrato Pydantic espelhando `schemas/linkedin-content-schema-v1.json`), `src/application` (`sync_data`, `generate_content`, `diff_content`), `src/infrastructure` (leitura de `yves-eti-br`, cache, notifier, logging).
- Constitution ratificada em v1.0.0 com 5 princípios: (1) Fonte Única da Verdade, (2) Escopo de Conteúdo, Não de UI (sem UI customizada no LinkedIn), (3) Arquitetura em Camadas, (4) Segurança de Credenciais e Dados Pessoais, (5) Qualidade e Automação Contínua (lint/mypy/pytest ≥90% cobertura, idempotência, fail-fast, CI/CD).

## Convenções/padrões adotados

- Idempotência: execução repetida sem mudança de dados não gera novo arquivo de saída.
- Fail-fast: dado de origem malformado/ausente aborta com erro claro, sem corromper o cache anterior.
- Qualidade: `ruff check` limpo, `mypy --strict` sem erros, cobertura de testes 98,65% (gate mínimo do projeto é 90%).
- Scanner de segredos próprio do projeto (`.git-hooks/pre-commit.secrets`, regex-based, sem dependência de API externa) preferido sobre GitGuardian/ggshield quando não há `GITGUARDIAN_API_KEY` configurada (evita hook travado indefinidamente).
- Entregáveis adicionais padronizados: workflow de CI/CD (`.github/workflows/`), ADR de decisões técnicas relevantes, `Makefile`, `.pre-commit-config.yaml`, `src/README.md`.

## Problemas relevantes resolvidos

- Código morto identificado e removido durante a implementação: `src/domain/entities.py` (dataclasses do design original) — o fluxo real usa dicts validados + contrato Pydantic, que já cobrem tipagem/validação sem duplicação.
- Histórico git divergente entre `master` local e `origin/main` remoto (sem ancestral comum) — resolvido via rebase, preservando o `.gitignore` mais completo do projeto local.

## Pendências / próximos passos conhecidos

- Publicação no LinkedIn continua manual: rodar `sync_source_data.py` + `generate_content.py` e copiar o conteúdo de `output/linkedin_content_<data>.json` para o perfil real — não há como importar o JSON diretamente na interface do LinkedIn.
- Reavaliar no futuro se o LinkedIn abre acesso de API de escrita via parceria aprovada, o que poderia reverter a decisão R1 e automatizar a publicação.
- PR de implementação: `yvesmarinho/linkedin-profile-yves` PR #1 (branch `001-linkedin-profile-update`, contra `main`).
