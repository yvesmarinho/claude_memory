---
tags: [project, enterprise-hermes-agent, docker, fastapi, whatsapp, ai-agent]
aliases: [hermes agent, vya workforce]
created: 2026-08-03
updated: 2026-08-03
source: importado de 9 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Vya-Jobs-enterprise-hermes-agent/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:31 -->

# enterprise-hermes-agent

Stack de containerização (Docker/Docker Compose + Traefik) que empacota, expõe e opera o **Hermes Agent** (bots de IA multimodais, principalmente WhatsApp via Baileys) para clientes da Vya Digital. Repositório monorepo em `src/`, com múltiplos serviços FastAPI/aiohttp independentes que se comunicam por HTTP e compartilham um volume de perfis (`profiles/<agent_id>/`). Gerenciado com `uv`/Python, `gh` CLI, e patches customizados aplicados sobre o código upstream do hermes-agent (`NousResearch/hermes-agent`).

## Arquitetura

- Quatro serviços HTTP independentes em `src/`, cada um com Dockerfile/compose próprios, sem monólito:
  - `src/app-vya-digital/` — dashboard operacional (aiohttp, porta 9119 externa própria do painel), lê/escreve direto no volume de perfis (SQLite `state.db`/`appointments.db`/`leads.db`, JSON, `produto.yaml`); só fala HTTP com `vyadigital_api` para restart/WhatsApp connect/QR.
  - `src/hermes_agent/hermes-api/` ("vya-workforce-api") — plano de controle determinístico (FastAPI, porta 8700): CRUD de agentes, knowledge, skills, canais, calendário Google, follow-up, contatos, memória. Explicitamente nunca invoca LLM/canal de conversa.
  - `src/vyadigital_api/` (pacote interno `docker_api`, container `hermes-interaction-api`) — proxy fino FastAPI em frente à `hermes-api`, exposto publicamente via Traefik (`hermes-api.vya.digital`).
  - `src/hermes_channel_gateway/` — serviço criado (ADR-001) para abstração multicanal via padrão Ports & Adapters: contrato `ChannelPort` + adapter de referência para Evolution API (WhatsApp), preparando extensão futura para Telegram/Discord/Instagram sem reimplementar bridges.
- `src/hermes_agent/hermes-agent/` era a cópia vendorizada e patchada do hermes-agent; trocada por clone direto do GitHub no build (`git clone` + `git checkout` pinado por **SHA imutável de commit**, não apenas tag, para blindar contra `git tag -f`), com `hermes-agent-patches.diff` aplicado por cima em modo best-effort (`git apply --reject || true`, decisão explícita do usuário — build não falha se algum hunk não aplicar).
- O gateway de mensageria de cada agente é subprocesso dinâmico gerenciado pela própria `vya-workforce-api` (não é serviço fixo do compose); o gateway do perfil administrativo `dashboard` roda em container `gateway` dedicado.
- Segredos via **Docker secrets** (`.secrets/hermes/<NOME>`, montados em `/run/secrets/`), injetados como env vars por um `entrypoint.sh` compartilhado — nunca em `.env` texto plano.
- `config.base.yaml` montado como volume read-only no serviço `api`: todo agente novo herda essa base ao ser provisionado.
- Autenticação do dashboard via plugin nativo `dashboard_auth/basic` do hermes-agent (usuário/senha, hash scrypt, sessão HMAC), habilitado de forma idempotente pelo próprio `entrypoint.sh` (necessário porque versões novas do upstream tornaram plugins opt-in).
- Domínios de produção: `hermes.vya.digital` (dashboard, container `vya-workforce-dashboard`) e `hermes-api.vya.digital` (proxy, container `hermes-interaction-api`); build/push de imagens é manual via `scripts/build-container-images.sh` — não há CD automatizado; deploy remoto exige acesso SSH próprio ao host de produção.

## Decisões técnicas duráveis

- Imagem Docker do `api` (`vya-workforce-api`) e do dashboard (`hermes-agent`) vêm do mesmo `Dockerfile` multi-stage: stage `hermes-base` compartilhado + `hermes-agent-assets` (build do dashboard web + TUI) só para o alvo `hermes-agent` — o alvo `api` não herda mais isso, reduzindo a imagem de 1.33 GB para 799 MB (~40%).
- `skills/` e `data/profiles/` são bind mounts graváveis (não copiados na imagem) para permitir atualização em runtime sem rebuild.
- O perfil `dashboard` precisa de um symlink `skills -> /app/skills` (criado pelo `entrypoint.sh`, idempotente) para enxergar as skills customizadas do Vya — perfis auto-criados pelo hermes-agent não usam esse volume por padrão.
- Reconciliação de patches upstream é trabalho manual (não automatizável no Dockerfile): quando o upstream evolui, hunks rejeitados precisam ser reescritos contra o código atual, não apenas reaplicados com fuzzy matching.
- `VYA_API_KEY` é o secret compartilhado entre os três/quatro serviços (não duplicar).
- Regra do projeto: nunca commit direto na `main` — sempre branch + PR.
- Todo credential achado em arquivos de trabalho (`.secrets/config.yaml`, zips de dump de outro projeto) é migrado para `.secrets/hermes/` e nunca exibido no chat.

## Convenções/padrões adotados

- Routers FastAPI finos que só repassam para o upstream via `httpx.AsyncClient` (padrão em `vyadigital_api`), erros convertidos em `VyaApiError`/`HTTPException`; sem lógica de negócio nos proxies.
- Escrita atômica de arquivos (`tmp.write_text` + `tmp.replace(path)`) e lock exclusivo via `fcntl.flock` para JSON compartilhado (`hermes_fs.py:locked_json`).
- `Settings` via `pydantic-settings`, prefixo de env por serviço (`DOCKER_API_*`), exceto secrets compartilhados que usam `validation_alias` sem prefixo.
- Dockerfiles com `ARG`s de versão no topo (`HERMES_AGENT_REPO/REF/SHA`), atualizáveis por script Python (`scripts/update_hermes_agent_version.py`) que consulta a API do GitHub.
- Bug reports documentados em `docs/bugs/`; sessões registradas em `docs/SESSIONS/YYYY-MM-DD/`; decisões arquiteturais em `docs/decisions/ADR-*`.
- Antes de cada commit: gitleaks + hook de pre-commit local; achados revisados individualmente (muitos falsos positivos em código vendorizado, exemplos de documentação e regex de auto-redação).
- Caminho dos Docker secrets nos compose varia entre monorepo local (`../../.secrets/hermes/...`) e deploy standalone no servidor (`.secrets/hermes/...`, sem `../../`) — ponto de atenção recorrente ao sincronizar.

## Problemas relevantes resolvidos

- WebSocket "session ended (code 1006)" no chat do dashboard: causa raiz era o pool de threads padrão do asyncio saturado entre leitura do PTY (`web_server.py`) e despacho JSON-RPC (`tui_gateway/ws.py`), estourando timeout de 10s e fechando a conexão sem frame de close limpo. Corrigido portando dois PRs do upstream (executor de escrita dedicado + pool de RPC adaptativo por CPU) para dentro do `hermes-agent-patches.diff`.
- Recorrência do 1006 + `npm install failed`: Dockerfile nunca instalava dependências do `ui-tui` (Terminal UI Node), causando tentativa de instalação em runtime sem acesso à rede — corrigido adicionando `npm install` no build da imagem.
- Login do dashboard quebrado após rebuild ("Sign-in unavailable"): hermes-agent tornou plugins opt-in; `dashboard_auth/basic` deixava de carregar. Corrigido tornando o `enable` do plugin idempotente e persistente no `entrypoint.sh`.
- Login aceitava credenciais mas voltava sempre à tela de login: efeito colateral de um patch anterior (`supports_session=False` no provider basic) que também bloqueava o auth gate de reconhecer a sessão emitida. Corrigido com guard de 404 limpo em `/auth/login` para providers password-only, revertendo os workarounds anteriores.
- Vazamento de credenciais reais em zips/configs durante o primeiro commit do repo (VYA_API_KEY, chaves Groq/Maritaca) — identificado manualmente (gitleaks não escaneia dentro de zips), removido do versionamento e movido para `.secrets/`.
- ~700 alertas de CodeQL (SSRF crítico + path traversal) vinham de `tmp/projeto-vya/` — cópia de rascunho obsoleta, já superada pela versão vendorizada limpa; removida do versionamento (3035 arquivos).
- Duplicação de lógica entre `app-vya-digital/server.py` e `hermes_fs.py` (gateway_state, safe_profile_path, escrita atômica, leitura de SOUL.md/produto.md) introduzida por outro desenvolvedor; mapeada, documentada com comentários `# SYNC:` apontando a fonte.
- Traefik "chega no host, não chega no container": porta do `loadbalancer.server.port` errada (porta do host em vez da porta interna do container) + nome de middleware inexistente — ambos corrigidos.
- `origin/main` sem a pasta `src/`: não era bug, apenas commits locais nunca enviados (`git push` pendente).

## Pendências / próximos passos conhecidos

- Reconciliar em produção: publicar (`docker push`) e fazer redeploy das imagens mais recentes no servidor remoto — vários fixes ficaram validados só localmente em determinado ponto.
- Habilitar "Dependency graph" nas configurações de segurança do repositório no GitHub (bloqueia o check "Review Dependencies" em todos os PRs, incluindo os do Dependabot).
- Adapters concretos para Telegram/Discord/Instagram no `hermes_channel_gateway` ainda não implementados (só WhatsApp/Evolution como referência).
- Validar em produção o auto-flush do plugin `whatsapp-mixed` (documentado como "em validação" no README do hermes-api).
- Sem suíte de testes automatizados real para `vyadigital_api` nem `hermes-api` (só os 9 testes novos do `hermes_channel_gateway`).
- `.gitignore` com mudanças pendentes não relacionadas (remoção de exceção de `tmp/projeto-vya/`) deliberadamente fora de commits, aguardando decisão explícita.
- Symlink `src/hermes_agent/skills -> ../docker_hermes/skills` quebrado no ambiente local — contornado localmente com `git update-index --skip-worktree`, não corrigido na origem.
- Decidir se o `.env` deveria conter fallback de fonte de verdade unificada entre variáveis de compose (`HERMES_GATEWAY_PORT`) e variáveis de runtime — parcialmente esclarecido, não formalizado.
