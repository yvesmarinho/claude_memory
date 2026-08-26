---
tags: [projeto, python, cli, portfolio, readme-parsing, ai-summarizer]
aliases: [portfolio-gen]
created: 2026-08-21
updated: 2026-08-21
---

# portfolio-generator

CLI Python que escaneia um diretório raiz (padrão: `~/Documentos/DevOps`) e gera um JSON de
"portfólio" com metadados de cada projeto encontrado: nome, tipo, linguagem, métricas, git,
tecnologias e uma **descrição** (via README ou IA).

- Repositório: `/home/yves_marinho/Documentos/DevOps/Projetos/portfolio-generator`
- Branch de trabalho: `001-portfolio-gen-spec`
- Subcomandos: `init` (marca raízes com `.portfolio-project`), `scan`, `validate`, `report`.

## Arquitetura

- `src/scanner/` — `DirectoryScanner`, detecção de raiz via `.portfolio-project`.
- `src/extractor/` — `git_extractor`, `language_extractor`, `metrics_extractor`,
  `metadata_extractor.scan_project()` (orquestrador principal).
- `src/analyzer/` — `readme_parser.py` (extração heurística de descrição do README),
  `ai_summarizer.py` (fallback via API Anthropic quando README ausente/curto/longo).
- `src/generator/` — `PortfolioGenerator` (monta e escreve o JSON final).
- `schemas/portfolio-schema-v1.json` — contrato de validação (`portfolio-gen validate`).
- `config/scan-exclusions.json` — `excluded_dirs`, lista simples de nomes de pasta a pular.

## Geração de descrição (pipeline)

`extract_description()` pega o primeiro "parágrafo" do README (pula título `#` e linhas
vazias). Se README ausente/curto (`word_count < ai_min_words`, default 30) ou muito longo
(`token_count > ai_max_tokens`, default 2000), cai no fallback via `ai_summarizer` (API
Anthropic, credenciais em `.secrets/api_config.json` — **não configurado neste ambiente**,
então `scan` sem essas credenciais deixa `description_source="ai-unavailable"`/`"empty"`
nesses casos em vez de falhar).

`description_source` válidos no schema: `readme`, `ai-generated`, `filename`, `empty`,
`ai-unavailable`.

## Sessão 2026-08-21 — auditoria e correção de qualidade das descrições

- **mypy/ruff estavam quebrados** havia tempo (TODO dizia "Lint/Type ✅", desatualizado).
  Corrigidos: 2 erros mypy reais em `src/cli/main.py` (sort key acessando `.get()` em
  `object` não tipado — extraídas `_nested_str`/`_nested_int` com `isinstance`, sem
  `type: ignore`); 140 violações ruff (`List`/`Tuple` → `list`/`tuple`, `raise...from`).
- **Bug de causa raiz encontrado por auditoria de output real**: `extract_description()`
  não filtrava badges/shields markdown (`[![...]](...)`), blocos de código (` ``` `) nem
  cabeçalhos de metadados (`**Version**: 1.0.0`) — resultado: ~15% das 55 descrições reais
  escaneadas eram lixo markdown em vez de texto útil. Corrigido com 3 regexes novos
  (`_BADGE_RE`, `_METADATA_RE`, `_FENCE_RE`) + 7 testes novos.
- Descoberto durante a auditoria: **3 dos 55 projetos do scan de junho não existem mais no
  disco** (`Cognitive-Speech-TTS`, `knowledge-lab`, `pmm-dev`) — scan real confirmou (52 →
  hoje 46 após exclusões adicionais).
- Usuário pediu para excluir do scan projetos placeholder/sem valor de descrição:
  `arduino`, `domotica`, `wifi-qrcode-generator`, `yvesmarinho_git_profile`,
  `enterprise-insurance`, `enterprise-kubernets-operation` — adicionados a
  `config/scan-exclusions.json`.
- Criado `README.md` real para `modelos_variados/` (pasta sem descrição própria) — agora
  o scan extrai descrição via README normalmente.
- 3 casos onde o README genuinamente não tem parágrafo descritivo (`code-snippet`,
  `enterprise-docker`, `enterprise-observability`) tiveram a descrição escrita diretamente
  por mim (Claude), sem usar a API Anthropic — `.secrets/api_config.json` não existe neste
  ambiente, então o fallback de IA do próprio `ai_summarizer.py` não pôde ser exercitado.
- Resultado final: `output/portfolio-2026-08-21.json`, 46 projetos, 0 descrições ruins,
  válido contra o schema. `output/` é gitignorado por design (não versionado).
- **INFRA-02 (TODO)**: CI nunca tinha rodado na branch `001-portfolio-gen-spec` — resolvido
  ao abrir PR #7 (`https://github.com/yvesmarinho/portfolio-generator/pull/7`).

## Achados técnicos não corrigidos (registrados para o TODO do projeto)

- `wifi-qrcode-generator` tinha README nomeado `READE.md` (typo) — `README_NAMES` em
  `readme_parser.py` não reconhece variações com erro de digitação.
- `enterprise-kubernets-operation` usava `CLUSTER_README.md`/`START_HERE.md` em vez de
  `README.md` — mesmo problema de nomenclatura não padrão.
- `report --format table/csv` não expõe a coluna `description` (item UX-03 do TODO do
  projeto).
- Linha `---` (separador horizontal markdown) não é filtrada por `extract_description()` —
  achado durante o scan real, ainda não corrigido no parser.

## Notas relacionadas

- [[../daily/2026-08-21|2026-08-21]] — sessão completa desta auditoria
