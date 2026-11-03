---
tags: [project, buzzclubhub, rbac, acessos, matriz]
aliases: [matriz de acessos buzzclub, FB-2026-005]
created: 2026-10-29
updated: 2026-10-29
---
<!-- Criado em: 29/10/2026 11:50 -->
<!-- Modificado em: 29/10/2026 11:50 -->

# buzzclubhub — Matriz de acessos por função

Parte de [[buzzclubhub]]. Requisito do futuro RBAC atômico.

## Fonte e arquivos
- Planilha: `docs/feedback/origem/BUZZCLUB_HUB_Matriz_de_Acessos.ods` (v2, 29/10/2026, regras do Buzz/CCO; fora do git).
- Doc versionada: `docs/access/MATRIZ_DE_ACESSOS.md` (sem nomes de pessoas).
- Anexo com nomes: `docs/feedback/origem/2026-10-29-matriz-acessos-por-pessoa.md` (fora do git).
- Feedback/respostas: `docs/feedback/2026-10-29-FB-005-matriz-de-acessos.md` + questionário 2.
- Gerador: `tmp/gen_matriz_acessos.py <pasta-csv> <repo>` (CSV exportado do .ods via soffice); reexecutar se a planilha mudar.
- Migrations: `20261029120000_matriz-acessos-estrutura.sql` (10 tabelas) e `20261029120100_matriz-acessos-carga.sql` (carga idempotente) — PR #107, só DEV.

## Modelo
- 4 níveis: total (3) > editar (2) > ver (1) > sem_acesso (0).
- 3 escopos de clientes: todos · todos_da_area (Especialista/Liderança) · time_da_conta (demais).
- 9 áreas: Diretoria, Tecnologia, Operações / ADM, Brand Lead, Creator Lab, Content House, Culture Decode, Experience Craft, Press Studio.
- 14 famílias; 9 faixas (Entrada, Júnior, Pleno, Sênior, Especialista, Liderança, Direção, Tech, Diretoria) sobre 13 níveis de carreira.
- 21 módulos (sub-abas), cada um mapeado ao ModuleKey do sistema (`system_module`).
- 80 perfis = família × faixa; 1680 permissões.
- Tabelas: access_levels, access_client_scopes, access_career_areas, access_career_families, access_career_bands, access_hub_modules, access_fixed_rules, access_profiles, access_profile_permissions, user_access_profiles (vazia).
- RLS: leitura só can_manage_users (Admin/Diretoria/Tech); user_access_profiles também o próprio; escrita só migration/service_role.
- Só catálogo: nada libera/bloqueia acesso ainda.

## Regras fixas (v2)
- 1 Financeiro (Projetos·Financeiro, Pagamentos Influ., Pedidos de Venda): só Buzz e time Financeiro.
- 2 Prospecção: só Buzz e Diretoria.
- 3 Cadastro/edição de cliente: só Buzz, Head de Operações e Financeiro; demais só veem.
- 4 Aprovar custos/P.Os/reembolsos: só Buzz, Head de Operações e Financeiro.
- 5 Pessoas e permissões: só Buzz e Tech.
- 6 Operações e Atendimento cadastram creators e sobem contratos.
- 7 Todos lançam custos e reembolsos para aprovação.
- 8 Estagiários/Assistentes nunca editam financeiro, contratos nem cadastro de cliente.
- 9 Na dúvida, menos acesso; acesso extra pedido a Buzz ou Tech com motivo.

## Time atual (aba "Por pessoa")
- Buzz — CCO (sócio-fundador) — perfil CCO.
- Tech — Operador do HUB — Tech · Operador do HUB.
- Nathalia — Head de Operações — Operações · Direção.
- Ian — Analista Jr de Atendimento (confirmado 29/10) — Atendimento de Contas · Júnior.
- Novo Brand Lead — Analista de Atendimento Pleno — Atendimento de Contas · Pleno.
- Leonardo — Coordenador de Creator Ops — Creator Operations · Liderança.
- Livia — Estagiária de Creator Ops — Creator Operations · Entrada.
- Carlos — Coordenador de Social Media (lidera Community) — Social Media · Liderança.
- Pietra — Estágio Social Media/Design — Social Media · Entrada.
- Giulia — Analista Pleno de Design — Design · Pleno.
- Asidayle — Supervisor de Planejamento — Planejamento Macro · Liderança.
- Erika — Analista Pleno de Planejamento — Planejamento Macro · Pleno.
- Lucas — Analista Sênior de Produção — Produção · Sênior.

## Respostas e pendências (29/10/2026)
- Fechado: Diretoria convida/gerencia mas não libera acessos (C2); perfil Tech criado (PR #106); custos no mesmo módulo, com visão exclusiva de aprovação; Entrada lança/edita o próprio, não aprova; não existem outros sócios.
- Aberto (questionário 2): Q1 Head Op × Pedidos de Venda (respostas contraditórias); Q2 alcance de "não podem acessar" clientes; Q3 prospecção; Q4 quem é Diretoria; Q5 regra 6 × Creator Ops; Q6 11 módulos não citados; Q7 visão de aprovação.
- A carga reflete a v2 sem as respostas; atualizar planilha → regenerar → nova migration de carga.

## Áreas e Cargos (29/10/2026)
- Decisão: Áreas do HUB = famílias da matriz (13; CCO → Diretoria, Operador do HUB → Tecnologia); áreas antigas (Gestão, Jurídico, Vendas, Financeiro, Atendimento, Planejamento, PR) seguem ativas.
- Decisão: Cargos = um por nível de carreira × família ("Analista Pleno I de Design", "Head de Operações"...) + CCO e Operador do HUB = 145; "Demais sócios" sem cargo.
- Script: `scripts/seed_areas_cargos.py --ods <planilha> [--json] [--apply]` (PR #109); só acrescenta, simulação por padrão, só DEV. Testado em ROLLBACK: 10 áreas + 145 cargos novos; não aplicado.
