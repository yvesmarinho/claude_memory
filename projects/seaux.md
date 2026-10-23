---
tags: [project, enterprise-seax-auto-vending, seaux, vendas, ia, redes-sociais, marketing, vya-jobs]
aliases: [Seax Auto Vending, SEAUX, Seax-Divylgação-Redes-Sociais]
created: 2026-10-21
updated: 2026-10-23
---

<!-- Criado em: 21/10/2026 11:55 -->
<!-- Modificado em: 23/10/2026 10:27 -->

# SEAUX — enterprise-seax-auto-vending

Plano para uma força de vendas digital automatizada com IA: divulgação em redes sociais e demais mídias, publicação agendada de conteúdo e agente de vendas com IA que qualifica o lead e agenda reunião com humano.

## Contexto
- Pasta local: `~/Documentos/DevOps/Vya-Jobs/enterprise-seax-auto-vending` (home016).
- Repositório: `github.com/yvesmarinho/enterprise-seax-auto-vending` (`main` protegida por convenção: trabalho em branch + PR).
- Projeto no Claude: "Seax-Divylgação-Redes-Sociais".
- Fonte de verdade: `context.md`, `questionario-contexto.md` (respondido) e a tabela de decisões do `CLAUDE.md` do repo.
- Fluxo: `objetivo-init` v2 → debate de arquitetura → constituição → especificação → gate spec validation → plano → tarefas → implementação (ver [[objetivo-init-minimal-readme]]).
- Fase atual: planejamento; entregável agora é só o plano (documento). Prioridade: divulgação primeiro, vendas depois. Prazo: primeiro canal no ar em 30 dias.

## Fontes
- Vídeo de referência (informações do projeto): "The Man Who Mastered Claude: The FASTEST Way To Use AI Agents In Your Business, Content & Life" — canal The Calum Johnson Show — https://youtu.be/0PjDlI21es4?si=UpzBckjR8K919Jyp
- `context.md` e `questionario-contexto.md` na pasta local; `CLAUDE.md` do repositório.

## Decisões (questionário, 21/10/2026)
- Modelo B2B e B2C, Brasil, atendimento em PT-BR; tom de voz descontraído.
- Oferta: serviço recorrente (SaaS/assinatura), ticket < R$ 500; catálogo e whitepapers ainda em elaboração (oferta agnóstica).
- Plataforma multi-tenant, reutilizável para vários catálogos/clientes (ver decisão H-04 em [[consulta-ai-ia-br]]).
- Divulgação: LinkedIn, Instagram, Facebook, YouTube, TikTok, X, blog/site, e-mail.
- Conversa/venda: WhatsApp, Instagram Direct, Messenger, chat no site, e-mail (sem voz).
- Conteúdo: IA gera, humano aprova antes de publicar.
- Limite da IA: tira dúvidas, qualifica e envia proposta; **não** fecha venda nem gera cobrança.
- Agenda: Google Calendar, 1 pessoa, 8h às 18h.
- LLM: Claude e OpenAI. Hospedagem: Docker/Swarm próprio (ver [[devops-containers]]).
- Mídia paga: sim, com orçamento baixo. Perfis Business e base de leads ainda não existem.

## Em aberto
- Stack de automação (aceita sugestões; candidatos que administro: n8n, Chatwoot, Typebot, Botpress, Flowise, Vtiger — ver [[enterprise-n8n-workflow]], [[infra-stack]]).
- Critério de handoff para humano, metas de 90 dias, orçamento total.
- LGPD: controlador, DPO, política de privacidade; temas proibidos e fora de escopo.
- Registrar como `assumptions`/`open_questions` no `objetivo-init`, sem inventar respostas.

## Estrutura Claude (repo)
- `CLAUDE.md` compartilhado; preferências pessoais em `CLAUDE.local.md` (ignorado).
- `.claude/settings.json`: libera `git status/diff/log`, `yamllint`, `check-jsonschema`; bloqueia leitura de `.env`, `*.pem`, `*.key`.
- Comandos: `/analisar-questionario` (compara respostas × decisões e propõe atualizar `context.md`) e `/validar-spec` (yamllint + check-jsonschema no `objetivo-init`).
- Gotcha: o acesso remoto ao computador não grava em `.claude/`; a pasta chega na cópia local via git.

## Histórico
- [[daily/2026-10-21]] — análise do `context.md`; questionário (5 fases, 31 perguntas, campos **Resposta:**) criado e respondido; estrutura Claude; repo com commit inicial (`.gitignore`) e PR #1 mergeado.
- [[daily/2026-10-23]] — nota renomeada para `seaux.md` (achar pelo nome), antiga movida para `.trash/` e vídeo de referência adicionado em Fontes.

## Próximo passo
- Ligar a pasta local ao repo: `git init -b main`, `git remote add origin git@github.com:yvesmarinho/enterprise-seax-auto-vending.git`, `git fetch origin`, `git reset origin/main`, `git checkout -- .claude`, `git status`.
- Rodar `/analisar-questionario`, atualizar `context.md` e escrever o plano de divulgação (canal inicial em 30 dias).
- Depois: preencher o `objetivo-init` v2 e passar pelo gate.
