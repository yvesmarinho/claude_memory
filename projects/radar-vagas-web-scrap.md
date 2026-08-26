---
tags: [projeto, python, web-scraping, speckit, mysql]
aliases: [radar-vagas]
created: 2026-08-11
updated: 2026-08-11
---

# radar-vagas-web-scrap

Projeto pessoal: monitoramento de vagas de trabalho via web scraping em sites sem alerta
próprio, notificando por Telegram/WhatsApp/E-mail assim que uma vaga nova elegível é
detectada — objetivo de se candidatar antes dos concorrentes.

- Repositório: `/home/yves_marinho/Documentos/DevOps/Projetos/radar-vagas-web-scrap`
- Construído via workflow SpecKit completo (constitution → specify → plan → tasks → analyze → implement).

## Arquitetura

- Camadas + Casos de Uso: `domain/` (entidades/regras/exceções, zero deps externas) →
  `application/` (casos de uso + ports) → `infrastructure/` (scraping, persistência, notificação)
  → `cli/`.
- Ports/Adapters: `NotificacaoPort` (Telegram/E-mail/WhatsApp), `ParserHtmlPort` (por site-alvo),
  `VagaRepositoryPort` (MySQL).
- Persistência: MySQL remoto (host `home011`), tabela `vaga_analisada`, idempotente
  (`INSERT ... ON DUPLICATE KEY UPDATE`).
- Scraping: `requests` + `BeautifulSoup`; `robots.txt` fail-safe (bloqueia por precaução se a
  leitura falhar); rate-limit por domínio via `time.monotonic()`.
- Agendamento: `cron` externo (`scripts/install-cron.sh`), não scheduler in-process.
- Logging: `config_logging()` grava em stdout **e** em `./logs/scraping.log` simultaneamente.

## Feature: `notificacoes_desabilitadas` (FR-012)

Flag global no `config/sites-alvo.yaml` que suprime envio em **todos** os canais de
notificação ao mesmo tempo, sem parar scraping/dedupe/elegibilidade — útil para testar a
configuração sem realmente notificar. Vaga suprimida NÃO é persistida como analisada, para
voltar a ser candidata normal a alerta quando a flag for desativada (evita perder o alerta
silenciosamente).

## Sites-alvo (parsers)

- **apinfo.com** (`https://www.apinfo.com/apinfo/inc/list4.cfm`) — site legado ColdFusion
  (`.cfm`), busca de vagas de TI. Formulário provavelmente **POST** (URL não muda após
  pesquisar). Tem **rate-limit agressivo por IP** — bloqueou já na primeira requisição de
  teste ("Seu limite de consultas está temporariamente esgotado"). Parser ainda não
  implementado — pendente captura do payload real do POST via DevTools do navegador antes de
  fazer novas requisições diretas.

## Qualidade

- 71 testes, cobertura ~93%, `ruff` + `mypy --strict` limpos.
- `.pre-commit-config.yaml` com hooks em modo manual (`stages: [manual]`).

## Notas relacionadas

- [[../daily/2026-08-11|2026-08-11]] — sessão de implementação completa + FR-012 + descoberta do apinfo
