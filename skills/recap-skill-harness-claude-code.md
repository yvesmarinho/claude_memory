---
tags: [claude-code, skill, harness, hooks, recap, changelog, auditoria, git]
aliases: [recap skill, skill recap, harness de recapitulação, change journal, /recap]
created: 2026-10-06
updated: 2026-10-06
---

# Skill + Harness para recapitular alterações de um projeto (Claude Code)

> Conversa de 2026-10-06 com o Claude (claude.ai).
> Pergunta: *"Que tipo de habilidade e harness utilizo num prompt do Claude para recapitular todas as alterações num projeto para meu controle?"*

Relacionado: [[jsmastery-scope-skill-analysis]] · [[CLAUDE]]

---

## Princípio central

Separar três coisas:

1. **Procedimento** de recapitular → *skill*
2. **Captura** das alterações → *harness* (hooks do Claude Code + git)
3. **Destino** do relatório → arquivos versionados no repo (e/ou este vault)

O modelo não lembra de nada entre sessões e perde detalhe após `/compact`. Pedir "recapitule o que fizemos" sem dados = reconstrução de memória (inventa/omite).

**Regra: captura determinística (hooks + git); síntese probabilística (modelo). O modelo só resume o que foi gravado.**

## 1. Resposta direta

| Peça | O que usar | Por quê |
|---|---|---|
| **Skill** | Workflow skill de invocação manual: `.claude/skills/recap/SKILL.md` com `disable-model-invocation: true`, chamada com `/recap [desde]` | Você controla quando roda; procedimento versionado; ferramentas restritas a leitura do git |
| **Harness** | Claude Code com hooks `PostToolUse` (Edit/Write/MultiEdit/Bash), `PreCompact` e `SessionEnd`, gravando diário JSONL por sessão | Hooks sempre executam, independem do modelo, sobrevivem à compactação |
| **Fonte da verdade** | `git log` / `git diff` / `git status` | Pega também alterações manuais no VS Code |
| **Isolamento (opcional)** | Subagente `change-auditor` somente leitura | Diffs grandes não poluem o contexto principal |
| **Saída** | `docs/recaps/AAAA-MM-DD-HHMM-recap.md` + `.json` com `schema_version`, e `[Unreleased]` do `CHANGELOG.md` | Histórico auditável e legível por máquina |

Instrução no `CLAUDE.md` ("ao terminar, registre o que mudou") **não é harness** — é probabilística; é ignorada quando o contexto enche, a tarefa é interrompida ou após compactação. Use o `CLAUDE.md` só para apontar a existência da skill.

## 2. Estrutura de arquivos

```
projeto/
├── .claude/
│   ├── settings.json                 # hooks (versionado no repo)
│   ├── hooks/
│   │   └── change_journal.py         # captura determinística
│   ├── journal/                      # diários JSONL (no .gitignore)
│   │   ├── <session_id>.jsonl
│   │   └── hook.log
│   ├── skills/
│   │   └── recap/
│   │       └── SKILL.md              # procedimento /recap
│   └── agents/
│       └── change-auditor.md         # opcional
├── schemas/
│   └── recap-schema-v1.json
├── docs/recaps/
└── CHANGELOG.md
```

`.gitignore`:

```gitignore
.claude/journal/
.claude/settings.local.json
```

## 3. Harness — hooks em `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/change_journal.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/change_journal.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/change_journal.py\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

Pontos de projeto:

- Um único script trata todos os eventos, decidindo por `hook_event_name` do JSON recebido via stdin.
- O hook **sempre sai com código 0** — auditoria nunca bloqueia o trabalho (exit 2 em `PostToolUse` devolveria erro ao modelo).
- **Só metadados, nunca conteúdo**: caminho, ferramenta, hash, tamanho. Nunca `new_string` do Edit nem conteúdo do Write (evita vazar `.secrets/` / `.env`).
- Comandos Bash registrados **truncados e com redação** de `password=`, `token=`, `api_key=` etc.
- No `SessionEnd`/`PreCompact`, grava snapshot do `git status` para a skill cruzar diário × git.

## 4. Script de captura — `.claude/hooks/change_journal.py`

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
change_journal — Diário determinístico de alterações feitas pelo Claude Code.

Recebe via stdin o payload JSON dos hooks ``PostToolUse``, ``PreCompact`` e
``SessionEnd`` e acrescenta uma linha JSONL em
``.claude/journal/<session_id>.jsonl``.

Regras de projeto
-----------------
* Nunca bloqueia a sessão: ``main()`` sempre retorna 0.
* Nunca grava conteúdo de arquivos, apenas metadados (caminho, hash, tamanho).
* Comandos Bash são truncados e têm credenciais mascaradas.
* Toda falha é registrada em ``.claude/journal/hook.log`` com ``exc_info``.

Contrato de saída: ``schemas/journal-schema-v1.json`` (campo ``schema_version``).

:author: Yves
:version: 1.0.0
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

SCHEMA_VERSION: str = "1.0.0"
FILE_TOOLS: frozenset = frozenset({"Edit", "Write", "MultiEdit", "NotebookEdit"})
MAX_CMD_LEN: int = 300
_SECRET_RE = re.compile(
    r"(?i)(password|passwd|pwd|token|secret|api[_-]?key|authorization)"
    r"(\s*[=:]\s*|\s+)(['\"]?)[^\s'\"]+"
)

LOGGER = logging.getLogger("change_journal")


def setup_logging(journal_dir: Path) -> bool:
    """
    Configura o logger em arquivo dentro do diretório do diário.

    :param journal_dir: Diretório ``.claude/journal``.
    :type journal_dir: pathlib.Path
    :return: ``True`` se configurou, ``False`` em caso de falha.
    :rtype: bool

    >>> import tempfile
    >>> setup_logging(Path(tempfile.mkdtemp()))
    True
    >>> setup_logging("nao-e-path")
    False
    """
    try:
        if not isinstance(journal_dir, Path):
            raise TypeError("journal_dir deve ser pathlib.Path")
        journal_dir.mkdir(parents=True, exist_ok=True)
        handler = logging.FileHandler(journal_dir / "hook.log", encoding="utf-8")
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s %(funcName)s:%(lineno)d %(message)s"
        ))
        LOGGER.handlers.clear()
        LOGGER.addHandler(handler)
        LOGGER.setLevel(logging.DEBUG)
        return True
    except BaseException as exc:  # fronteira de infraestrutura
        logging.error("Falha ao configurar logging: %s", exc, exc_info=True)
        return False


def redact_command(command: str, max_len: int = MAX_CMD_LEN) -> str:
    """
    Mascara credenciais e trunca um comando shell.

    :param command: Comando original.
    :type command: str
    :param max_len: Tamanho máximo do resultado (> 0).
    :type max_len: int
    :return: Comando seguro para registro.
    :rtype: str
    :raises TypeError: Se os tipos forem inválidos.
    :raises ValueError: Se ``max_len`` <= 0.

    >>> redact_command("mysql -u root --password=S3gr3d0 db")
    'mysql -u root --password=*** db'
    >>> redact_command("export API_KEY='abc123'")
    "export API_KEY=***'"
    >>> redact_command("ls -la")
    'ls -la'
    >>> redact_command("x" * 10, max_len=4)
    'xxxx…'
    >>> redact_command(None)
    Traceback (most recent call last):
    ...
    TypeError: command deve ser str
    """
    if not isinstance(command, str):
        raise TypeError("command deve ser str")
    if not isinstance(max_len, int) or isinstance(max_len, bool):
        raise TypeError("max_len deve ser int")
    if max_len <= 0:
        raise ValueError("max_len deve ser > 0")
    safe = _SECRET_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}***", command)
    return safe if len(safe) <= max_len else safe[:max_len] + "…"


def extract_paths(tool_name: str, tool_input: Dict[str, Any]) -> List[str]:
    """
    Extrai os caminhos de arquivo afetados por uma chamada de ferramenta.

    :param tool_name: Nome da ferramenta (ex.: ``Edit``).
    :type tool_name: str
    :param tool_input: Parâmetros da ferramenta.
    :type tool_input: dict
    :return: Lista de caminhos (vazia se não houver).
    :rtype: list[str]
    :raises TypeError: Se os tipos forem inválidos.
    :raises ValueError: Se ``tool_name`` for vazio.

    >>> extract_paths("Edit", {"file_path": "/p/app.py"})
    ['/p/app.py']
    >>> extract_paths("NotebookEdit", {"notebook_path": "n.ipynb"})
    ['n.ipynb']
    >>> extract_paths("Bash", {"command": "ls"})
    []
    >>> extract_paths("", {})
    Traceback (most recent call last):
    ...
    ValueError: tool_name vazio
    """
    if not isinstance(tool_name, str):
        raise TypeError("tool_name deve ser str")
    if not tool_name.strip():
        raise ValueError("tool_name vazio")
    if not isinstance(tool_input, dict):
        raise TypeError("tool_input deve ser dict")
    if tool_name not in FILE_TOOLS:
        return []
    path = tool_input.get("file_path") or tool_input.get("notebook_path")
    return [path] if isinstance(path, str) and path.strip() else []


def file_fingerprint(path: str) -> Dict[str, Any]:
    """
    Calcula sha256 e tamanho do arquivo após a alteração (sem ler para o log).

    :param path: Caminho do arquivo.
    :type path: str
    :return: ``{"exists", "sha256", "size"}``.
    :rtype: dict

    >>> file_fingerprint("/caminho/inexistente")["exists"]
    False
    """
    if not isinstance(path, str) or not path.strip():
        raise ValueError("path deve ser str não vazia")
    p = Path(path)
    if not p.is_file():
        return {"exists": False, "sha256": None, "size": None}
    digest = hashlib.sha256()
    with p.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            digest.update(chunk)
    return {"exists": True, "sha256": digest.hexdigest(), "size": p.stat().st_size}


def git_snapshot(cwd: str) -> Optional[Dict[str, Any]]:
    """
    Captura branch, HEAD e ``git status --porcelain`` do diretório.

    :param cwd: Diretório do projeto.
    :type cwd: str
    :return: Snapshot ou ``None`` se não for repositório git / git ausente.
    :rtype: dict | None
    """
    if not isinstance(cwd, str) or not cwd.strip():
        raise ValueError("cwd deve ser str não vazia")

    def _run(*args: str) -> str:
        return subprocess.run(
            ["git", *args], cwd=cwd, capture_output=True, text=True,
            timeout=5, check=True,
        ).stdout.strip()

    try:
        return {
            "branch": _run("branch", "--show-current"),
            "head": _run("rev-parse", "--short", "HEAD"),
            "porcelain": _run("status", "--porcelain=v1").splitlines(),
        }
    except BaseException as exc:
        LOGGER.warning("git_snapshot indisponível em %s: %s", cwd, exc)
        return None


def build_entry(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converte o payload do hook em uma entrada do diário.

    :param payload: JSON recebido via stdin.
    :type payload: dict
    :return: Entrada versionada.
    :rtype: dict
    :raises TypeError: Se payload não for dict.
    :raises ValueError: Se faltar ``hook_event_name``.

    >>> e = build_entry({"hook_event_name": "PostToolUse", "session_id": "s1",
    ...                  "cwd": "/tmp", "tool_name": "Bash",
    ...                  "tool_input": {"command": "echo token=xyz"}})
    >>> e["schema_version"], e["event"], e["command"]
    ('1.0.0', 'PostToolUse', 'echo token=***')
    """
    if not isinstance(payload, dict):
        raise TypeError("payload deve ser dict")
    event = payload.get("hook_event_name")
    if not isinstance(event, str) or not event.strip():
        raise ValueError("hook_event_name ausente")

    entry: Dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "session_id": payload.get("session_id", "unknown"),
        "cwd": payload.get("cwd", ""),
    }
    if event == "PostToolUse":
        tool = payload.get("tool_name", "")
        tool_input = payload.get("tool_input") or {}
        entry["tool"] = tool
        if tool == "Bash":
            entry["command"] = redact_command(str(tool_input.get("command", "")))
        else:
            entry["files"] = [
                {"path": p, **file_fingerprint(p)}
                for p in extract_paths(tool, tool_input)
            ]
    elif event in ("SessionEnd", "PreCompact"):
        entry["reason"] = payload.get("reason") or payload.get("trigger")
        entry["git"] = git_snapshot(entry["cwd"]) if entry["cwd"] else None
    return entry


def append_entry(entry: Dict[str, Any], journal_dir: Path) -> bool:
    """
    Acrescenta a entrada no arquivo JSONL da sessão.

    :param entry: Entrada gerada por :func:`build_entry`.
    :type entry: dict
    :param journal_dir: Diretório do diário.
    :type journal_dir: pathlib.Path
    :return: ``True`` em sucesso, ``False`` em falha (registrada em log).
    :rtype: bool
    """
    try:
        if not isinstance(entry, dict) or not entry:
            raise ValueError("entry deve ser dict não vazio")
        if not isinstance(journal_dir, Path):
            raise TypeError("journal_dir deve ser pathlib.Path")
        session = re.sub(r"[^A-Za-z0-9_-]", "_", str(entry.get("session_id")))
        target = journal_dir / f"{session}.jsonl"
        with target.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        LOGGER.debug("Entrada gravada em %s: %s", target, entry.get("event"))
        return True
    except BaseException as exc:
        LOGGER.error("Falha ao gravar entrada no diário: %s", exc, exc_info=True)
        return False


def main() -> int:
    """
    Ponto de entrada do hook. Sempre retorna 0 para nunca bloquear a sessão.

    :return: Código de saída (sempre 0).
    :rtype: int
    """
    project = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
    journal_dir = project / ".claude" / "journal"
    setup_logging(journal_dir)
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            LOGGER.warning("stdin vazio — nada a registrar")
            return 0
        append_entry(build_entry(json.loads(raw)), journal_dir)
    except BaseException as exc:
        LOGGER.error("Falha no hook change_journal: %s", exc, exc_info=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Teste antes de ativar:

```bash
chmod +x .claude/hooks/change_journal.py
python3 -m doctest -v .claude/hooks/change_journal.py
echo '{"hook_event_name":"PostToolUse","session_id":"teste","cwd":"'"$PWD"'","tool_name":"Bash","tool_input":{"command":"psql --password=xpto"}}' \
  | CLAUDE_PROJECT_DIR="$PWD" python3 .claude/hooks/change_journal.py
cat .claude/journal/teste.jsonl
```

## 5. A skill — `.claude/skills/recap/SKILL.md`

```markdown
---
name: recap
description: Recapitula todas as alterações do projeto cruzando git e o diário de sessões do Claude (.claude/journal). Gera relatório Markdown + JSON versionado e atualiza o CHANGELOG. Usar apenas quando o usuário invocar /recap.
argument-hint: "[desde: ref git | data AAAA-MM-DD | HEAD~N] (padrão: última tag ou últimos 7 dias)"
disable-model-invocation: true
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git show:*), Bash(git describe:*), Bash(git tag:*), Read, Grep, Glob, Write, Edit
---

# Recapitulação de alterações

## Contexto coletado no momento da invocação
- Branch: !`git branch --show-current`
- HEAD: !`git log -1 --format='%h %s (%ci)'`
- Última tag: !`git describe --tags --abbrev=0 2>/dev/null || echo "sem tags"`
- Pendências não commitadas: !`git status --porcelain=v1`
- Diários disponíveis: !`ls -1t .claude/journal/*.jsonl 2>/dev/null | head -20`

Argumento recebido (ponto de partida): $ARGUMENTS

## Procedimento (seguir na ordem)

1. **Definir a janela.** Se $ARGUMENTS vazio, usar a última tag; sem tag, `--since="7 days ago"`. Data → `--since`; ref → `<ref>..HEAD`.
2. **Coletar commits:** `git log <janela> --no-merges --format='%h|%an|%ci|%s' --numstat`.
3. **Coletar o não commitado:** `git diff --stat` e `git diff --cached --stat` — listar separadamente como **NÃO COMMITADO**.
4. **Ler os diários** `.claude/journal/*.jsonl` com `ts` dentro da janela; agrupar por `session_id`.
5. **Cruzar as fontes** e classificar cada arquivo:
   - `git+journal`: alterado pelo Claude e commitado;
   - `journal-only`: alterado pelo Claude e **não commitado ou revertido** (alertar);
   - `git-only`: **alterado fora do Claude** (manual/VS Code/outra ferramenta).
6. **Ler diffs só onde necessário** para descrever o *porquê*: `git show <hash> -- <arquivo>`. Mais de 30 arquivos → delegar ao subagente `change-auditor`.
7. **Classificar:** feat | fix | refactor | perf | docs | test | infra (Docker/Traefik/Compose/CI) | db (migrations/DDL) | security | config.
8. **Destacar riscos:** migrations, `docker-compose.yaml`, firewall, secrets/env, mudanças breaking de schema (novo `-v<major>`), dependências novas.

## Regras inegociáveis
- Não inventar: toda afirmação cita **hash do commit** ou **arquivo + sessão do diário**.
- Se não estiver nas fontes: "não determinado pelas fontes".
- Nunca copiar conteúdo de `.env`, `.secrets/` ou credenciais.
- Não executar comandos que alterem o repositório (sem commit, checkout, reset, stash).

## Saídas
1. `docs/recaps/<AAAA-MM-DD-HHMM>-recap.md`: Resumo executivo (até 5 linhas) · Janela e fontes · Alterações por categoria · Não commitado · Alterações fora do Claude · Riscos e ações pendentes · Tabela arquivo → commits → sessões.
2. `docs/recaps/<AAAA-MM-DD-HHMM>-recap.json` validável por `schemas/recap-schema-v1.json`, com `schema_version: "1.0.0"`.
3. Atualizar `## [Unreleased]` do `CHANGELOG.md` (Keep a Changelog: Added/Changed/Fixed/Removed/Security), sem duplicar itens.
4. No chat: só o resumo executivo e os caminhos dos arquivos gerados.
```

Por que essas escolhas:

- `disable-model-invocation: true` → o modelo não gera recaps por conta própria no meio de tarefas; você controla.
- `allowed-tools` restrito a git de leitura → a auditoria não altera o que audita.
- Injeção `!`comando`` → estado do git entra no prompt já resolvido, sem depender do modelo lembrar.
- Classificação `journal-only` / `git-only` → mostra o que o Claude fez e não foi commitado, e o que mudou sem passar pelo Claude.

## 6. Subagente opcional — `.claude/agents/change-auditor.md`

```markdown
---
name: change-auditor
description: Analisa diffs grandes em modo somente leitura e devolve um resumo estruturado por arquivo. Usado pela skill /recap quando há mais de 30 arquivos alterados.
tools: Read, Grep, Glob, Bash(git show:*), Bash(git diff:*), Bash(git log:*)
model: sonnet
---
Você recebe uma lista de commits/arquivos. Para cada arquivo devolva JSON:
{"path", "category", "summary" (1 frase), "risk" (none|low|medium|high), "evidence" (hashes)}.
Não interprete intenções sem evidência no diff. Não leia .env nem .secrets/.
```

Ganho: o subagente lê centenas de linhas de diff; para a sessão principal volta só o JSON compacto.

## 7. Contrato — `schemas/recap-schema-v1.json` (núcleo)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "recap-schema-v1",
  "type": "object",
  "required": ["schema_version", "generated_at", "window", "changes", "uncommitted", "outside_claude", "risks"],
  "properties": {
    "schema_version": { "type": "string", "pattern": "^1\\.\\d+\\.\\d+$" },
    "generated_at": { "type": "string", "format": "date-time" },
    "window": {
      "type": "object",
      "required": ["from", "to"],
      "properties": { "from": { "type": "string" }, "to": { "type": "string" } }
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "category", "source", "summary", "evidence"],
        "properties": {
          "path": { "type": "string" },
          "category": { "enum": ["feat","fix","refactor","perf","docs","test","infra","db","security","config"] },
          "source": { "enum": ["git+journal","journal-only","git-only"] },
          "summary": { "type": "string" },
          "evidence": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "uncommitted": { "type": "array", "items": { "type": "string" } },
    "outside_claude": { "type": "array", "items": { "type": "string" } },
    "risks": { "type": "array", "items": { "type": "string" } }
  }
}
```

## 8. Uso no dia a dia

```bash
# interativo, dentro do Claude Code
/recap                 # desde a última tag ou 7 dias
/recap 2026-10-01      # desde uma data
/recap v1.4.0          # desde uma release
/recap HEAD~20

# headless (cron no Mint, fim de expediente, CI)
cd ~/projetos/meu-projeto && \
claude -p "/recap $(date -d 'yesterday' +%F)" \
  --allowedTools "Bash(git log:*),Bash(git diff:*),Bash(git status:*),Bash(git show:*),Read,Grep,Glob,Write,Edit" \
  >> .claude/journal/recap-cron.log 2>&1
```

Passo final opcional na skill: gravar o resumo executivo numa nota diária (`daily/YYYY-MM-DD.md`) ou de projeto (`projects/`) deste vault, com link para `docs/recaps/`. O repositório continua sendo a fonte; o vault é o índice pessoal.

## 9. Consequências e limitações em cascata

1. **Edições via Bash** (`sed -i`, `cat >`, `tee`) só aparecem como comando no diário → git é a fonte da verdade. Opção rígida: hook `PreToolUse` (matcher `Bash`) bloqueando redirecionamentos de escrita (exit 2).
2. **Alterações fora do repo git** (`/etc`, volumes Docker, banco) não entram no `git diff`. DDL só com migrations versionadas. Para infra (Traefik, UFW, iptables), exigir Ansible/Terraform no repo.
3. **Sessões paralelas / worktrees** geram diários distintos; a skill agrega todos. Em worktrees, `CLAUDE_PROJECT_DIR` aponta para a worktree — considerar diretório central (`~/.claude-journal/<repo>/`).
4. **Compactação:** `PreCompact` grava o estado do git antes do `/compact`.
5. **Crescimento do diário:** rotacionar/compactar arquivos > 90 dias (cron ou opção `--prune`).
6. **Hooks em `settings.json` versionado afetam a equipe:** usar `settings.local.json` ou tolerar ausência de `python3`/git (o script já tolera).
7. **Segurança dos hooks:** revisar `.claude/hooks/` como script de CI — executa a cada ferramenta usada.

## 10. No claude.ai (sem Claude Code)

Sem hooks → sem harness de captura. Fornecer os dados manualmente com prompt fixo (instrução de Project):

```
Recapitule as alterações do projeto usando EXCLUSIVAMENTE os dados abaixo.
Não use memória de conversas anteriores como fonte. Classifique em
feat/fix/refactor/infra/db/security/docs, cite o hash de cada item,
separe "não commitado" e liste riscos (migrations, compose, firewall, secrets).
Saída: resumo executivo (5 linhas) + tabela arquivo→commit→categoria.

<git_log>
(cole: git log <desde>..HEAD --no-merges --format='%h|%ci|%s' --numstat)
</git_log>
<git_status>
(cole: git status --porcelain=v1 && git diff --stat)
</git_status>
```

Funciona, mas a captura depende de colar a saída. Controle real = Claude Code + hooks.

## Pendências

- [ ] Gerar os arquivos prontos (hook, settings, skill, subagente, schema) e testes `pytest` do script
- [ ] Testar o hook com `python3 -m doctest -v`
- [ ] Decidir: hooks em `settings.json` (repo) ou `settings.local.json`
