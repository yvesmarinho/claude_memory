---
tags: [project, devops-containers, docker, docker-compose, traefik, infra]
aliases: [devops-containers]
created: 2026-09-15
updated: 2026-09-15
source: sessão Claude Code (~/Documentos/DevOps/Projetos/devops-containers)
---

<!-- Criado em: 15/09/2026 -->
<!-- Modificado em: 15/09/2026 -->

# devops-containers

Repositório central de configurações de containers, Dockerfiles e arquivos
Docker Compose para infraestrutura e serviços da Vya Digital. Domínio
infrastructure, Python 3.12+ gerenciado por `uv`.

## Decisões arquiteturais/técnicas duráveis

- **`containers/` é o diretório central** do repositório para tudo relacionado a
  containers (Dockerfiles, `docker-compose.yaml`, `.env.example`), um
  subdiretório por serviço — decisão explícita para não misturar config de
  infra com `src/` (reservado a código Python de apoio: scripts de build,
  validação de compose etc.), seguindo a regra global de organização por
  responsabilidade.
- `containers/traefik/` é o reverse proxy/edge router de referência do
  projeto: **fonte única de verdade em `docker-compose.yaml`** (config estática
  via `command:`, roteamento dinâmico via labels) — decisão explícita contra
  manter `traefik.toml`/`traefik.yaml`/`traefik_dynamic.toml` paralelos, que
  divergiam entre si na versão original (rede `app-network` vs `web`,
  certresolver com nomes diferentes).
  - Dashboard nunca exposto via `api.insecure=true`/porta pública — só HTTPS +
    router dedicado + `basicAuth` via `usersfile` (`.secrets/traefik_users`,
    nunca versionado).
  - `acme/acme.json` e `.secrets/` vivem fora do versionamento (`.gitignore`
    local), permissão 600/700; rede externa `web` e estrutura de pastas
    criadas por `containers/traefik/scripts/setup-network.sh` (que chama
    `scripts/init-acme.sh` internamente para preparar o `acme.json`).
  - Imagem pinada em versão específica (não `:latest`); atualizada para
    `traefik:v3.7` (LTS) em 15/09/2026.
  - Nem o Traefik nem scripts deste repo "geram" chave de conta ACME
    manualmente — o próprio Traefik registra a conta e emite certificados no
    primeiro start via protocolo ACME; `init-acme.sh` só garante que
    `acme.json` existe com permissão 600 antes disso.
- `containers/modelo-traefik/` é o template para novos serviços atrás do
  Traefik (renomeado de "modelo trafik yaml", que tinha espaço e typo no nome
  do diretório — corrigido para kebab-case). Preenchido via
  `scripts/apply-placeholders.sh` (substitui `{{PROJECT_NAME}}`, `{{IMAGE}}`,
  `{{SUBDOMAIN}}`, `{{DOMAIN_NAME}}`, `{{APP_PORT}}` num compose gerado num
  diretório novo, nunca edita o modelo original).
  - **Decisão de segurança confirmada por engano de produção**: cada serviço
    gerado define seu **próprio middleware de headers** (`{{PROJECT_NAME}}-headers@docker`),
    self-contained — não referencia um middleware compartilhado de outro
    projeto/compose (`security-headers@docker`, definido só em
    `containers/traefik`). Essa dependência cruzada foi tentada numa primeira
    revisão e **quebrou aplicações reais** (router fica com middleware "não
    encontrado" quando o container que o define não está no ar com aquela
    label, e o Traefik desativa a rota inteira — não é só falta de header, o
    serviço fica inacessível). Mesmo em topologia onde todos os apps
    compartilham a mesma stack/rede do `containers/traefik`, o middleware
    próprio por serviço foi escolhido como padrão para não acoplar a
    disponibilidade de cada app à de outro projeto.
  - Nunca publicar a porta da aplicação no host (`ports:`) quando roteada pelo
    Traefik — usar `expose:`, a app só é alcançável via rede interna `web`.
  - `traefik.port=...`, `headers.SSLRedirect`, `headers.SSLHost` são labels da
    API v1 do Traefik, removidas do v2/v3 — silenciosamente ignoradas, nunca
    reintroduzir. `forceSTSHeader` **continua válido** no v2/v3 (não confundir
    com as duas anteriores).
  - Compose não resolve `${VAR}` em **chaves** do YAML (só em valores) — nome
    de serviço/container precisa ser placeholder de texto resolvido antes do
    `docker compose up`, nunca `${PROJECT_NAME}:` como chave.
  - `containers/traefik/README.md` ("Expondo um novo serviço") aponta para
    este modelo/script como forma padrão de criar novos serviços — não deve
    voltar a documentar YAML manual inline.
- Erro de validação encontrado ao subir pela primeira vez: Let's Encrypt
  recusa registro de conta ACME quando o e-mail/domínio usado é `example.com`
  (`urn:ietf:params:acme:error:invalidContact`, domínio reservado por RFC
  2606) — sintoma de `.env` copiado de `.env.example` sem substituir os
  placeholders antes do `docker compose up -d`, não um bug de configuração.
  Corrigido preenchendo `.env` com domínio/e-mail reais e recriando
  `acme.json` via `scripts/init-acme.sh`. **Ambos os containers (Traefik + app
  gerada por `modelo-traefik`) foram configurados e iniciados com sucesso em
  15/09/2026.**

## Memória persistente

- O `CLAUDE.md` do projeto documenta a integração com este vault
  (`memory/profile.md`, `memory/preferences.md`, `memory/infra-stack.md`,
  `00-index.md`) e aponta para esta nota como registro de decisões duráveis do
  projeto.

## Pendências / próximos passos conhecidos

- Nenhuma pendência crítica aberta; `containers/traefik` e
  `containers/modelo-traefik` revisados, testados localmente com
  `docker compose config` e validados em execução real (ambos os containers
  no ar).
- Avaliar, quando houver mais serviços reais usando `modelo-traefik`, se vale
  a pena um segundo modo (documentado, não padrão) de middleware compartilhado
  para quem sabe que está sempre na mesma stack — mencionado no README mas não
  implementado.

## Sanitização de containers (15/09/2026)

- **`containers/adminer`, `bookstack`, `dashy`, `metabase`, `watchtower`, `wud`,
  `wuzapi` sanitizados e consolidados**: o usuário adicionou esses diretórios
  copiados de outro repositório/ambiente real (cliente "Vya Digital"), cada um
  com múltiplas variantes por servidor (`wf001`/`wf002`/`wf003`/`wf005`/`wf008`,
  `journeydb01`, `journeyprx01`, `nuvem001`, `Model`). Continham dados reais em
  texto puro: domínio `vya.digital` e dezenas de subdomínios, 6 e-mails
  pessoais de colaboradores (em `dashy` `conf.yml`, com hashes de senha),
  senhas de banco/SMTP/RabbitMQ, um token Docker Hub (`dckr_pat_...`) e hash
  htpasswd reutilizado em vários `.env`. **Decisão**: cada serviço foi
  reduzido a um único `docker-compose.yaml` + `.env.example` genérico
  (variantes duplicadas removidas), todo dado real substituído por
  placeholder/variável de ambiente. Token Docker Hub e credenciais RabbitMQ
  expostos foram rotacionados pelo usuário após a sanitização.
- **Chave `version:` removida de todos os `docker-compose.yaml`** do
  repositório (obsoleta desde o Compose v2, ignorada silenciosamente ou gera
  warning) — não reintroduzir em templates novos.
- `containers/wud/docker-compose.yaml` mantém a convenção de placeholders
  literais `ChangeHostName`/`DnsName` no `.env.example`, substituídos via
  `sed` no host de destino (documentado em `containers/wud/README.md`) — não
  trocar por variáveis `${}` nesses dois campos porque o valor é literal no
  hostname/container_name, resolvido antes do `docker compose up`.
- PR aberto: https://github.com/yvesmarinho/devops-containers/pull/6
  (branch `feat-containers-traefik-setup` → `master`).
- **Pendência de config observada**: o branch padrão do repositório no
  GitHub está apontando para `feat-containers-traefik-setup` em vez de
  `master` — provável engano de configuração, avaliar corrigir.
