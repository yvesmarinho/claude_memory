---
tags: [project, buzzclubhub, react, typescript, supabase, vite, rls, rbac]
aliases: [buzzclub, buzzclubhub]
created: 2026-09-03
updated: 2026-09-11
source: sessão de 03/09/2026 (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-buzzclub-buzzclubhub/)
---

<!-- Criado em: 03/09/2026 17:45 -->
<!-- Modificado em: 11/09/2026 10:41 -->

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
