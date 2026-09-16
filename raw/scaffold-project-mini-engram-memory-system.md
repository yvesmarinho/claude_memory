<!-- Criado em: 16/09/2026 09:00 -->
<!-- Modificado em: 16/09/2026 10:57 -->

# Arquivo — Mini-Engram Memory System (scaffold-project)

Conteúdo de `.memory/` removido do repositório `scaffold-project` em
16/09/2026 (branch `chore/declarar-deps-rich-pyyaml`) — feature template de
memória (IMP-59) ainda não commitada (repo sem histórico até então), cujo
`.memory/memories/**` continha só fixtures de teste triviais (sem valor
durável) e `.memory/index/memory.db` era cache SQLite regenerável. Removido
do stage, `.memory/` adicionado ao `.gitignore`. README e MEMORY_POLICY
preservados abaixo por documentarem a arquitetura da feature (útil caso o
subsistema seja reativado/commitado no futuro).

Ver nota [[../projects/scaffold-project|scaffold-project]] para o resumo.

---

## README.md original

# Mini-Engram Memory System

**Status**: ✅ Active (IMP-59)
**Purpose**: Persistent memory for GitHub Copilot context retention
**Architecture**: Text-first (markdown source + SQLite FTS5 cache)

### Directory Structure

```
.memory/
├── memories/                  # Source of truth (versionable, committable)
│   ├── project/               # Project-level memories (architecture, patterns)
│   ├── team/                  # Team-level memories (onboarding, processes)
│   ├── sessions/               # Session-specific learnings
│   └── .templates/            # Example templates
├── index/                     # SQLite cache (gitignored, rebuildable)
│   └── memory.db              # FTS5 index
├── README.md
└── MEMORY_POLICY.md
```

### Core concepts

- Source of truth: markdown files em `.memory/memories/**` com frontmatter
  (`title`, `category`, `tags`, `created`, `updated`).
- Índice: `.memory/index/memory.db` (SQLite FTS5, gitignored, regenerável via
  `python scripts/mem_rebuild.py`).
- CLI: `scripts/mem_save.py`, `scripts/mem_search.py`, `scripts/mem_context.py`
  (`--auto` sugere memórias relevantes a partir da branch/commits atuais),
  `scripts/mem_stats.py`, `scripts/mem_rebuild.py`.
- Integração Makefile: `make memory-save|search|context|rebuild|health|test`.
- Recomendação de commit: `project/` e `team/` sim; `sessions/` não (pessoal).
- Comparação com Engram oficial (IMP-45): Mini-Engram é Python stdlib, zero
  dependências, mais lento (<100ms vs <50ms); decisão registrada foi começar
  com Mini-Engram e migrar se necessário.
- Status ao ser arquivado: 46/46 testes passando, fase de documentação
  concluída, mas `.memory/memories/**` só continha fixtures de teste (não
  memórias reais de projeto/time).

## MEMORY_POLICY.md original — pontos-chave

- Princípio IV (Zero-Trust on Secrets) aplicado também a `.memory/memories/`:
  nunca credenciais, PII, connection strings, chaves SSH/certificados —
  sempre referenciar onde o segredo está guardado (`.secrets/`), nunca o
  valor.
- Proibido salvar saída de comandos sensíveis (`kubectl get secret`, `cat
  .env`, `printenv`, `terraform show`, logs verbosos) e algoritmos
  proprietários completos (só a decisão de alto nível).
- Compliance referenciado: LGPD Art. 46, GDPR Art. 25, SOC2 (CODEOWNERS por
  categoria).
- Enforcement: hook pre-commit + gitleaks (`.gitleaks-memory.toml`, padrões
  para API key/senha/connection string/e-mail/CPF em `.memory/memories/*.md`),
  scan em CI (`.github/workflows/security-scan.yml`), sanitização em runtime
  (`scripts/lib/sanitize.py`), auditoria (`make memory-audit`).
- Regra de segredo vazado: remover, commitar fix, **rotacionar o segredo**,
  purgar do histórico Git (`git filter-repo` + `push --force`) se já tiver
  sido pushado.
