# Setup — Vault Obsidian como memória do Claude Code

> **Como usar este arquivo:** salve-o na raiz do seu vault Obsidian e execute,
> a partir do vault, `claude` e então cole:
> `Leia setup-obsidian-memory.md e execute todos os passos, pedindo confirmação antes de cada escrita de arquivo.`
>
> Ou, de forma não interativa (revise antes!):
> `claude -p "Leia e execute setup-obsidian-memory.md integralmente."`

---

## Objetivo

Transformar este vault Obsidian na memória persistente do Claude Code, com:

1. `CLAUDE.md` mestre na raiz do vault
2. Estrutura de pastas de memória
3. MOC (Map of Content) em `00-index.md`
4. Slash commands `/remember` e `/recall`
5. Hook `SessionStart` que carrega perfil + preferências automaticamente
6. Permissões restritas de escrita
7. Versionamento Git para segurança
8. (Opcional) MCP server do Obsidian para busca semântica

**Regra geral para o Claude:** não sobrescreva arquivos existentes sem antes
mostrar um `diff` e pedir confirmação. Se um arquivo abaixo já existir, faça
merge preservando o conteúdo atual.

---

## Passo 0 — Verificação de ambiente

Execute e reporte o resultado antes de prosseguir:

```bash
# Confirmar que estamos na raiz de um vault Obsidian
test -d ".obsidian" && echo "OK: vault Obsidian detectado" || echo "ATENÇÃO: pasta .obsidian não encontrada — confirme o diretório"

# Versões das ferramentas
claude --version 2>/dev/null || echo "claude CLI não encontrado no PATH"
git --version
node --version 2>/dev/null || echo "node não encontrado (necessário só para MCP)"

pwd
```

Se `.obsidian` não existir, **pare** e peça ao usuário para confirmar que o
diretório atual é realmente o vault.

---

## Passo 1 — Estrutura de pastas

```bash
mkdir -p memory projects daily .claude/commands
echo "Estrutura criada:"
find memory projects daily .claude -type d | sort
```

---

## Passo 2 — `CLAUDE.md` mestre

Crie o arquivo `CLAUDE.md` na raiz (se já existir, faça merge, não sobrescreva):

```markdown
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
```

---

## Passo 3 — MOC `00-index.md`

Crie `00-index.md` na raiz:

```markdown
---
tags: [moc, index]
created: 2026-08-03
updated: 2026-08-03
---

# 00 — Índice mestre (Map of Content)

Ponto de entrada da memória. Consulte antes de responder.

## Memória

- [[profile]] — quem sou e no que trabalho
- [[preferences]] — como quero que o Claude se comporte
- [[infra-stack]] — stack de infraestrutura que administro

## Projetos

<!-- adicione links para projects/*.md conforme forem criados -->

## Diárias

<!-- daily/YYYY-MM-DD.md -->
```

---

## Passo 4 — Notas iniciais de memória

Crie os três arquivos-base. **Preencha com os dados reais que você já souber
sobre o usuário nesta sessão**; caso não saiba, deixe placeholders comentados e
avise que devem ser preenchidos depois.

### `memory/profile.md`

```markdown
---
tags: [memory, profile]
aliases: [perfil, profile]
created: 2026-08-03
updated: 2026-08-03
---

# Perfil

- Desenvolvedor Python 3 e Bash shell, baseado no Brasil (São Paulo).
- Administra sistemas Linux (usuário avançado do Linux Mint 22, IDE VS Code).
```

### `memory/preferences.md`

```markdown
---
tags: [memory, preferences]
aliases: [preferencias, prefs]
created: 2026-08-03
updated: 2026-08-03
---

# Preferências de comportamento

- Respostas técnicas completas, complexas e detalhadas, sem limite de tamanho.
- Código com tratamento completo de erros para não quebrar em execução.
- Toda função/classe valida parâmetros quanto a vazio e tipagem.
- Docstrings no padrão reStructuredText, incluindo doctest.
- Sempre gerar logs para facilitar o debug.
- `docker-compose.yaml` sem o parâmetro `version`; usar `docker compose` (não `docker-compose`).
```

### `memory/infra-stack.md`

```markdown
---
tags: [memory, infra]
aliases: [stack, infraestrutura]
created: 2026-08-03
updated: 2026-08-03
---

# Stack de infraestrutura administrada

- Bancos: MySQL, PostgreSQL, cluster Percona (MySQL e Postgres).
- Orquestração: Docker, Kubernetes, [[traefik]], Airflow, Ansible, Terraform.
- Observabilidade: Grafana, OpenSearch.
- Comunicação/CRM/automação: Asterisk, Chatwoot, Typebot, FlowiseAI, Botpress, N8N, Vtiger CRM community.
- Diretório/segurança: OpenLDAP, iptables, UFW.
```

---

## Passo 5 — Slash commands

### `.claude/commands/remember.md`

```markdown
---
description: Grava um fato durável na memória do vault
---

Grave o seguinte fato na pasta `memory/` deste vault, escolhendo ou criando o
arquivo temático apropriado (`profile.md`, `preferences.md`, `infra-stack.md`
ou um novo `<tópico>.md`).

Regras:
- Não duplique um fato já registrado; se existir similar, edite a linha.
- Atualize o campo `updated` do frontmatter para a data de hoje.
- Crie wikilinks `[[...]]` para notas relacionadas já existentes.
- Não grave dados sensíveis (senhas, tokens, chaves).

Fato: $ARGUMENTS
```

### `.claude/commands/recall.md`

```markdown
---
description: Busca na memória do vault antes de responder
---

Antes de responder, use grep/glob para buscar em `memory/`, `projects/` e
`daily/` por notas relevantes ao tópico abaixo. Liste os caminhos das notas
encontradas, sintetize o contexto relevante e só então prossiga.

Tópico: $ARGUMENTS
```

---

## Passo 6 — `.claude/settings.json`

Crie `.claude/settings.json`. Se já existir, faça **merge** das chaves `hooks`
e `permissions` sem descartar configurações do usuário:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat 00-index.md memory/profile.md memory/preferences.md 2>/dev/null"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Read(./**)",
      "Write(./memory/**)",
      "Write(./daily/**)",
      "Edit(./memory/**)",
      "Edit(./projects/**)",
      "Edit(./00-index.md)"
    ],
    "deny": [
      "Write(./.obsidian/**)"
    ]
  }
}
```

> A `deny` em `.obsidian/**` evita que o Claude altere a configuração do próprio
> Obsidian. A ausência de `Write` amplo garante que ele só escreva onde autorizado.

---

## Passo 7 — Versionamento Git (rede de segurança)

```bash
# Inicializar repositório se ainda não houver
if [ ! -d ".git" ]; then
  git init
  echo "Repositório Git inicializado."
fi

# .gitignore — não versionar caches e workspace do Obsidian, mas manter config essencial
cat > .gitignore <<'EOF'
.obsidian/workspace.json
.obsidian/cache
.trash/
EOF

git add -A
git status
```

**Peça confirmação** antes do commit:

```bash
git commit -m "chore: configura vault como memória do Claude Code"
```

---

## Passo 8 — MCP server do Obsidian (opcional, busca semântica)

> Só execute se o usuário confirmar. Requer o plugin community
> **Local REST API** instalado e habilitado no Obsidian, com a chave de API
> copiada das configurações do plugin.

Verifique nomes/flags atuais dos pacotes antes de instalar, pois mudam com
frequência. Referência de configuração:

```bash
# Opção A — servidor baseado no sistema de arquivos (sem plugin)
claude mcp add obsidian -- npx -y @modelcontextprotocol/server-obsidian \
  --vault-path "$(pwd)"

# Opção B — via plugin Local REST API (busca por conteúdo e por links)
# ATENÇÃO: o servidor MCP correto para esta opção é o pacote PYTHON
# "mcp-obsidian" (via uvx), não o pacote npm de mesmo nome — esse último
# (@calclavia, npm) é o servidor baseado em sistema de arquivos da Opção A
# e falha com "Usage: mcp-obsidian <vault-directory>" se usado aqui.
#
# A versão 0.2.2 do pacote Python no PyPI é incompatível com versões
# recentes do SDK `mcp` (erro: 'Server' object has no attribute
# 'list_tools'). Fixe a versão do SDK com --with até o pacote ser
# atualizado upstream.
#
# Credenciais: leia a API key de .secrets/obsidian_local_rest_api.json
# (nunca cole a chave direto no comando/histórico do shell).
API_KEY=$(python3 -c "import json;print(json.load(open('.secrets/obsidian_local_rest_api.json'))['api_key'])")
claude mcp add obsidian-rest -e "OBSIDIAN_API_KEY=${API_KEY}" -e "OBSIDIAN_HOST=127.0.0.1" \
  -- uvx --with "mcp==1.1.0" mcp-obsidian
unset API_KEY

# Conferir
claude mcp list
```

`.secrets/obsidian_local_rest_api.json` (criar antes de rodar o comando acima):

```json
{
  "api_key": "COLE_A_CHAVE_DO_PLUGIN_AQUI",
  "host": "127.0.0.1"
}
```

> **Não** coloque a chave de API em arquivo versionado nem na linha de comando.
> Mantenha `.secrets/` no `.gitignore` e leia a chave a partir do JSON.

---

## Passo 9 — Verificação final

```bash
echo "=== Árvore criada ==="
find . -maxdepth 2 -type f \
  \( -name "CLAUDE.md" -o -name "00-index.md" -o -path "./memory/*" \
     -o -path "./.claude/*" \) | sort

echo "=== Teste dos hooks (simula SessionStart) ==="
cat 00-index.md memory/profile.md memory/preferences.md 2>/dev/null | head -40

echo "=== MCP (se configurado) ==="
claude mcp list 2>/dev/null || echo "Nenhum MCP configurado (ok se pulou o passo 8)"
```

Depois disso:

1. Reinicie a sessão do Claude Code dentro do vault e confirme que perfil e
   preferências aparecem carregados no contexto inicial.
2. Teste `/remember uso Traefik com resolver DNS Cloudflare`.
3. Teste `/recall infra-stack` e confirme que ele encontra as notas.

---

## Checklist de conclusão

- [ ] `.obsidian` detectado e diretório confirmado
- [ ] Estrutura de pastas criada
- [ ] `CLAUDE.md` na raiz
- [ ] `00-index.md` (MOC)
- [ ] `memory/{profile,preferences,infra-stack}.md`
- [ ] Slash commands `/remember` e `/recall`
- [ ] `.claude/settings.json` com hook + permissões
- [ ] Git inicializado e commit inicial
- [ ] (Opcional) MCP do Obsidian conectado e testado
- [ ] Verificação final executada e sessão reiniciada com sucesso
