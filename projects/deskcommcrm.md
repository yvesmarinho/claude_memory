---
tags: [project, deskcommcrm, crm, whatsapp, docker, vya-digital]
aliases: [DeskcommCRM, CRM Vya.Digital]
created: 2026-10-08
updated: 2026-10-13
---

# DeskcommCRM — adaptação para Vya.Digital

## Contexto
- Fork local do DeskcommCRM (open source, upstream `melgarafael/DeskcommCRM`), CRM de vendas com IA e WhatsApp via WAHA.
- Repo local: `~/Documentos/DevOps/DeskcommCRM`; fork: `yvesmarinho/DeskcommCRM` (remote `origin`); upstream só fetch, push desabilitado.
- Nunca fazer push/PR/issue no repositório original.
- Documento de levantamento: `docs/objetivo.md` (concluído em 08/10/2026).
- Arquivos de deploy gerados vão para `~/VyaJobs/enterprise-docker/deskcommcrm` (repo `adminvyadigital/enterprise-docker`).
- Credenciais em `.secrets/` (`redis.json`, `smtp.json`, `ia_keys.json`), ignorado pelo git, permissão 600.

## Decisões de arquitetura (08/10/2026)
- Escopo: todas as features menos telefonia (`asterisk`, `wacalls`, `voice-agent` removidos).
- Supabase self-hosted completo, um stack por ambiente (homolog e prod no mesmo docker server).
- 3 imagens (`app`, `worker`, `scheduler`) num repositório Docker Hub único `adminvyadigital/deskcommcrm`, só amd64.
- Tags: móvel `<imagem>-homolog` / `<imagem>-latest`; imutável `<imagem>-AAAAMMDD-HHMM-<ambiente>`; o compose aponta para a imutável.
- Build por script local, após `docker login`; branch `main` → prod, `homolog` → homolog.
- Domínios: app `crm.vya.digital` / `crm-dev.vya.digital`; API Supabase (Kong, pública) `api-crm.vya.digital` / `api-crm-dev.vya.digital`.
- Studio do Supabase sem domínio, acesso só por túnel SSH.
- DNS criados em 13/10/2026 no Cloudflare: os 4 hostnames, tipo A para o IP público do docker server, "Somente DNS" (sem proxy).
- Traefik existente na rede externa `app-network`, certresolver `lets-encrypt`, entrypoint `websecure`; sem Caddy e sem portas publicadas.
- Redis: stack existente compartilhada, DB index homolog=8, prod=9, via ponte `serverless-redis-http` (app usa API Upstash).
- WAHA Core inicialmente (migração para Plus depois dos testes, troca só `WAHA_IMAGE`); um WAHA por ambiente.
- E-mail por SMTP próprio; IA com chaves de `.secrets/ia_keys.json`.
- Volumes em bind mount `/opt/docker_user/deskcommcrm/<ambiente>/<serviço>`; UID:GID 2002 dono da pasta do ambiente e de `backup/`; pastas de dados com o usuário da imagem.
- Backup: 22h gera dump Postgres + Storage + volume WAHA (escrita `.partial` + rename); 00h IDrive envia; 06h apaga arquivos com mais de 24h; retenção de 7 dias no IDrive.
- Limites de memória: homolog ~2,8 GB, prod ~4,5 GB, configuráveis no `.env`.

## Histórico
- [[daily/2026-10-08]] — levantamento de requisitos concluído; git reconfigurado; modelos de `.secrets/` criados.
- 13/10/2026 — registros DNS dos 4 hostnames criados; `docs/objetivo.md` atualizado.
- 13/10/2026 — `build.sh` criado em `enterprise-docker/deskcommcrm` (buildx amd64, recusa branch fora de main/homolog e árvore suja, confere tag com `docker manifest inspect`, imprime APP/WORKER/SCHEDULER_IMAGE para o .env; `--dry-run`). Ainda sem build real.
- 13/10/2026 — composes prontos (validados com `docker compose config`, sem subir): Supabase oficial v0.8.1 copiado por `supabase-sync.sh` + `supabase.override.yml` + `crm.yml`, um projeto por ambiente (`deskcomm-<amb>`), contêineres `deskcomm-<amb>-*` (app-network compartilhada), labels Traefik em lista (chave de label não interpola), Studio só via túnel no gateway em loopback (8001 homolog / 8000 prod); `init-env.sh` gera `.env`/`crm.env` (600) de .secrets; `dc.sh` atalho. Chaves assimétricas do Supabase não usadas.
- 13/10/2026 — `bootstrap.sh` (equivale às etapas 7/8 do install.sh do kit): extensões, baseline (novo: ON_ERROR_STOP; existente: modo update com log), chaves nuvemshop/cpf em private.app_secrets, dono via API admin do GoTrue executada no contêiner app (sem segredo em argv), org slug vya-digital, platform_admins mfa_required=false, sync-model-catalog. Só shellcheck; sem execução real.

## Próximo passo
- Serviço de backup; branch homolog no fork; primeiro build real; primeira subida em homolog.
