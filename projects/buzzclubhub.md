---
tags: [project, buzzclubhub, react, typescript, supabase, vite, rls, rbac]
aliases: [buzzclub, buzzclubhub]
created: 2026-09-03
updated: 2026-10-07
source: sessão de 03/09/2026 (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-buzzclub-buzzclubhub/)
---

<!-- Criado em: 03/09/2026 17:45 -->
<!-- Modificado em: 07/10/2026 09:16 -->

# buzzclubhub

Sistema de jornada e gestão para agência de marketing de influência (clientes, projetos,
campanhas, influenciadores, pedidos de venda, financeiro/BI, contratos,
produção de eventos, press studio, portal do cliente). Interface em pt-BR,
rotas em português. Stack: Vite + React 18 + TypeScript + Tailwind +
shadcn/ui, backend Supabase (Postgres + Auth + RLS + Edge Functions).
Originado no Lovable — `src/integrations/supabase/*` é gerado, não editar à
mão. Em refatoração/hardening ativo via SpecKit
(`specs/001-refatoracao-hardening/`).

## Arquitetura

- Camada de dados: um hook por domínio em `src/hooks/use<Dominio>.ts`,
  encapsulando todo acesso Supabase via TanStack Query — componentes nunca
  chamam `supabase.from(...)` direto.
- Dois contextos de autenticação distintos: `AuthContext` (equipe interna,
  Supabase Auth padrão) e `PortalAuthContext` (clientes externos em
  `/portal/*`, via edge function `client-portal-auth`).
- Autorização por módulo: `useUserRole` lê `user_roles`
  (`admin`/`gestao`/`brand_lead`/`creator_lab`/`financeiro`/`producao`);
  `useModulePermissions` combina papel + overrides por usuário do banco.
  `<ModuleGuard module="/rota">` no `App.tsx` protege rotas.
- Único ambiente Supabase real hoje (sem separação dev/prod formal) —
  `project_id` em `supabase/config.toml`, `.env` aponta pra ele.

## Pessoas

- **Audrey Rimi** (`audrey@buzzclub.co`) — **diretora/founder** da BuzzClub.
  Ao avaliar pedidos de acesso dela, o padrão esperado é acesso amplo
  (equivalente a `admin`/`gestao`), não um papel restrito — um pedido de
  permissão negado pra ela é sinal de inconsistência entre papel atribuído e
  cargo real, não de que o acesso deveria mesmo ser restrito. É provavelmente
  quem tem `admin` no repo upstream (`audreybuzzclub/buzzclubhub-cde04c92`).

## Decisões técnicas duráveis

- **Nunca enfraquecer** `src/test/security-regressions.test.ts` — guarda 8+
  vulnerabilidades de RLS já corrigidas (2026-07-13 em diante); toda
  migration que mexe em RLS/policy precisa manter esses testes verdes.
- Testes de hooks: **mock do client Supabase** (não integração contra
  Postgres local) — mais rápido, sem dependência de Docker no CI. Padrão
  reutilizável em `src/test/mockSupabase.ts` (chainable + "thenable",
  resolve independente de onde o `await` acontece na cadeia; suporta
  `.channel`/`.removeChannel`, `.rpc`, `.storage.from`, `.auth.getUser`),
  `mockAuth.ts`, `renderHookWithProviders.tsx`.
- `security-regressions.test.ts` chama Edge Functions reais — só é
  confiável rodando contra produção (`.env` real), nunca contra Supabase
  local (Edge Functions não rodam no Docker local, gera falso-negativo).
- Ambiente Supabase local via `npx supabase start` tem drift real conhecido
  entre `supabase/migrations/` e o schema de dev (ver
  `docs/bugs/2026-09-03-migrations-drift-local-bootstrap.md`) — pelo menos
  2 divergências, ambas mitigadas por fixtures locais-only (não fiéis ao
  schema real): seed de `user_roles` e tabela `client_onboarding`.
- RBAC/RLS: refatoração atômica de permissões foi **explicitamente adiada**
  pelo usuário para um projeto futuro dedicado, só depois de fechar as
  tasks em andamento (`specs/001-refatoracao-hardening/`). Não propor essa
  refatoração ampla antes disso — tratar pedidos de permissão pontuais com
  correção mínima (ajustar o papel do usuário, não a policy).
- **Branch protection real no GitHub (T021/SC-010): opção desativada até
  segunda ordem** (11/09/2026). Configurar ruleset/protection depende de
  quem tem `admin` no repo upstream (`audreybuzzclub/buzzclubhub-cde04c92`,
  provavelmente a Audrey) e do plano GitHub da conta dela (repo privado).
  Não retomar essa investigação nem sugerir upgrade de plano sem o usuário
  pedir explicitamente. Paliativo local (`scripts/git-hooks/pre-push`,
  T020) continua sendo a única proteção real por enquanto.
- **Fluxo de contribuição recomendado (11/09/2026)**: o usuário é
  `collaborator` com `push` (não `admin`) no repo upstream — confirmado via
  `gh api repos/audreybuzzclub/buzzclubhub-cde04c92`. Preferir push de
  branch + PR diretamente no upstream (Audrey faz o merge) em vez de manter
  o fluxo via fork `origin` — mais simples, evita a limitação de "compare
  across forks" do GitHub. Não é necessário desvincular o fork nem fazer
  upgrade de plano para isso.

## Convenções/padrões adotados

- Conventional Commits em pt-BR, `scripts/git-hooks/commit-msg` valida.
  Nunca commit direto em `main` — sempre branch + PR.
  `npm run lint && npm run typecheck && npm run test` antes de commitar.
- Bug reports em `docs/bugs/`; sessões em `docs/SESSIONS/YYYY-MM-DD/`.
- `docs/architecture/overview.md` e ADRs em `docs/decisions/` para decisões
  arquiteturais.
- `.env` real (produção) tem backup em `.secrets/env-production-backup.txt`
  quando um ambiente local é usado temporariamente — nunca fica sem backup.
- **Perfil de marca do skill `diagram-design` salvo** (08/09/2026):
  `~/.diagram-design/profiles/buzzclub.md` + marcador `.diagram-design` no
  repo (`profile: buzzclub`) — navy `#0A1628`/amarelo `#FFD600`/cinza
  `#6B7280`, extraído de `BRAND` em `src/lib/pdfLogoHelper.ts` (site
  `buzzclub.co` não expõe CSS suficiente pra raspagem). Diagramas futuros
  neste repo já nascem com essa skin, sem precisar re-onboardar.
- **Nenhum servidor MCP do Lovable ou Supabase está configurado** neste
  ambiente (nem projeto, nem global) — checado 08/09/2026. Se o usuário
  pedir automação via MCP, checar de novo antes de assumir que existe.

## Pendências reais do plano (não são bloqueio meu, aguardam o usuário/infra)

- **T021 / SC-010**: branch protection real do GitHub indisponível — não dá
  pra validar fim-a-fim que PR ruim é bloqueado pelo CI. Ver decisão de
  "desativada até segunda ordem" acima.
- **T011/T012 / SC-007**: 2 dos 4 specs e2e (`criar-pedido-venda.spec.ts`,
  `fluxo-financeiro.spec.ts`) são `test.fixme`; nenhum e2e roda localmente
  sem secrets `E2E_TEAM_*`/`E2E_PORTAL_*`.
- **T035-T040 / SC-006, SC-009 (US4, P3)**: baseline de migrations via
  `supabase db dump` não gerado — depende de métricas de runtime do
  dashboard Supabase (acesso que não tenho) para promover
  `ADR-001-estrategia-banco-de-dados.md` a Aceita.
- **`scripts/session-manager.py` quebrado** (achado 08/09/2026): todo
  subcomando (`end`/`status`/`security-scan`) falha por import ausente
  (`lib/session.py` nunca foi criado, bug do scaffold inicial). Ver
  `docs/bugs/2026-09-08-session-manager-import-quebrado.md`. Ritual
  `/session-end` precisa ser feito manualmente até isso ser corrigido.

## Problemas relevantes resolvidos

- **`client_onboarding` sem caso de teste de segurança** (08/09/2026): tabela
  real de produção (onboarding de clientes) nunca foi criada por migration
  rastreada, então `check-security-coverage.mjs` nunca a via — só apareceu
  quando a fixture local de 03/09 (bootstrap Docker) declarou um
  `CREATE TABLE` local. Corrigido: caso `expectAnonSelectBlocked` adicionado
  em `security-regressions.test.ts`, validado contra produção (RLS bloqueia
  `anon` corretamente — não era vulnerabilidade real, só lacuna de cobertura).
  Achado durante T051 (rodar o quickstart), commit `22bba97`.
- **RLS de `user_areas` acessível por `anon`** (2026-09-03, sessão
  anterior): policies com `USING (true)` sem `TO authenticated` liberavam
  SELECT/INSERT/UPDATE/DELETE geral. Corrigido restringindo a
  `authenticated` + `is_internal_user()`/`has_role()`.
- **Import de jornalistas falha com erro de RLS em `pr_contacts`**
  (2026-09-03): policy `pr_contacts_team_access` não cobre o papel real da
  Audrey (diretora) — ver `docs/bugs/2026-09-03-importacao-jornalistas-rls-pr-contacts.md`.
  Correção pendente: ajustar `user_roles` dela, não a policy.
- **Cobertura de testes 1,66% → 86% (statements)** em uma sessão
  (2026-09-03): T053 do plano de hardening estava travada por falta de
  bootstrap local funcional; destravada com fixture de `client_onboarding`
  + infra de mock reutilizável; todos os 60 hooks de `src/hooks/` ganharam
  testes (628 testes novos).

## Pendências / próximos passos conhecidos

- **T053 concluída (08/09/2026)**: cobertura agregada de regras de negócio
  em 96,7% de linhas/statements (703 testes) — meta de 90% (SC-005)
  superada. Gate absoluto ligado em `vitest.config.ts`
  (`coverage.thresholds.lines/statements: 90`, commits `8a1775f` +
  `4602c40`). ADR-003 (regime ratchet) marcado como Encerrado. Não propor
  reabrir essa exceção — qualquer queda futura de cobertura abaixo de 90%
  já é bloqueante por si só (Princípio III), sem novo ADR.
- US4 do plano de hardening (baseline único de migrations via `db dump`)
  bloqueada esperando métricas de runtime do dashboard Supabase
  (custo, MAU, uso) — só quem tem acesso ao dashboard preenche
  `docs/decisions/ADR-001-estrategia-banco-de-dados.md`.
- Projeto futuro de RBAC atômico (ver seção de decisões acima) — ainda não
  iniciado, aguardando o usuário sinalizar que as tasks atuais terminaram.
- Arquivo `.env copy` não rastreado apareceu no repo (não coberto pelo
  `.gitignore`, que só ignora `.env` exato) — usuário ainda não decidiu o
  que fazer com ele. Confirmado 08/09/2026: contém só a anon key (mesma de
  `.secrets/env-production-backup.txt`), sem `service_role`/senha do banco.
- **ADR-001 ganhou um "Cenário C" (08/09/2026, commit `6694598`, PR #2)**:
  self-host do stack oficial do Supabase via Docker numa VPS (6 vCPU/6GB
  RAM/70GB disco + backup em nuvem) — diferente do Cenário B porque
  preserva RLS/Auth/Realtime/Edge Functions sem reescrita, só troca quem
  hospeda. Status do ADR continua **Proposta** (não decidido). Discussão
  veio de uma pergunta do usuário sobre Free vs Pro do Supabase: não
  consigo acessar o Dashboard (só tenho anon key) — recomendei Pro com
  base em sinais arquiteturais (produção real, sem separação dev/prod,
  dados financeiros/contratuais sensíveis), não em números medidos.


## Atualização 09/09/2026 — T021/SC-010 (branch protection)

- As 3 vias de enforcement real de branch protection foram testadas e
  fechadas na mesma sessão: ruleset (`repos/.../rulesets` → 403, exige
  GitHub Pro em repo privado), branch protection clássica
  (`repos/.../branches/main/protection` → mesmo 403, só é gratuita em repo
  público), e tornar o repo público (422 "Private forks can't be made
  public" — `buzzclubhub` **é fork privado**, GitHub recusa tornar fork
  privado público). Paliativo local (`scripts/git-hooks/pre-push`, T020)
  continua sendo a única proteção real hoje. Decisão pendente do usuário:
  upgrade para GitHub Pro, ou desvincular do fork criando um repo novo (não
  decidido ainda). Não repropor "tornar público" como solução sem antes
  checar `isFork`/`parent` via `gh repo view --json isFork,parent`.


## Atualização 09/09/2026 — merge com upstream (fork) resolvido

- O repo `yvesmarinho/buzzclubhub` é fork de
  `audreybuzzclub/buzzclubhub-cde04c92` (remote `upstream`). Encontrados 4
  commits lá não incorporados: edições diretas via Lovable em 03/09/2026
  (`e7a2894`, `9771bb8`, `a332ae8`, `6b64a37`). Uma delas (`a332ae8`) era uma
  **segunda correção de RLS em `user_areas`**, duplicada em relação à
  correção já feita localmente no mesmo dia (10:42 local vs 14:01 upstream,
  mesmas policies, arquivos de migration diferentes) — sem conflito de
  merge no Git (nomes de arquivo distintos), mas conflito semântico: a
  segunda migration falharia num replay do banco do zero por já existirem
  as policies. Resolvido com merge (`--no-ff`) + edição pontual da
  migration nova para ser idempotente (`DROP POLICY IF EXISTS`). Também
  trazido `previewAuthStorage.ts` (storage "brokerado" de sessão de preview
  do Lovable) — tinha 1 erro de lint (`prefer-const`), corrigido. Suíte
  completa (704 testes) validada contra produção após o merge, tudo verde.
  Commit `0ec951b` na branch `001-refatoracao-hardening`.
- **Padrão a repetir**: quando alguém edita o projeto direto na UI do
  Lovable (fora do fluxo local de PR), essas mudanças vão pro `upstream`
  (repo da Audrey), não pro `origin` (fork do Yves) — sempre checar
  `git fetch upstream && git log HEAD..upstream/main` antes de assumir que
  o histórico local está completo, especialmente após uma correção de RLS
  feita "ao vivo" no banco.


## Atualização 11/09/2026 — branch protection desativada até segunda ordem + fluxo de PR via upstream

- Decisão do usuário: parar de investigar/propor branch protection real
  (upgrade de plano, desvincular fork) **até segunda ordem** — mencionado
  no início da seção de Decisões técnicas duráveis acima.
- Confirmado via `gh api repos/audreybuzzclub/buzzclubhub-cde04c92`: o
  usuário tem `push` mas não `admin` no upstream (repo privado). Como já é
  `collaborator` lá, o caminho de contribuição recomendado passou a ser
  push de branch + PR direto no upstream com merge pela Audrey, em vez do
  fluxo via fork — mais simples e não depende de nenhuma decisão de plano
  ou de desvincular o fork.


## Atualização 11/09/2026 — T011/T012 encerradas por decisão de escopo; módulo de cotações é feature nova

- **T011/T012 (e2e `criar-pedido-venda`/`fluxo-financeiro`) marcadas concluídas**: o entry-point test escrito é suficiente para fechar essas tasks no plano de hardening. O fluxo completo permanece em `test.fixme` (depende de app rodando + secrets `E2E_TEAM_*`/`E2E_PORTAL_*`) — isso deixou de ser pendência do plano, é limitação de ambiente aceita.
- **Decisão de escopo**: qualquer código do **módulo de cotações** que apareça no fluxo de pedido de venda é tratado como **nova funcionalidade**, fora de `specs/001-refatoracao-hardening/`. Não implementar/expandir esse módulo via esta feature — se aparecer trabalho nessa área, tratar como feature separada (nova spec/branch).
- `specs/001-refatoracao-hardening/tasks.md` atualizado: T011/T012 sem nota de pendência; T051/SC-007 marcado como "encerrado por decisão de escopo" em vez de "bloqueado".


## Atualização 11/09/2026 — auditoria de prontidão para produção + commit de docs

- **Auditoria completa rodada nesta sessão**: `lint` (0 erros/292 warnings), `typecheck` (limpo), `audit:ci` (passa, waivers válidos), `check-security-coverage.mjs` (103/103 tabelas, 4/4 funções). `lint-migrations.mjs` confirma 106/106 migrations ainda não conformes ao cabeçalho padrão — esperado, T036 (baseline) não gerado.
- **Achado confirmado (não é regressão nova)**: rodar `npm run test` com o `.env` local (`http://127.0.0.1:54321`) dá **9 falhas** em `security-regressions.test.ts` (edge functions retornando 503 em vez de 401) — é o falso-negativo já documentado de Edge Functions não rodarem no Docker local. Troquei temporariamente `.env` pelo backup de produção (`.secrets/env-production-backup.txt`), rodei só essa suíte (**113/113 passaram**) e restaurei o `.env` local em seguida. Nenhuma alteração ficou no repo por causa disso.
- **Limite confirmado**: não há CLI do `supabase` instalado neste ambiente nem credencial de `service_role`/senha do banco — impossível validar formalmente se a produção está com todas as 106 migrations aplicadas via introspecção direta. A suíte de segurança passando 113/113 contra produção é a única evidência indireta disponível (RLS/schema de tabelas recentes reflete o esperado).
- **`.gitignore` atualizado**: passou a ignorar `docs/*.html`, `docs/*_files/` e `docs/lembrete.md` — eram exports manuais de página salvos no navegador (Arquitetura/Fluxo/Settings·Ruleset do buzzclubhub), não documentação versionada do projeto. Decisão do usuário: ignorar em vez de deletar ou decidir depois.
- **Commit `094846a`** na branch `001-refatoracao-hardening` (local, ainda não pushado): consolida a atualização de descrição do projeto (SPA → "sistema de jornada e gestão", já feita em sessão anterior mas nunca commitada) + as mudanças de T011/T012/SC-007 desta sessão + o `.gitignore` novo. PR para o upstream **ainda não aberto** — usuário pediu só o commit por enquanto, decisão de quando abrir fica com ele.


## Atualização 12/09/2026 — triagem dos 14 PRs do Dependabot no upstream

- **Descoberta importante**: o `main` do upstream (`audreybuzzclub/buzzclubhub-cde04c92`) está **muito atrás** do trabalho de hardening — sem script `typecheck`, só 1 teste de exemplo (`src/test/example.test.ts`), ~855 erros de lint pré-existentes. Todo o trabalho de `001-refatoracao-hardening` (T053, 96,7% cobertura, security-regressions, etc.) vive só no fork (`origin`) e ainda não foi mergeado no upstream. Testes de PR feitos contra esse `main` antigo, não contra o estado do fork.
- **`npm ci` falha no `main` do upstream** (lockfile fora de sincronia com `package.json`: `jspdf`/`xlsx`/`@testing-library/dom` divergentes) — usar `npm install --allow-remote all` para testes locais nesse checkout específico (diferente do fork, que usa `npm ci --allow-remote=all` normalmente).
- **5 PRs mergeados** (squash, branch deletada) após validar build/lint/test localmente — todos de baixo risco:
  - #2 `actions/upload-artifact` 4→7, #3 `actions/checkout` 4→7, #4 `github/codeql-action` 3→4, #15 `actions/setup-node` 4→7 (só workflow, sem impacto em app code).
  - #14 `globals` 15→17 (dev dep do eslint flat config) — build ok, lint **melhorou** (855→820 erros).
- **9 PRs deixados abertos** (decisão do usuário: só merge dos seguros) — análise feita nesta sessão:
  - **#12 `tailwindcss` 3→4: build QUEBRA de fato** — `[vite:css] It looks like you're trying to use tailwindcss directly as a PostCSS plugin`, precisa migrar para `@tailwindcss/postcss` (mudança de config, não é 1-linha).
  - **#13 `eslint-plugin-react-hooks` 5→7: regressão real de lint** — erros sobem de 883→916 (+33), regras mais estritas encontram violações novas que precisam correção de código antes do merge.
  - #6 `typescript` 5.8→7.0, #7 `react-day-picker` 8→10, #8 `react`+`@types/react` 18→19, #9 `tailwind-merge` 2→3, #10 `@eslint/js` 9→10, #11 `eslint` 9→10: **build e lint passaram** no teste isolado, mas são majors com breaking changes conhecidas (React 19: refs como prop, sem `defaultProps` em function components; react-day-picker: API de props mudou entre v8→v10) que o upstream não tem suíte de testes real pra pegar — build verde não é garantia de comportamento correto em runtime. Recomendação: não mergear sem testar manualmente no app rodando, ou esperar essas libs serem atualizadas já no fork (que tem cobertura de 96,7%) antes de levar pro upstream.
  - **#5 "minor-and-patch group" (40 updates bundlados): `CONFLICTING`**, stale desde julho/2026 (baseado num `main` velho, `package.json`+`package-lock.json` divergem 966/1047 linhas do `main` atual). Recomendação: fechar e deixar o Dependabot recriar do zero contra o `main` atual, em vez de resolver o conflito manualmente num PR bundlado de 40 pacotes — não fechado nesta sessão (ação decidida por mim seria fechar PR de terceiro sem pedir, evitado).
- **Nenhuma mudança feita no fork/branch local** (`001-refatoracao-hardening`) por causa desta tarefa — foi só triagem/merge de PRs no upstream.

## Atualização 12/09/2026 — 9 PRs restantes fechados (nenhum era necessário)

- Usuário confirmou que os 9 PRs deixados abertos na triagem anterior não eram necessários (nenhum corrige as vulnerabilidades reais do `npm audit`, são majors de rotina ou o bundle stale/conflitante). Fechados com `gh pr close --delete-branch` (#5, #6, #7, #8, #9, #10, #11, #12, #13) — repositório upstream ficou com **0 PRs abertos**.
- Dependabot pode recriar PRs equivalentes automaticamente se a config `.github/dependabot.yml` continuar ativa — não é uma supressão permanente, só encerrou o estado atual.

## Atualização 12/09/2026 — PR #16 aberto: merge develop → main no upstream

- **PR #16** (https://github.com/audreybuzzclub/buzzclubhub-cde04c92/pull/16)
  aberto a pedido do usuário: `develop` → `main` no upstream, trazendo os 66
  commits do trabalho de hardening (mesma ponta de `001-refatoracao-hardening`
  no fork, commit `d0a8de8`) para produção. **Não mergeado** — decisão de
  merge fica com a Audrey (ou o usuário, se ela autorizar), não automatizada.
- **Bloqueio real identificado**: o CI de `develop` já falha hoje no job
  "Test + coverage" — `security-regressions.test.ts` precisa de
  `VITE_SUPABASE_URL`/chave reais via env, e esses **secrets não estão
  configurados no GitHub Actions do repositório upstream** (só existem no
  `.env` local do usuário / `.secrets/env-production-backup.txt`). Precisa de
  acesso admin ao repo (Audrey) para configurar `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` nos Actions secrets — sem isso, `main`
  herda a mesma falha de CI após o merge.
- Commit local pendente (`094846a`, ainda não enviado a `origin` nem
  `upstream/develop`) **não foi incluído** neste PR — usuário optou por não
  sincronizar antes, ficou como pendência separada.
- **Rollback, se o merge for aceito e precisar ser desfeito**: usar
  `git revert -m 1 <hash-do-merge>` no upstream (gera commit novo, não
  reescreve histórico compartilhado) — nunca `reset --hard`/force-push em
  `main` de terceiro.

## Pendências novas (12/09/2026)

- [ ] PR #16 (`develop` → `main` no upstream) aguardando decisão/review da
  Audrey.
- [ ] Configurar `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` nos
  Actions secrets do upstream (acesso admin necessário) — sem isso o CI de
  `main` fica vermelho após o merge do PR #16.
- [ ] Commit local `094846a` ainda não sincronizado com `origin` nem
  `upstream/develop`.


## Atualização 13/09/2026 — how-to de deploy no Vercel (homologação)

- Criado `docs/guides/DEPLOY_VERCEL_HOMOLOGACAO.md` no repo: guia para
  publicar `yvesmarinho/buzzclubhub` no Vercel como ambiente de
  **homologação** (não produção), sem depender do Lovable. Production
  Branch sugerido no Vercel: `001-refatoracao-hardening`.
- **Decisão pendente**: ainda não há confirmação de projeto Supabase
  dedicado a homologação — não reutilizar o Supabase de produção da Audrey
  para esse ambiente sem alinhar antes.
- Detalhe: `docs/[[../daily/2026-09-13|daily/2026-09-13]]`.


## Atualização 15/09/2026 — deploy Docker+Traefik em homologação, bug de healthcheck, projeto Supabase dev descoberto

### Deploy Docker + Traefik (homologação)
- `docker/docker-compose.yml` reescrito para expor o serviço via **Traefik**
  (rede externa `web`, labels `traefik.http.routers.*`/`middlewares.*`, sem
  publicar porta no host) usando o modelo de
  `~/Documentos/DevOps/Projetos/devops-containers/containers/traefik/modelo-traefik/docker-compose.yaml`.
  Host configurado: `dev.buzzclub.co`. Nginx **mantido** no Dockerfile
  (decisão do usuário — não migrar para `serve`/Caddy).
- `docker-compose.yml` não builda mais a imagem — só sobe a partir de
  `techbuzzclub/buzzclubhub:latest` já construída. Build isolado em
  `scripts/docker-build.sh`, corrigido nesta sessão (script antigo tinha
  resíduo de projeto Rails: `RAILS_ENV`/`BUNDLE_WITHOUT`/
  `RAILS_SERVE_STATIC_FILES`, sem relação com este projeto Vite/React —
  agora fonte `.secrets/supabase-dev.env` e passa os `VITE_SUPABASE_*`
  corretos como build args).
- **Bug de healthcheck corrigido**: `HEALTHCHECK` do `docker/Dockerfile`
  usava `wget -qO- http://localhost/`, e o `wget` do BusyBox (Alpine/musl)
  tenta resolver `localhost` via IPv6 (`::1`) primeiro — como o nginx só
  tem `listen 80;` (sem `listen [::]:80;`, o entrypoint script pula a
  injeção automática de IPv6 porque `docker/nginx.conf` sobrescreve o
  `default.conf` padrão da imagem), a tentativa IPv6 é recusada e o
  BusyBox `wget` **não faz fallback pra IPv4** — container ficava
  `unhealthy` (`FailingStreak` crescendo) mesmo com nginx up e escutando
  em `0.0.0.0:80` (confirmado via `ps aux` + `/proc/net/tcp` dentro do
  container). Corrigido trocando para `http://127.0.0.1/` no
  `HEALTHCHECK`. Como o Traefik (provider Docker) **exclui containers
  unhealthy do roteamento sem erro visível**, esse era o motivo do serviço
  não aparecer no dashboard do Traefik apesar de "Up" no `docker compose ps`.
- **Padrão a lembrar**: em qualquer HEALTHCHECK/probe rodando `wget`/`curl`
  do BusyBox contra `localhost` dentro de um container Alpine com nginx
  IPv4-only, preferir `127.0.0.1` explícito — evita o bug de resolução
  dual-stack sem fallback.

### Projeto Supabase de homologação/dev descoberto
- `.secrets/supabase-dev.env` aponta para um projeto Supabase **diferente**
  do de produção: `VITE_SUPABASE_PROJECT_ID=uftbeshtcbydrtohpywe` (produção
  é `emwjhtaxqpbbtayfcjxn`). Isso resolve a pendência que estava aberta
  desde 12-13/09 ("não há confirmação se existe projeto Supabase dedicado a
  homologação") — **existe**, mas está com o **schema vazio** (nenhuma das
  106 migrations aplicada): `/auth/v1/settings` responde 200 (projeto ativo),
  mas `/rest/v1/clients` responde `404 PGRST205` (tabela não existe no
  schema cache). Confirmado via requests com a anon/publishable key desse
  projeto (nunca via curl na linha de comando, sempre script Python lendo
  de `.secrets/`).
- **Pendência aberta**: aplicar as migrations nesse projeto dev antes de
  usá-lo (`supabase db push` ou equivalente) — ainda não feito, decisão de
  quando fica com o usuário.

### Cópia de dados produção → dev (discussão, não executada)
- Usuário confirmou que **as duas contas Supabase (produção e dev) estão
  sob controle do mesmo diretor da empresa** — autoriza copiar dados de
  produção para o ambiente dev/homologação.
- **Bloqueio técnico atual**: `.secrets/production.env` só tem a
  anon/publishable key, que é bloqueada pelas mesmas policies de RLS que
  `security-regressions.test.ts` valida — não dá pra fazer dump real de
  dados com ela. Precisa de `service_role` key **ou** connection string
  direta do Postgres (Project Settings → Database, em
  `https://supabase.com/dashboard/project/emwjhtaxqpbbtayfcjxn`), nenhuma
  das duas presente em `.secrets/` ainda. Recomendação dada ao usuário: se
  for adicionar, usar um arquivo `.secrets/` dedicado (não misturar com
  `production.env`, que é a chave pública embutida no bundle) — dado o
  volume de dados financeiro/contratual/PII em produção, considerar dump
  anonimizado ou parcial em vez de cópia 1:1, mas decisão final é do
  usuário. Nada foi copiado ainda nesta sessão.


## Atualização 23/09/2026 — validação de prontidão do PR #16 (develop → main) para produção

- **Veredito: NÃO atualizar produção ainda.** Bloqueios encontrados:
  - PR #16 `CONFLICTING`: os 5 merges do Dependabot (12/09) estão no `upstream/main` mas não no `develop` → conflito só em `package-lock.json`. Correção: merge `upstream/main` → `develop` + regenerar lockfile.
  - CI do `develop` (`d0a8de8`) vermelho no job "Quality gate" → passo "Test + coverage" (causa provável: secrets `VITE_SUPABASE_*` ausentes no Actions do upstream; log detalhado expirado, não confirmado).
  - Commits locais `094846a` e `7c97969` ainda fora de `upstream/develop`.
- **Riscos de migration para produção** (PR traz 3 migrations novas + 1 alterada):
  - `20260304182436_seed-dev-admin-user-fixture` e `20260713170615_local-fixture-client-onboarding` são **fixtures locais** com timestamp fora de ordem — não deveriam ir para produção (`supabase db push` exigiria `--include-all`). Proposta: mover para `supabase/seed.sql`/script local-only.
  - `20260903104228_...` (RLS `user_areas`) **não é idempotente** (`CREATE POLICY` sem `DROP IF EXISTS`) — falharia com "policy already exists" se essa versão não estiver registrada no histórico de migrations de produção (correção foi aplicada direto pelo Lovable).
  - Não confirmado: quais versões produção tem registradas e se o Lovable aplica migrations automaticamente no merge em `main`.
- 4 Edge Functions alteradas (`client-portal-auth`, `financial-alerts`, `shared-dashboard`, `zapsign-webhook`) — revalidar `security-regressions.test.ts` contra produção após deploy.
- **Status**: usuário aguardando **credenciais do banco de dados** (service_role/connection string) — destrava inspeção do histórico de migrations de produção, cópia prod→dev e `db push` no projeto dev. Nenhuma alteração de código nesta sessão.
- Próximos passos propostos (não executados): (1) idempotência da 104228 + tirar fixtures do caminho de produção; (2) merge `upstream/main` → `develop`; (3) secrets do CI (Audrey); (4) merge + validação de segurança.


## Atualização 29/09/2026 — nova produção Supabase restaurada do backup Lovable

- **Novo projeto de produção** (`agdq…`, controlado pelo usuário) substitui o antigo `emwj…` (Lovable). Credenciais: `.secrets/buzzclub-supabase-prod.env` (URL/anon) e `.secrets/buzzclub-supabase-prod.json` (`db_url`, conexão direta).
- Backup do Lovable restaurado integralmente e validado por contagem (100 tabelas, 6.131 linhas, 15 usuários com senhas originais, 105 migrations). Procedimento em `docs/guides/RESTAURACAO_BACKUP_SUPABASE.md`; detalhe em [[../daily/2026-09-29|daily/2026-09-29]].
- **Padrões a lembrar**: backup do Lovable vem de **pg_dump 18** (usar `postgres:18`); no Supabase hospedado restaurar em etapas com `pg_restore -L --no-owner` (public → dados auth/storage → FKs para auth + trigger/policies storage/publication); conexão direta é **IPv6-only** → `docker run --network host`.
- Histórico de migrations de produção tem versões **1–3 s diferentes** dos nomes em `supabase/migrations/` (Lovable grava o horário de aplicação) → nunca `supabase db push` sem `migration repair` antes.
- Pendências: deploy das 6 Edge Functions (precisa PAT + `CRON_SECRET`/`PORTAL_JWT_SECRET`/`ZAPSIGN_*`), recriar 2 jobs cron, copiar 69 arquivos do storage, Auth URLs, webhook ZapSign.

## Atualização 29/09/2026 17:06 — nova produção operacional (funções, ZapSign, Auth, imagem)
- Edge Functions (6) publicadas no `agdq…`; secrets em `.secrets/buzzclub-supabase-prod-functions.json`
  (inclui `access_token` do CLI/Management API). Jobs cron leem `project_url`/`anon_key`/`cron_secret` do Vault.
- ZapSign não suporta header custom: autenticação do webhook é por `?secret=` na URL.
- Front de produção: `https://dev.buzzclub.co` (Docker + Traefik); `VITE_*` embutidos no build,
  `scripts/docker-build.sh [env]` usa por padrão o env da nova produção.
- API de logs do Supabase: `logs.all` removido (410); `/analytics/endpoints/logs` usa ClickHouse com tabela `logs`
  e `source_name` — retornou "Backend error" nos testes; ler logs pelo dashboard.
- Detalhe em [[../daily/2026-09-29|daily/2026-09-29]].

## Atualização 30/09/2026 10:07 — storage da nova produção completo
- Os 69 objetos do storage foram enviados ao `agdq…` (download manual em Lovable → Cloud → Storage, upload via Storage API com upsert) e verificados por download. Pendência de storage **encerrada**.
- Um PDF de 24 MB baixado junto não tem registro em `storage.objects` e não foi enviado (destino a definir pelo usuário).
- Detalhe em [[../daily/2026-09-30|daily/2026-09-30]].
- 30/09/2026 10:23: conta admin técnica `nulladmin@buzzclub.co` criada pelo usuário na nova produção (papel admin ainda não conferido em `public.user_roles`). Leituras/escritas no banco de produção via Management API podem ser bloqueadas pelo classificador de permissões — nesse caso, entregar script em `tmp/` para o usuário rodar.
- 30/09/2026 10:25: **correção** — conferência mostrou que `nulladmin@buzzclub.co` não existe no `agdq…` (15 usuários, único admin é a Audrey; `user_roles` tem só 2 linhas: 1 admin, 1 gestao). Tratar a conta como inexistente até nova conferência.


## Atualização 30/09/2026 10:55 — cadastro de usuários por convite (branch `002-cadastro-usuarios`)
- Primeira feature fora do hardening: convite por e-mail em Configurações → Usuários, só admin, via edge function `invite-user`; convidado define a senha em `/definir-senha`. Decisão em `docs/decisions/ADR-004-cadastro-de-usuarios-por-convite.md`.
- **Padrão a lembrar**: `verify_jwt = true` não autentica usuário (a anon key passa no gateway) — toda edge function com service_role precisa validar o chamador (`auth.getUser(token)` + `has_role`). `send-to-zapsign` ainda não faz isso.
- Mock de testes (`src/test/mockSupabase.ts`) agora cobre `functions.invoke` (`setFunctionResult`) e `auth.updateUser` (`setAuthUpdateResult`).
- Pendente: publicar a função, SMTP próprio no Auth, deploy da imagem, commit + PR. Detalhe em [[../daily/2026-09-30|daily/2026-09-30]].


## Atualização 30/09/2026 11:40 — cadastro de usuários + SMTP no ar (servidor), PR #3 aberto
- Nova produção (`agdq…`): migration `20260930110500_smtp-settings` aplicada, funções `invite-user` e `smtp-settings` publicadas, `security-regressions.test.ts` **120/120** contra o projeto novo (pendência de validação encerrada).
- SMTP é do app (aba Configurações → E-mail, tabela `smtp_settings` + senha no Vault); o SMTP do Supabase Auth não é usado nos convites. Portas 25/587 recusadas pelo contrato.
- PR #3 no fork (`002-cadastro-usuarios` → `001-refatoracao-hardening`); imagem `latest` já contém a feature (digest `sha256:1dc88fcf…`), falta `compose pull && up -d` no servidor e o primeiro teste real de envio.
- **Padrão a lembrar**: rodar a suíte de segurança contra a produção sem trocar o `.env` — exportar as variáveis do arquivo de `.secrets/` no shell (`set -a; . arquivo; set +a`) antes do `npx vitest run`.
- Detalhe em [[../daily/2026-09-30|daily/2026-09-30]].


## Atualização 30/09/2026 12:15 — cadastro de usuários validado em produção
- Fluxo completo validado pelo usuário na nova produção: SMTP do Gmail (465/TLS, senha de app) → e-mail de teste → convite → `/definir-senha` → login. Guia em `docs/guides/CADASTRO_USUARIOS_E_EMAIL.md`.
- Branch `002-cadastro-usuarios` com 3 commits (`ef52f1a` feature, `9d8d8ef` fix cache do `index.html` no nginx, `cad55b6` docs); PR #3 no fork aguardando merge.
- Conta técnica `nulladmin@buzzclub.co` existe e é admin (credenciais em `.secrets/buzzclub-nulladmin.json`).
- Pendências novas: `send-to-zapsign` sem validação do chamador; 13 usuários antigos sem papel em `user_roles`; reenvio de convite pela tela.


## Atualização 30/09/2026 12:40 — decisões de ambiente (substituem planos anteriores)
- **Produção = container** (Docker + Traefik) apontando para o Supabase novo `agdq…`. Deixa de ser o Lovable.
- **Lovable vira ambiente de dev**, para a diretora (Audrey) alterar o visual do app; continua ligado ao projeto antigo `emwj…` e commitando direto no `main` do upstream.
- **Não usar secrets/variables do GitHub** para o Supabase: o CI não terá credenciais. Consequência: `security-regressions.test.ts` e o ggshield não podem ser gate de CI — passam a ser verificação local/pré-deploy. Não propor mais "configurar secrets no Actions".
- **Deixam de ser pendência**: secrets do Actions no upstream, deploy na Vercel como homologação, projeto Supabase `uftb…` como dev, cópia de dados prod→dev.
- **PR #3 mergeado** (`b8b0d7d`) em `001-refatoracao-hardening`; CI do fork vermelho por 4 testes de segurança novos que batem no projeto antigo (variáveis do repo de 09/09) + falso negativo do workflow "Git Validation" em push.
- **Pendências reais** (ordem): (1) data da virada + carga final dos dados lançados no Lovable após 29/09 sem perder o que já foi criado no novo; (2) domínio definitivo de produção (hoje `dev.buzzclub.co`) + Auth URLs; (3) fluxo de promoção Lovable/upstream `main` → branch de produção → imagem, e o caminho inverso (PR #16 com conflito de lockfile); (4) CI sem credenciais: tirar suíte de segurança e ggshield do CI e criar verificação pré-deploy; corrigir "Git Validation"; (5) ZapSign: remover webhooks antigos e reprocessar falhas desde 13/07; (6) 13 usuários sem papel; (7) backup do banco/storage novos; (8) `migration repair`; (9) `send-to-zapsign` sem validação do chamador; (10) isolar o Lovable dev (dados reais de produção continuam lá).


## Atualização 30/09/2026 — imagem única, configuração em runtime (ADR-005, PR #4)
- Servidor: pastas `buzzclubhub-prod` (`hub.buzzclub.co`, tag `latest`, Supabase `agdq…`) e `buzzclubhub-homolog` (`dev.buzzclub.co`, tag `homolog`, Supabase `uftb…`, ainda vazio).
- Imagem sem configuração: o container gera `/config.js` a partir do `.env` do compose (`APP_ENV`, `APP_HOST`, `IMAGE_TAG`, `VITE_SUPABASE_*`). `scripts/docker-build.sh` → `:homolog` + `:sha-<commit>`; `scripts/docker-promote.sh` → `:latest` (promoção e rollback). Guia: `docs/guides/DEPLOY_DOCKER.md`.
- Nunca colocar senha do banco/`service_role` no `.env` do servidor — o front não usa.
- Substitui o registro de 29/09 de que `docker-build.sh` recebia o arquivo de env e embutia `VITE_*` no build.

- **Revisão 30/09/2026 (tarde):** projeto `uftb…` **descontinuado**. Produção = `agdq…` em `hub.buzzclub.co` (DNS já criado, mesmo IP de `dev.buzzclub.co`). Dev/homologação = projeto Supabase **novo, a criar**, em `dev.buzzclub.co`. PR #4 ainda aberto; `hub.buzzclub.co` ainda sem container respondendo. Enquanto o dev não tiver banco, a imagem nova é validada apontando a pasta de homologação para o banco de produção.


## Atualização 30/09/2026 19:10

- Produção `hub.buzzclub.co` no ar com a imagem de config em runtime (`:latest` = `sha-d542e63`), projeto `agdq…`.
- Dev `dev.buzzclub.co` → **novo projeto Supabase** (credenciais `.secrets/buzzclub-supabase-dev.{env,json}`); decisão: cópia dos dados reais da produção via `tmp/clone_prod_to_dev.py` (em execução pelo usuário).
- Projeto Supabase novo já traz `public.rls_auto_enable()` + event trigger `ensure_rls`; não traz `pg_cron`/`pg_net` — considerar em qualquer clone/restore.
- Análise: Configurações → Áreas × Permissões não são redundantes; bugs registrados em `docs/bugs/2026-09-30-permissoes-padrao-divergente-e-areas-sem-efeito.md` (roleDefaults duplicado impede revogar acesso; `user_areas` sem efeito).
- Pendências organizadas em `docs/TODO.md` (seção "Revisão das pendências — 30/09/2026 15:50").


## Atualização 01/10/2026 — PRs, produção completa e modo de manutenção
- PRs #4, #6, #7 e #5 mergeados em `001-refatoracao-hardening`; PR #8 (TODO) aberto. CI sem credenciais do Supabase (PR #7): `security-regressions` fora do CI → `npm run test:security` antes de cada deploy; ggshield só local; variáveis `VITE_SUPABASE_*` do repo apagadas.
- Produção `hub.buzzclub.co` completa: SMTP preenchido de novo, Auth URLs (Site URL `https://hub.buzzclub.co`, redirect só `https://hub.buzzclub.co/**`), reset de senha validado. **Gotcha:** redirect sem `/**` faz o Supabase cair na Site URL e perder `/definir-senha`.
- Sem novo restore: o de 30/09 basta; falta só conferir se houve lançamentos no banco antigo (`emwj…`, ainda usado pelo Lovable) depois de 30/09 13:56.
- **Modo de manutenção** (PR #9, ADR-006): tabela `maintenance_settings` sem acesso direto, `get_maintenance_status()` pública, `set_maintenance_mode()` só service_role (apaga `auth.sessions` de não-admins), policies **RESTRICTIVE** `maintenance_block_*` em todas as tabelas de public + `storage.objects`. **Regra:** migration que cria tabela termina com `SELECT public.apply_maintenance_policies();`. Falta deploy na produção (SQL Editor, não `db push`).
- Usuários sem papel: **8** (não 13); proposta para a Diretora em `tmp/proposta-perfis-usuarios.html`. `profiles` liga a `auth.users` por `user_id`.
- Tela "Acessos" (une Áreas + Permissões) aprovada (mockup `tmp/mockup-acessos.png`). Não existe cadastro de áreas: 9 áreas fixas em 4 arquivos. `user_areas` já é só admin/gestão desde 03/09.
- Pedido do Financeiro (Alice): Plano de Contas só admin grava **e não é usado pelo Financeiro** (categorias fixas em `useProjectFinancials.ts`); importação em lote só na aba Transações. Dívida: `financial_payables`/`financial_receivables` graváveis por qualquer logado.
- Decisões abertas e plano em `tmp/decisoes.md`; ata para a Audrey em `tmp/ata-reuniao-audrey.html`.
- **Padrões:** `npx supabase` (CLI 2.119) sobe o stack local sem instalação; `supabase functions serve --env-file` com segredos fictícios no scratchpad para rodar a suíte de segurança local (128/128); leitura/escrita da produção e force-push bloqueados pelo classificador — usar merge em vez de rebase e entregar SQL para o usuário rodar.
- Detalhe em [[../daily/2026-10-01|daily/2026-10-01]].

## Atualização 01/10/2026 (tarde) — homologação, manutenção na produção e correções
- **Homologação ativa:** Supabase dev `buzzclub-dev` (`cudq…`) com backup de 30/09 (104 tabelas/6.277 linhas, 0 divergências) + migrations `smtp-settings` e `maintenance-mode`; 10 edge functions; `test:security` 130/130. Imagem `:homolog` = `sha-bc5f704`. Admin técnico do dev: `.secrets/buzzclub-nulladmin-dev.json`; usuário de teste `yvesmarinho@gmail.com` (gestão). Validado pelo usuário em `dev.buzzclub.co`.
- **Credenciais do dev:** `.secrets/buzzclub-supabase-dev.{env,json}` e `.secrets/buzzclub-supabase-dev-functions.json` (segredos próprios do dev + `access_token` da conta do dev; ZapSign com token inválido de propósito). O token da produção só enxerga a org da produção. Script `tmp/sb-dev.sh` (projects | secrets | deploy | list).
- **Restore de backup do Lovable em projeto vazio:** `tmp/clone_prod_to_dev.py --backup` (descarta GRANTs ao papel `sandbox_exec`, que só existe no Lovable).
- **Manutenção na produção:** migration e 4 funções aplicadas no `agdq…` (128/128). **Ordem obrigatória:** migration antes das funções (sem `is_maintenance_mode()` elas falham fechado = 503). Falta promover a imagem (`docker-promote.sh sha-bc5f704`) — bloqueado para mim (Production Deploy).
- **PRs abertos (CI verde):** #10 `send-to-zapsign` exige módulo Contratos (`requireModuleAccess` em `_shared/admin.ts`, mesma regra do front); #11 padrões de perfil em fonte única (revogar funciona); #12 rota `/login` + `RequireAuth`; #13 healthcheck `--start-interval=1s` (healthy 30 s → 1 s; Traefik não roteia container `starting`).
- **Bug aberto:** `ModuleGuard` redireciona para `/` ao recarregar rota protegida antes de o perfil carregar.
- **Permissões do classificador nesta sessão:** leitura/escrita na produção via `db_url` passou à tarde (migration aplicada), mas `docker-promote.sh` (Production Deploy), force-push e exclusão de variáveis do GitHub foram bloqueados.


## Atualização 02/10/2026 — main consolidada, regra do Lovable e ModuleGuard
- PR #14 levou `001-refatoracao-hardening` (PRs #3–#13) para a `main`; a **`main` passa a ser a base** das próximas branches. Branches mergeadas apagadas (local + remoto), inclusive a `001`.
- CI em PR para `main` roda CodeQL e Dependency Review, que falham por configuração (Code scanning/Dependency graph desabilitados no fork) — não é código.
- **Regra:** o upstream do Lovable (`audreybuzzclub/buzzclubhub-cde04c92`) serve só para trazer UI/UX; o resto é ignorado. Controle por hash em `docs/upstream/LOVABLE_SYNC.md` (último avaliado `2529761`; modo de manutenção do Lovable ignorado, `MaintenanceScreen.tsx` em "avaliar"). PR #15 mergeado.
- PR #16: mapa mental da cotação versionado. PR #17: correção do `ModuleGuard` (isLoading em `useModulePermissions`; guard extraído para `src/components/ModuleGuard.tsx`).
- Gotcha: `npm run test` local inclui `security-regressions` (falha sem Supabase de pé); para o gate local usar `npx vitest run --exclude 'src/test/security-regressions.test.ts' --exclude 'src/test/e2e/**'`.
- 02/10/2026 (tarde): PRs abertos — #17 ModuleGuard; #18 RLS pagar/receber só admin+financeiro + trigger cria recebível na aprovação do PV (vale também em Aprovações); #19 tela Acessos (só admin; `user_areas` só admin); #20 Plano de Contas gravável por financeiro e usado pelo Financeiro (coluna `code`, categoria em uso só desativa); #21 importação em lote pagar/receber (base #20; descrição/categoria vão em `notes` — tabelas sem coluna `category`). Merge na ordem #18 → #19 → #20 → #21; migrations antes da imagem + `test:security` + regenerar types.
- Pendências desses PRs: categorias `outros`/`recebimento_cliente`/`reembolso` fora do Plano de Contas; bug antigo `fn_sales_order_to_fe` quebra reaprovação de PV; falta coluna `sales_order_id` em recebíveis.
- 02/10/2026 11:30: `tmp/decisoes.md` foi exportado e apagado — **fonte de decisões/pendências agora é `docs/TODAY_ACTIVITIES.md`** (PR #22, só docs). Contém deficiências D1–D12 do Financeiro/banco, proposta do menu "Cadastros financeiros" (`/financeiro/cadastros`: Plano de Contas, contas bancárias, formas de pagamento, centros de custo, atalho Fornecedores, com importação) e modelo-alvo de FKs. Prioridades: seg 05/10 produção + banco antigo; P0 merges #17–#21 + bug reaprovação PV; P1 colunas próprias em pagar/receber; P2 cadastros; P3 FKs/RLS invoices. `docs/*.html` (ata) é gitignored — ata atualizada só localmente.
- 02/10/2026: app antigo do Lovable **despublicado** pelo usuário — ninguém acessa o sistema antigo; risco de lançamentos no app antigo encerrado (Lovable segue só como editor visual).
- 02/10/2026: reunião com a Audrey (registro em docs/meetings/2026-10-02-reuniao-sistema-alteracoes.md, PR #23?). Prioridade 1 = **interligação** de todos os módulos em torno do projeto (cliente=prédio, projeto=apartamento, área=cômodo, tarefa=móvel); depois importação em lote (financeiro→influenciadores→projetos), prazos data+hora + e-mail diário, ajustes do PV (valor cliente × valor real × subcustos; serviços múltipla escolha; prazo de pagamento), fluxo PO→NF→e-mail influenciadores→contas a pagar. Reunião semanal às segundas no fim da tarde.
- 02/10/2026 16:20: PRs #18, #20 (conflito em security-regressions resolvido mantendo os 2 blocos) e #21 mergeados na main. ADR-007 (transição cadastros financeiros) **Aceita**. Migrations 20261002120000 e 20261002122000 aplicadas no **dev** (cudq…) via tmp/apply_migrations_dev.py (psql com PG* em env, registra em schema_migrations); test:security 138/138 no dev. Imagem :homolog = sha-c446632 publicada; falta pull no servidor de homologação, validação e depois produção (migrations + docker-promote). Gotcha: npm run lint passa a pegar .claude/worktrees (1458 avisos) — usar --ignore-pattern '.claude/**' ou limpar worktrees.
- 02/10/2026 16:38: Financeiro (PRs #18/#20/#21) **validado na homologação** com nulladmin (todas as telas) e com perfis Produção/Design (menu oculto, esperado). Produção pendente: 2 migrations + docker-promote sha-c446632. Perfil **design** não tem roleDefaults (só Visão Geral) — decisão da Diretora pendente.
- 02/10/2026 17:56 — Spec 009 implementada até a US1 (T001–T028), PR #28: tabelas/seed/RLS dos cadastros financeiros + página /financeiro/cadastros; Plano de Contas saiu de Configurações. Verificado com supabase db reset local + SQL em ROLLBACK. Drift achado: colunas events/sales_orders sem migration (docs/bugs/2026-10-02-drift-colunas-sem-migration.md). Próximo: aplicar 3 migrations no dev + quickstart; depois US2 (importação) e US3.
- 02/10/2026 17:59 — Migrations 20261005100000/100100/100200 (spec 009 US1) aplicadas no **dev**; verificação SQL OK; test:security 149/149 no dev (carregar .secrets/buzzclub-supabase-dev.env antes). Imagem :homolog ainda sem a US1.
- 02/10/2026 19:30 — US1 mergeada (PR #28), imagem :homolog = sha-ed8a36a, menu Financeiro validado pelo usuário. US2 (importação dos cadastros por planilha, T029–T036) no PR #30, sem migration; wizard genérico FinancialRegistryImportWizard substituiu ImportFinancialCategoriesWizard. Pedido registrado no TODO (PR #29): Acessos com 3 níveis por módulo (off/read/write).
- 02/10/2026 19:55 — **Fim da sessão.** US2 (PR #30) e TODO 3 níveis (PR #29) mergeados; imagem :homolog = sha-7d1713f. Validado pelo usuário na homologação: Plano de Contas importou 2, Formas de pagamento importou 1 (2 duplicados recusados corretamente). **Bug pendente:** coluna "#" do preview/relatório mostra linha +2 (4,5,6 em vez de 2,3,4) — ImportWizardDialog soma 2 ao rowIndex e validateRegistryRows já devolve i+2; corrigir em FinancialRegistryImportWizard (rowIndex - 2 ao repassar ao diálogo) com teste. Spec 009: 37/74 tarefas (Setup, Foundational, US1, US2). Próximo: corrigir bug acima; US3 (T037–T044, lançamentos usam os cadastros, migration 20261005100300 + e2e T039a/b). Produção ainda pendente: migrations 20261002120000, 20261002122000, 20261005100000/100100/100200 + docker-promote (usuário executa). Drift events/sales_orders sem migration em docs/bugs/2026-10-02-drift-colunas-sem-migration.md. Teste de segurança no dev: carregar .secrets/buzzclub-supabase-dev.env antes do vitest.
- 03/10/2026 12:30 — PR #31 (fix número da linha na importação dos cadastros) **mergeado**. **US3 da spec 009 (T037–T044) no PR #32**: migration 20261005100300 (colunas *_id nos 5 lançamentos; trigger financial_entry_sync_registries preenche texto legado a partir do id, recusa categoria de tipo errado e cadastro inativo em INSERT/troca de id; financial_registry_protect_in_use bloqueia exclusão; categoria mantém erro financial_category_in_use), RegistrySelects + lib/financialRegistryOptions no front, listas fixas removidas. Verificado com supabase db reset local, SQLs de verificação, vitest 991, test:security local 149/149, e2e T039a/b locais. **Padrões:** e2e local = seed src/test/e2e/fixtures/seed-local.sql (senha via variável psql) + Vite com VITE_SUPABASE_* do `supabase status -o env` no ambiente; segredos fictícios das functions precisam ≥32 chars (PORTAL_JWT_SECRET) senão client-portal-auth dá 500; selects Radix em jsdom abrem com keyDown ArrowDown (helper src/test/radixSelect.ts); hook de segredos casa `password="..."` até em comentário. **Bugs:** corrigido — mutações de pagar/receber não invalidavam consolidated-*; aberto — PV aprovado aparece 2× em Recebimentos (Manual + Pedido), total em dobro, correção na US4 (sales_order_id). Produção ainda pendente: migrations 20261002120000/122000, 20261005100000/100100/100200 (+100300 após merge) + docker-promote.
- 03/10/2026 13:12 — **Plano combinado com o usuário: terminar spec 009 na homologação → esperar aprovação → só então produção.** US3 (PR #32) mergeada e publicada no dev (migration 100300 + imagem :homolog = sha-585b246; falta pull no servidor). Abertos e empilhados (mergear em ordem): **#33 US4** (migration 100400: description/sales_order_id/influencer_id, regra do recebedor financial_payee_invalid, fix D3 reaprovação de PV em financial_events + transações previstas, fix PV duplicado em Recebimentos, filtros com total) → **#34 Phase 7** (100500 backfill financial_backfill_registries() + 100600 conciliação: financial_reconciliation_log, RPCs pending/reconcile, aba Pendências; SC-003 medido no dev com ROLLBACK = 100%) → **#35 US5** (100700 bank_account_balances(), saldo nas contas e no BI, centro de custo nos formulários, totais por centro) → **#36 Polish** (docs). Falta T069 (quickstart no dev) após deploy. **Decisão 03/10:** códigos de custo de projeto (COST_CATEGORIES) entram no Plano de Contas no grupo "Custos de projetos"; receita "outros" → Outros Recebimentos; cartao_porto/nubank → forma Cartão de crédito. **Gotchas:** papel postgres do Supabase não é superusuário (session_replication_role negado → usar ALTER TABLE … DISABLE TRIGGER USER); EXECUTE … INTO não atualiza FOUND (usar GET DIAGNOSTICS); hook do Claude bloqueia comando com `git …` + `-n` (falso positivo de --no-verify) — separar comandos. **Achado aberto:** SalesOrderDetailPage cria NF pendente com type "outgoing" (CHECK só aceita issued/received) → insert falha em silêncio.
- 03/10/2026 14:05 — Spec 009 inteira na main (#37 consolidou #34–#36, que tinham sido mergeados nas branches empilhadas — **gotcha: PR empilhado não muda de base sozinho se a base não for apagada; preferir PRs para a main**). Dev: migrations 100300–100700 aplicadas, backfill 100% (0 pendências), verificações SQL OK, test:security 154/154; imagem :homolog = sha-1460282 (falta pull no servidor). Checklist do quickstart (T069) no PR #38 (docs/TODAY_ACTIVITIES.md). **Aguardando aprovação do usuário na homologação**; depois: 10 migrations de produção em ordem (20261002120000 … 20261005100700) + test:security + docker-promote sha-1460282 (usuário executa). Script tmp/run_sql_dev.py roda SQL no dev com PG* em env.
- 03/10/2026 14:36 — Fix aba Notas Fiscais (PR #39: EditInvoiceDialog lia invoice.type com invoice nulo; regressão da US3) + PR #38 (docs homologação) mergeados. Imagem :homolog = **sha-63320c7** (substitui sha-1460282 na promoção de produção). Senha do nulladmin dev em .secrets/ está desatualizada (login 400). Aguardando validação do usuário na homologação.
- 03/10/2026 14:48 — Aba Notas Fiscais validada pelo usuário na homologação (sha-63320c7). **Roadmap** em Configurações (PR #40): src/data/roadmap.ts + RoadmapPanel; linguagem para leigos (Diretoria/Financeiro); feito (status no_ar/em_validacao) + próximos passos da ata de 02/10; texto no código; **regra no CLAUDE.md: atualizar a cada entrega e virar status para no_ar ao publicar em produção**. Visível a quem tem módulo configuracoes (admin, gestão, brand lead, financeiro).
- 03/10/2026 15:03 — PR #40 (Roadmap) mergeado; imagem :homolog = **sha-95cc700** (é a que vai para produção após aprovação). Aguardando validação do usuário (spec 009 + Roadmap).
- 05/10/2026 09:14 — Dependabot alerts desativados no fork (sem PRs). Security Scan/audit:ci da main falhava pelo GHSA-vfj7-8cjw-p6xm (braces@3.0.3 via tailwindcss@3, sem versão corrigida) → waiver até 2026-12-01 no PR #41. Docs da reunião de 02/10 (Gemini + questionário) movidos para docs/meetings/ no PR #42. CodeQL só avisa (code scanning desativado).
- 05/10/2026 10:02 — PR #48: CodeQL e Dependency Review só rodam com vars.ADVANCED_SECURITY_ENABLED=='true' (repo privado pessoal não tem Advanced Security). **Gotcha:** prefixo de branch `ci-` é recusado pelo git-validation (usar chore-); renomear branch no GitHub fecha o PR aberto.
- 05/10/2026 10:27 — Dependabot ligado pelo usuário; PRs #43 (vitest 5), #44, #45 (vite 8) mergeados quebraram a main (npm ci ERESOLVE). PR #49 reverte package.json/lock para 41c1035 e ignora bumps major de vite/vitest no dependabot.yml (gates locais OK). **Gotcha:** hook de commit-na-main olha o branch do diretório principal, não do worktree — trocar o repo principal de branch antes de commitar em worktree. #46 (react-router 7) pendente, testar após #49.
- 05/10/2026 11:28 — #46 (react-router 7.18.4) mergeado; imagem :homolog = sha-04aef36 publicada e redeploy no dev feito pelo usuário. PR #50: TODO atualizar menu Manual de Uso (src/data/manuals parado desde 20/02). PR #51: waivers do react-router removidos (restam 7).
- 05/10/2026 11:45 — PR #52: NF pendente do PV e BI usavam invoices.type 'outgoing' (CHECK só issued/received) → src/lib/salesOrderInvoice.ts (INVOICE_TYPE). Financeiro (spec 009) **não homologado** ainda. Spec 012 interligação (branch 012-interligacao-projeto, commit 80eee43): Visão geral do projeto por permissão, projeto obrigatório, herança, Tuesday, Pendências de vínculo. **Decisões 05/10:** toda tarefa tem projeto (interno → projeto 'Interno — Agência'); editar registro antigo sem projeto exige escolher projeto. Manual de Uso fica fora da 009 (TODO, PR #50).
- 05/10/2026 12:24 — Spec 011 (faixa de homologação) implementada, PR #53 com CI verde: APP_ENV só 'prod' esconde faixa/[DEV]; config.js entrega VITE_APP_ENV/VITE_APP_VERSION; Dockerfile ARG APP_VERSION (docker-build passa sha-<commit>); Configurações→Geral mostra ambiente/versão. **Gotcha de deploy:** copiar docker/docker-compose.yml novo para as pastas homolog e prod ANTES de subir a imagem, senão faixa aparece na produção. Specs 010 (áreas) só spec; 012 spec pronta aguardando plan.
- 05/10/2026 13:00 — Spec 012 plano (commit d5f05f7, branch 012-interligacao-projeto): achados — project_id já existe nas 18 tabelas, sem coerência cliente×projeto nem herança; delete_project_cascade apaga PV/contratos/financeiro em cascata (plano: bloquear, R6); Tuesday com projeto opcional dependente do cliente e portal lendo board_columns (modelo antigo). Plano: RPC get_project_overview (corte por has_module_access), trigger enforce_project_link, Pendências de vínculo, 5 PRs. Aguarda linha de base SQL na produção (quickstart §1) e confirmação de R3/R6.
- 05/10/2026 13:02 — **Regra do usuário: até segunda ordem, trabalhar exclusivamente no ambiente DEV** (Supabase dev + dev.buzzclub.co). Nada na produção (migrations, promote, SQL); linha de base da spec 012 roda no dev.
- 05/10/2026 14:49 — Spec 012: checklist de requisitos (35 itens) + spec ajustada (FR-004 só lançamentos gerais da agência sem projeto; troca de projeto com filhos recusada; exclusão de projeto bloqueada; FR-018 projeto interno; FR-019 suspender regra; FR-020 360px/teclado) + tasks.md com 66 tarefas em 8 fases / 6 PRs (commit 47683a5). Linha de base dev: 243/298 tarefas sem projeto. Próximo: /speckit-implement começando pelo MVP (F1–F3, Visão geral).
- 05/10/2026 16:12 — Spec 012 **MVP implementado** (PR #54, CI verde): aba Visão geral (get_project_overview), projeto interno, ProjectSelect, filtro ?projeto= em 4 listas, has_module_access alinhado ao roleDefaults do front (teste moduleDefaultsSync). Migrations 20261006100000/100100/100150 aplicadas no DEV. **Correção de segurança** achada pela revisão automática: RPC DEFINER ignorava RLS (Gestão via todos os PVs) → SECURITY INVOKER (docs/bugs/2026-10-05-visao-geral-ignorava-rls.md). **Regra:** RPC de leitura de negócio = INVOKER; DEFINER só para escrita controlada. **Gotchas:** types.ts atualizado só com o trecho novo (gen types --local sai em outro formato); tmp/sqlocal.sh roda SQL no supabase local; T022 movida p/ US2, T067 criada.
- 05/10/2026 16:39 — Bug 'cliente não salva' (PR #55): cliente era gravado, mas listas paginadas (clients/projects/sales_orders/influencers _paginated) não eram invalidadas pelas mutações. Correção: chave paginada dentro da base ['clients','paginated',page]. **Regra:** chave de variação de lista começa pela chave base da entidade. docs/MEMORIAS.md criado (consolidação das memórias, não commitado).

- 05/10/2026 20:12 — **Fim da sessão.** Merges #41–#56 na main. Spec 013 (custos por entrega do PV, item A7) em `specs/013-custos-itens-pedido-venda/` (branch homônima, **não commitada**): decisões Q1=% sobre valor ao cliente, Q2=despesa repassada pelo mesmo valor; **pendente Q3a/Q3b** (Qtd>1: despesa por linha/unidade; recomendado escolha por despesa). Próximo: responder Q3 → /speckit-plan da 013; gerar imagem :homolog pós-#56 (copiar compose novo antes); US2 da 012. Detalhe em [[../daily/2026-10-05|daily/2026-10-05]].

- 06/10/2026 20:01 — **Fim da sessão.** Spec 013 fases 1–6 implementadas (merges até #61; US4 no PR #62). PV sem exclusão; governança Admin/Financeiro/**Head Operação** (perfil novo); cancelamento e **reabertura** item a item; migrations 20261007100000–100610 só no DEV (security 170/170). PR #63 (docs): homologação automatizada (aguarda autorização P1–P3), `docs/ROADMAP.md` técnico, `docs/REGRAS_DE_NEGOCIO.md`, `docs/MEMORIAS.md`, hook journal + skill recap. Pendente: mascarar Bearer/URL com senha no journal; bugs delete_client_cascade e has_role. Detalhe em [[../daily/2026-10-06|daily/2026-10-06]].

- 07/10/2026 09:16 — Feedback de usuários: modelo + histórico em `docs/feedback/` (PR #64; `origem/` sigiloso no .gitignore). FB-2026-001 corrigido (PR #65). Detalhe em [[../daily/2026-10-07|daily/2026-10-07]].
