---
tags: [project, email-auto-manager, n8n, imap, mysql]
aliases: []
created: 2026-08-03
updated: 2026-08-03
source: importado de 2 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Projetos-email-auto-manager/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:29 -->

# email-auto-manager

Projeto que automatiza a organização de uma caixa de e-mail (IMAP) usando **N8N** como orquestrador de workflows, com backend em **MySQL** (database `email_management_system`) e componentes próprios `imap-agent` e `approval-service`. O código-fonte Python vive em `src/`, com stack padrão Python (pyproject.toml, ruff, mypy, pytest) e documentação organizada em `docs/` (architecture, bugs, guides, reference, SESSIONS).

Ver também [[enterprise-n8n-workflow]] — projeto irmão/reescrita v2 deste mesmo domínio (gestão de e-mail via n8n).

## Decisões arquiteturais/técnicas duráveis

- Orquestração via N8N com 4 workflows especificados em `src/email-mgmt/n8n/WORKFLOWS.md`: WF-1 (sync de pastas), WF-2 (processamento de e-mails em 4 stages, o mais complexo), WF-3 (pós-decisão de domínios), WF-4 (purge de quarentena).
- Ordem recomendada de montagem dos workflows: WF-1 → WF-4 → WF-3 → WF-2 (do mais simples ao mais complexo, respeitando dependências).
- WF-2 foi decomposto em 5 etapas montáveis/testáveis separadamente: espinha dorsal, stages dentro do loop, branch de domínio existente, branch de pendência, pós-loop com lembretes.
- Guia visual complementar em `src/email-mgmt/n8n/fluxo-construcao-workflows.md`, com diagramas Mermaid, sem duplicar queries/código — referencia Queries A–H e código D da especificação original.
- Separação estrita de contas de e-mail: a caixa IMAP é a única organizada (lida, classificada, movida pelos workflows); a conta SMTP é usada somente para envio de notificações (chamados, aprovações de domínio, lembretes) e nunca é tocada pela lógica de organização.
- Segurança do binding do N8N: IP literal `127.0.0.1` no `docker-compose.yaml` foi substituído pela variável `N8N_BIND_ADDR` (documentada em `.env.example`), pois o hook de segurança do repositório bloqueia IPs literais versionados.
- Estrutura de diretórios formalizada no `CLAUDE.md` do projeto: `.editor/`, `.git-hooks/`, `.memory/`, `.specify/`, `docs/architecture/`, `docs/bugs/` (obrigatório para cada erro encontrado), `docs/debates/`, `docs/guides/`, `docs/reference/`, `schemas/` (contratos JSON versionados por SemVer, campo `schema_version` obrigatório), `tests/`, `tmp/`.
- Branch principal remota é `main`; a partir da baseline inicial, todo trabalho segue a regra de branch + pull request (nunca push direto em `main`).

## Convenções/padrões adotados

- IDs de credenciais do N8N (IMAP, MySQL, SMTP) são tratados como referências internas da instância, não segredos por si só — podem ficar documentados; senhas/tokens reais permanecem só dentro do N8N e em `.secrets/`.
- Arquivos `*.env.example` devem conter apenas placeholders, nunca valores reais.
- Hook de segurança do repositório bloqueia por padrão de nome (`.env.example`) e por IPs literais em arquivos versionados; exceções exigem ajuste explícito no script do hook.

## Problemas relevantes resolvidos

- Confusão inicial entre as duas credenciais de e-mail: a credencial SMTP foi inicialmente registrada sem distinção clara da credencial IMAP. Corrigido explicitando nos dois lugares (guia + memória) que IMAP é a caixa organizada e SMTP é somente para envio.
- Bloqueio do hook de segurança no commit inicial: rejeitou `.env.example` (padrão de nome) e um IP literal `127.0.0.1` em `docker-compose.yaml`. `.env.example` ficou fora do commit (só placeholders); IP substituído pela variável `N8N_BIND_ADDR`.
- Push inicial direto em `main`: como o repositório remoto estava vazio, o primeiro push (baseline) foi feito direto em `main` — exceção pontual e justificada; dali em diante volta a valer a regra de branch + PR.

## Pendências / próximos passos conhecidos

- Branch local padrão ainda é `master` (existe só localmente); alinhar tudo para `main` é passo futuro opcional.
- Montagem efetiva dos workflows N8N (WF-1 a WF-4) ainda não relatada como concluída nas sessões deste repositório — ver progresso mais avançado em [[enterprise-n8n-workflow]].
- Avaliar se vale adicionar exceção para `*.env.example` no script do hook de segurança, caso se decida versionar esse arquivo.
