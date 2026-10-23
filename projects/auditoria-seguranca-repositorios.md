---
tags: [project, seguranca, auditoria, incidente, git, github, lgpd, filter-repo]
aliases: [auditoria de repositórios, resposta a incidente repositórios, RAI-2026-001, RAI-2026-002, RAI-2026-003]
created: 2026-10-20
updated: 2026-10-20
source: sessão Claude (cloud) 2026-10-20 — auditoria e remediação de enterprise-database-migration e enterprise-chathoot-migration
---

<!-- Criado em: 20/10/2026 14:23 -->

# Auditoria de segurança de repositórios GitHub

Frente de trabalho de **auditoria e resposta a incidente** em repositórios GitHub da conta `yvesmarinho`: busca por dados sensíveis versionados (backups/dumps de banco, credenciais, dados de clientes) em **todo o histórico**, remoção com reescrita de histórico, verificação independente e relatório formal ao cliente. Plano de continuação: [[plano-auditoria-repositorios-publicos]].

> Nota sanitizada de propósito: este vault é sincronizado com um repositório GitHub. Valores, hosts, nomes de bucket, nomes de clientes e detalhes de vulnerabilidades ainda abertas ficam **somente** nos relatórios .docx entregues (fora do vault).

## Incidentes tratados em 2026-10-20

### RAI-2026-001 — enterprise-database-migration (privado)
- Pasta local real: `~/Documentos/DevOps/Vya-Jobs/enterprise-database-migration` (não `~/VyaJobs/…`).
- Achados: 2 dumps completos de produção versionados (Metabase/PostgreSQL ≈19,5 MB e PerfexCRM/MySQL ≈5 MB, com dados pessoais), senhas de conexões em texto puro no dump do Metabase (sem `MB_ENCRYPTION_SECRET_KEY`), 39 hashes SCRAM de roles, senhas reais em `secrets/`, docs, scripts e `.pyc`.
- Correção de análise: `generated_scripts/01_create_users.sql` tem senhas **mascaradas** (`'********'`), não reais.
- Remediação: `git filter-repo` removendo `backup/`, `secrets/`, extração com hashes e todo `__pycache__/` + `--replace-text` de 15 segredos; `.gitignore` reforçado; push `--force-with-lease`; main `f8c9c19 → a400b7d`. Dependabot fechou os PRs e apagou os próprios ramos sozinho.
- Verificação independente: clone novo, 0 caminhos sensíveis, 0 segredos em 517 blobs.

### RAI-2026-002 — enterprise-chathoot-migration (era PÚBLICO → privado)
- Repositório estava **público**; 7 clones de 7 origens nos 14 dias anteriores.
- Achados: `docs/evidencias/` com centenas de links diretos a anexos de conversas de clientes em bucket S3 que respondiam **sem autenticação**; token de API do Chatwoot em 3 docs; 1 WhatsApp de pessoa física e 1 e-mail de cliente em docs.
- Remediação: visibilidade → privado (feita pela interface web, ~12:46); filter-repo removendo `docs/evidencias/` + redação de 3 valores; `.gitignore` ampliado; push dos ramos `master` (`e355875 → c4b1b4f`) e `001-enterprise-chatwoot-migration` (`41fa346 → 79ed237`).
- Desta vez o Dependabot **não** fechou os PRs após a reescrita: 12 ramos `dependabot/*` ficaram com o histórico antigo.

### RAI-2026-003 — resposta ao relatório de Red Team de um cliente (20/10/2026)
- Origem: o Red Team do cliente (relatório de 19/10/2026) encontrou o dump e uma credencial de banco nos repositórios acima e usou a credencial para conectar no MySQL do servidor de dados pela internet, sem SSL.
- Constatação: o banco da configuração vazada (`empresa_desenvolvimento`) já não existia (nem MySQL nem PostgreSQL), mas o usuário `enterprise_user` seguia ativo no MySQL, com `CREATE, DROP ON *.*` → podia apagar qualquer banco do servidor (não tinha SELECT nos demais). Os dados do cliente mostrados pelo Red Team vieram do dump publicado, não do servidor.
- Execução: script `purge_leaked_db_config.py` em `enterprise-database-tests/scripts/security/` (modos `--inspect`, `--dry-run` padrão e `--execute --confirm <banco>`; evidências JSON + `SHA256SUMS`, só metadados). Rodado pelo titular na própria estação (`.venv` do projeto): 2 simulações e 1 execução → `DROP USER 'enterprise_user'@'%'` OK às 15:24:24, verificado.
- Relatório **RAI-2026-003** (.docx, 20 p.) + pacote de evidências + planilha de acompanhamento `Acompanhamento_RedTeam_<cliente>.xlsx` (abas Resumo / Apontamentos / Pendências, P-01..P-09) — tudo na pasta local do cliente em `~/Documentos/Vya Digital/Clientes/`.
- Situação dos 5 apontamentos do Red Team: 4 tratados, 1 parcial (acesso ao banco pela internet: credencial revogada, mas endurecimento de rede/TLS ainda não executado — decisão do titular pendente).

## Processo padrão (playbook reutilizável)

1. Registrar estado inicial pela API (visibilidade, forks, PRs, `traffic/clones`).
2. **Se público: contenção primeiro** (tornar privado) antes de auditar.
3. Preservar: `git clone --mirror` + `git bundle create --all` + `sha256sum` (custódia temporária, destruir depois).
4. Extrair **todas as versões de todos os arquivos** (`git rev-list --all --objects`) e varrer com `detect-secrets` + varredura dirigida (dumps por assinatura, PII, chaves AWS, URLs S3, hashes).
5. Triagem **sem exibir valores** (só tamanho, classe de caracteres, contagem; cruzar valores por comparação binária).
6. `git filter-repo --invert-paths --path … --replace-text replacements.txt` (marcadores `***REMOVED-SECRET***` / `***REMOVED-PII***`). Arquivos cujo propósito é dado sensível são removidos; código/docs que só contêm um valor são redigidos.
7. Reforçar `.gitignore`; commit com mensagem `chore(security): …`.
8. `git push --force-with-lease=<ramo>:<sha-antigo>` por ramo; tratar ramos derivados (Dependabot).
9. Verificação independente em clone novo; anexar logs com SHA-256.
10. Relatório formal .docx (padrão RAI: capa, controle, sumário executivo, escopo, metodologia NIST SP 800-61, cronologia, achados por severidade, ações, verificação, visibilidade, riscos residuais, LGPD art. 46/48 + Res. CD/ANPD 15/2024, recomendações, anexos com evidências e modelo de chamado ao GitHub Support).

## Lições / limitações do ambiente cloud do Claude

- O proxy GitHub da sessão cloud **bloqueia**: alterar configurações do repositório (visibilidade), apagar ramos remotos e endpoints de usuário (listar repos da conta). Push forçado em ramos existentes funciona.
- Checagem "anônima" via API dá falso 200 (o proxy injeta credenciais); usar a página web (404 = privado).
- O conector `obsidian-rest` deste computador respondeu 40101 (sem API key configurada); a escrita no vault foi feita direto nos arquivos.
- Commits antigos continuam acessíveis por SHA e por `refs/pull/*` até o GitHub Support purgar.

## Lições adicionais (RAI-2026-003)

- **Nunca usar valor real de segredo em exemplo/doctest.** Um doctest do `mask()` foi escrito com a senha vazada e só foi pego pela varredura final dos entregáveis; o arquivo ainda não estava versionado. Sempre varrer os entregáveis (zip/docx/scripts) pelos valores reais antes de entregar.
- MySQL 8.4: privilégio global `CREATE`/`DROP` faz o usuário enxergar **todos** os bancos em `SHOW DATABASES` (explica a lista vista pelo Red Team) sem dar leitura.
- `DROP USER` em MySQL 8.0.22+ falha se o usuário for DEFINER de objetos — exceto quando o admin tem `ALLOW_NONEXISTENT_DEFINER` (aí exclui e deixa órfãos). Verificar DEFINER antes (o script agora bloqueia).
- PostgreSQL: antes de `DROP ROLE`, fazer `REASSIGN OWNED BY … TO <admin>` e só então `DROP OWNED BY …` em cada banco — `DROP OWNED` direto apaga objetos.
- Timeout `2013 … system error: 110` no `mysql-connector` foi transitório (o cliente `mysql` conectava); o script passou a tentar cada IP com driver C e Python puro, registrando as tentativas. Não concluir "porta filtrada" sem testar com o cliente nativo.
- O ambiente cloud do Claude não conecta em bancos externos nem lê credenciais (bloqueio de política) e, sem `device_bash`, não executa no computador do titular: o padrão é entregar script + rodar localmente + validar as evidências.
- Revisão de relatório entregue ao cliente = nova versão (v1.1) com histórico de revisões, nunca edição silenciosa.

## Pendências (do titular)

- [ ] RAI-001: rotacionar credenciais (conexões do Metabase, chaves de API e sessões do Metabase, tokens e senhas do PerfexCRM, user_journey, roles PostgreSQL, n8n).
- [ ] RAI-001/002: chamado ao GitHub Support para purga de cache e `refs/pull/*`.
- [ ] RAI-001/002: apagar e reclonar as cópias locais (desktop e notebook).
- [ ] RAI-002: **bloquear acesso público ao bucket S3 de anexos** e analisar os logs de acesso desde 14/05/2026.
- [ ] RAI-002: revogar e regenerar o token de API do Chatwoot.
- [ ] RAI-002: rodar `remove_dependabot_branches.sh` v2 (roda de qualquer pasta; `--dry-run` primeiro). A v1 exigia estar dentro de um clone e falhou com "não é um repositório git".
- [ ] RAI-001/002: encaminhar ao DPO (prazo de 3 dias úteis para avaliar a comunicação à ANPD).
- [ ] Preencher `[CLIENTE]` e as assinaturas nos dois relatórios.

### Pendências do RAI-2026-003 (planilha P-01..P-09)
- [ ] P-01 (crítica): restringir no UFW as portas de banco do servidor de dados a origens autorizadas — precisa da lista de IPs.
- [ ] P-08: exigir TLS no MySQL (`require_secure_transport = ON`).
- [ ] P-09: restringir a conta administrativa de banco a IPs conhecidos.
- [ ] P-04: confirmar no GitHub Security log se enterprise-database-migration estava público em 19/10 (o Red Team o acessou; a auditoria o achou privado em 20/10 12:04). Se sim → revisão 1.1 do RAI-2026-001.
- [ ] P-06: trocar `[CLIENTE]` pelo nome do cliente no RAI-2026-001 e RAI-2026-002.
- [ ] P-07: consulta de objetos com DEFINER órfão (Anexo C do RAI-2026-003).
- [ ] Ao concluir P-01/P-08/P-09: emitir RAI-2026-003 v1.1 com o apontamento A4 como executado.

## Links relacionados

- [[plano-auditoria-repositorios-publicos]]
- [[indice-vya-jobs]]
- [[2026-10-20]]
