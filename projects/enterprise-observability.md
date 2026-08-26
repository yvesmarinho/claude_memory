---
tags: [project, enterprise-observability, prometheus, grafana, loki, docker, infra]
aliases: [wfdb01 observability stack]
created: 2026-08-03
updated: 2026-08-03
source: importado de 19 sessões do Claude Code (~/.claude/projects/-home-yves-marinho-Documentos-DevOps-Vya-Jobs-enterprise-observability/)
---

<!-- Criado em: 03/08/2026 09:24 -->
<!-- Modificado em: 03/08/2026 09:30 -->

# enterprise-observability

Stack de observabilidade em produção compartilhada, administrada via Claude Code com metodologia SpecKit (spec → plan → tasks → analyze → implement). Componentes: Prometheus 3.2.1, Grafana 11.6.0, Loki 3.5.3 + Promtail 3.5.3, AlertManager 0.28.1, VictoriaMetrics 1.97.1, PostgreSQL 16, PushGateway, cAdvisor, Node Exporter, Traefik (proxy reverso com TLS Let's Encrypt), rodando via Docker Compose. Servidor principal `wfdb01` (Debian 12, AMD EPYC 12 vCPU, 48GB RAM, ~1.6TB SSD, Python 3.12+), host compartilhado com ~13 outras aplicações de produção (chatwoot, rabbitmq, idp-document-processor, multiagent, portainer, redis etc.). Servidores monitorados: `wfdb01`, `wfdb02` (banco de dados MySQL/PostgreSQL), `wf001`, `wf008`.

## Decisões arquiteturais/técnicas duráveis

- Toda mudança de infraestrutura segue fluxo SpecKit: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` (obrigatório antes de implementar) → `/speckit-implement`.
- `.specify/memory/constitution.md` é a autoridade de governança do projeto — conflitos com princípios MUST são sempre CRITICAL e exigem emenda formal (versão bump), nunca reinterpretação silenciosa no plan/tasks. Histórico de emendas: v1.1.0→v1.2.0 (exceções aos Princípios I e VI), v1.2.0→v1.3.0 (exceção ao Princípio II, cobertura de log do wfdb02).
- Princípio I: toda config de infra MUST estar versionada no repo (exceto arquivos com IPs/segredos reais, sob exceção formal).
- Princípio VI: mudanças disruptivas em produção PROIBIDAS entre 08:00–20:00 (America/Sao_Paulo); exceção formal permite reiniciar containers da própria stack de observabilidade a qualquer momento (Traefik e apps de outros times permanecem intocáveis, exigem SEMPRE janela + autorização explícita).
- Stack web opera atrás do Traefik (TLS via Let's Encrypt, roteamento por `Host()`); Prometheus/AlertManager também passam pelo Traefik via um provider de arquivo separado (`traefik_dynamic.toml`, projeto `traefik-wfdb01`), não via labels Docker do compose desta stack.
- A porta 9090 do host é o dashboard do Traefik (protegido por basic auth), não o Prometheus — Prometheus não publica porta no host; baseline/queries devem ser feitos via `docker exec` na rede interna, não via `curl localhost:9090`.
- Deploy real em produção usa `/opt/docker_user/enterprise-observability/` (não é git repo, sem sync automático) — separado do checkout local `promethues_prod_dir/`; alterações exigem backup manual antes de sincronizar (scp/ssh) e `docker compose up -d --force-recreate` quando só o conteúdo montado muda.
- Testes de cobertura de coleta vivem em `tests/test_data_collection_coverage.py` (pytest, marker `integration`), validando dados reais via SSH ao host e consultas ao Loki/Prometheus.

## Convenções/padrões adotados

- Documentação incremental de sessão em `docs/SESSIONS/YYYY-MM-DD/` (`SESSION_RECOVERY`, `DAILY_ACTIVITIES`, `FINAL_STATUS`, `SESSION_REPORT`), sempre por append.
- Bug-reports formais em `docs/bugs/BUG-NNN-*.md`; ADRs de decisão de arquitetura em `docs/decisions/ADR-NNN-*.md`.
- `TODO.md` recebe novas seções no topo por sessão, sem remover itens concluídos.
- Configs YAML validadas com `yamllint` real (não apenas `yaml.safe_load`) antes de aplicar em produção.
- Mudanças disruptivas em produção sempre exigem: grep preventivo por dependências internas → backup → sync → revalidação de sintaxe (`docker compose config -q`) → `--force-recreate` → validação do baseline pós-mudança.
- Nunca sobrescrever `CLAUDE.md` (bloco SPECKIT START/END) sem autorização explícita do usuário, mesmo quando o fluxo padrão do SpecKit pede.

## Problemas relevantes resolvidos

- Exposição desnecessária de portas (spec 007): Grafana publicava `3002:3000` (redundante ao Traefik) e cAdvisor publicava `8080:8080` sem autenticação, em modo `privileged`. Removidas do `docker-compose.yaml`; 3 scripts que dependiam dessas portas foram corrigidos antes. Documentado em `ADR-001`.
- Firewall `ufw` não protege portas publicadas via Docker (`BUG-001`): mesmo com regra `DENY` explícita (ex. Redis 6379), o tráfego passava porque o Docker insere suas próprias regras no `iptables` (chain `DOCKER-USER`) com prioridade sobre o `ufw`. node-exporter (9100, `network_mode: host`) foi corrigido manualmente (não é porta Docker); Redis e RabbitMQ (portas publicadas via Docker) permanecem expostos — correção real requer `ufw-docker` ou regras diretas na chain `DOCKER-USER` (`ADR-002`), não executada.
- PostgreSQL sem TLS na conexão com Grafana (`sslmode: disable`): decisão registrada de manter sem TLS por ora (T009b), pois habilitar exigiria preparar certificados sem derrubar a conexão em produção.
- Ring do Loki degradado recorrente (`loki-read`/`loki-write`/`loki-backend` "unhealthy"), causando erro 500 em queries de log. Mitigação recorrente: `docker compose --force-recreate` nos containers Loki restaura a convergência do ring — sem causa raiz definitiva registrada.
- wfdb02 (servidor de banco) com 0% de coleta de log (`BUG-002`): job `database-server-logs` do Promtail apontava para paths locais do wfdb01 inexistentes lá; 4 jobs de log eram configuração morta. Decisão final (risco aceito formalmente): node-exporter + mysql-exporter + postgres-exporter via systemd já cobrem métricas agregadas; instalar Promtail não compensou para um único servidor com acesso SSH fácil. Jobs mortos removidos do `promtail.yaml` de produção; teste correspondente convertido para `skip` documentado. Constitution emendada (Princípio II, v1.3.0).
- Cobertura "100%" da suíte de testes era enganosa (`BUG-003`): a suíte só validava consistência com `prometheus.yaml`/`promtail.yaml`, não com o que realmente existe nos servidores. Auditoria manual revelou ~9 gaps reais (ex. `rabbitmq-exporter` sem job, Redis sem exporter, 2 instâncias Traefik sem métrica própria) e blind spot estrutural: Promtail só roda no wfdb01 — wf001/wf008 têm 0% de cobertura de log. Solução: suíte ampliada (spec 008) com testes que falham propositalmente para cada gap conhecido.

## Pendências / próximos passos conhecidos

- P0 SECURITY não resolvido: bypass Docker/`ufw` — Redis (6379) e RabbitMQ AMQP/UI (5673/15673) seguem acessíveis externamente; correção requer `ufw-docker` ou regras manuais na chain `DOCKER-USER` (`ADR-002`), pendente de janela dedicada.
- Portas sem qualquer regra de firewall documentadas: 8000, 8001, 8081 (dozzle — risco elevado), 8083, 8084, 3901, 9090 (dashboard Traefik, só basic auth).
- `sslmode: disable` na conexão PostgreSQL↔Grafana permanece sem correção.
- Avaliar instalação de Promtail em wf001 e wf008 (0% de cobertura de log) — candidato a spec 009.
- Aplicar de fato a mitigação escolhida em `ADR-002` (bypass Docker/ufw) quando houver janela e autorização.
- 2 achados MEDIUM não bloqueantes no `plan.md` da spec 008: referências obsoletas ao playbook Promtail do wfdb02 ainda não limpas.
- Regra do projeto: nunca fazer push automático ao final de sessão — sempre aguardar confirmação explícita do usuário.
