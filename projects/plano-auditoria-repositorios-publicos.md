---
tags: [project, seguranca, auditoria, github, plano, checklist]
aliases: [auditoria repos públicos, plano de auditoria dos repositórios, auditoria de visibilidade]
created: 2026-10-20
updated: 2026-10-20
source: sessão Claude (cloud) 2026-10-20 — levantamento de visibilidade dos repositórios da conta após RAI-2026-001/002
---

<!-- Criado em: 20/10/2026 14:23 -->

# Plano — auditoria dos repositórios públicos da conta

Aplicar o processo de [[auditoria-seguranca-repositorios]] aos repositórios da conta que estão **públicos**. Levantamento feito em 20/10/2026 (lista de repositórios com visibilidade). Objetivo de cada item: decidir a visibilidade correta, varrer **todo o histórico** em busca de credenciais, dados de clientes, backups e informação interna de infraestrutura, remediar e registrar o resultado.

## Critério de prioridade

- **P0** — conteúdo interno conhecido com detalhe de infraestrutura: tornar privado antes de qualquer análise.
- **P1** — repositório próprio com nome/escopo corporativo (`enterprise-*`, automações de e-mail/n8n, organização `admin-vya-digital`).
- **P2** — fork público com adaptação corporativa (commits próprios por cima do upstream).
- **P3** — projeto pessoal/open source próprio: só varredura de segredos.
- Forks sem commits próprios: fora do escopo (só confirmar que não há commits próprios).

## P0 — tornar privado imediatamente

- [ ] **claude_memory** (este vault, público) — contém notas com hosts, portas, usuários e mecanismos de acesso da frota (ex.: nota do enterprise-ansible), índices de projetos e diárias de clientes. Ação: tornar privado; depois varrer o histórico (inclusive `.claude/`, `raw/` e diárias). Confirmar que `.secrets/` nunca foi commitado (`git log --all -- .secrets`).

## P1 — repositórios próprios corporativos

- [ ] enterprise-python-n8n-tunning
- [ ] enterprise-update-lab-n8n
- [ ] enterprise-python-analises
- [ ] enterprise-react-ai-channel-frontend
- [ ] email-auto-manager (versão legada de [[enterprise-n8n-workflow]])
- [ ] admin-vya-digital/enterprise-python-agent-ai (organização)

## P2 — forks públicos com possível adaptação corporativa

- [ ] DeskcommCRM (adaptação para Vya.Digital — ver [[deskcommcrm]])
- [ ] enterprise-evo-crm-community (deploy home011→wfdb02 — ver [[enterprise-evo-crm-community]])
- [ ] enterprise-evolui-crm (ver [[enterprise-evolui-crm]])

## P3 — projetos próprios públicos (varredura de segredos)

- [ ] praxisforge · devops-containers · update-fork-repositories · portfolio-generator · scaffold-project
- [ ] pristi · coursework-terraform · radar-vagas-web-scrap · profile-generator · vscode-mcp-rag
- [ ] speckup-sync · yvesmarinho · ai-project-template · vscode-project-switcher
- [ ] PythonCodes · proposed_process_analyzing_demands · python3-cve-db-alerts

## Checklist por repositório

1. Estado inicial pela API: visibilidade, forks, PRs, `traffic/clones` e `traffic/views` (14 dias).
2. Decidir a visibilidade. Se for corporativo, tornar privado **antes** da varredura (no ambiente cloud do Claude a mudança precisa ser feita pela interface web).
3. `git clone --mirror` + `git bundle` + SHA-256.
4. Varredura de todas as versões: `detect-secrets`, dumps/backups (`*.sql`, `*.dump`, `*.bak`, `backup/`), PII (e-mail, telefone, CPF, WhatsApp JID), chaves AWS/URLs S3, tokens (Chatwoot, n8n, Supabase, OpenAI), `.env`, `__pycache__`, logs e saídas de scripts (`docs/evidencias`, `reports/`, `extracted_data/`).
5. Triagem sem exibir valores.
6. Se houver achado: filter-repo, `.gitignore`, push `--force-with-lease`, ramos Dependabot, verificação independente, relatório RAI-2026-0NN.
7. Se não houver achado: registrar "sem achados" com data e hash do HEAD auditado nesta nota.
8. Prevenção: hook pre-commit de segredos (modelo: `.git-hooks/pre-commit.secrets` do enterprise-chathoot-migration), Secret Scanning/Push Protection se disponível.

## Registro de resultados

| Repositório | Data | Visibilidade final | Achados | Relatório |
|---|---|---|---|---|
| enterprise-database-migration | 2026-10-20 | privado | dumps de produção, credenciais | RAI-2026-001 |
| enterprise-chathoot-migration | 2026-10-20 | privado (era público) | links a anexos de clientes, token, PII | RAI-2026-002 |

## Links relacionados

- [[auditoria-seguranca-repositorios]]
- [[2026-10-20]]
