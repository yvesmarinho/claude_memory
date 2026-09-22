# Onboarding — Agência de Marketing de Influência

*(21/09/2026)*

## Contexto e escopo

Este documento formaliza o onboarding técnico-administrativo do novo serviço prestado a uma agência de marketing de influência, cobrindo a criação e a governança das contas de infraestrutura necessárias ao projeto: Google Workspace, Lovable e Supabase.

Premissa central: nenhuma dessas contas deve ficar amarrada exclusivamente ao e-mail pessoal do sócio/dono da agência. Concentrar assinaturas de serviço no e-mail pessoal de uma única pessoa cria um ponto único de falha — perda de acesso por saída do sócio, esquecimento de senha, bloqueio de conta, falecimento, litígio societário ou simples indisponibilidade (férias, viagem) trava toda a operação.

Para mitigar isso, a empresa deve provisionar um **e-mail administrativo institucional** (ex.: `admin@dominio.com.br` ou `it-admin@dominio.com.br`), de propriedade da pessoa jurídica, usado exclusivamente para cadastro e recuperação de contas de serviço (SaaS, domínio, hospedagem). Esse e-mail passa a ser o titular técnico das assinaturas, com o(s) sócio(s) atuando como usuários administradores nomeados — não como titulares da conta. Detalhes de governança na seção 5.

## Google Workspace

1. **Domínio**: confirmar domínio próprio da agência já registrado (ex.: `agencia.com.br`) e acesso ao painel DNS (Registro.br, Cloudflare etc.) antes de iniciar — o Workspace exige verificação de propriedade via registro TXT/CNAME.
2. **Criação da conta**: assinar o plano Google Workspace usando o e-mail administrativo institucional (não pessoal) como conta de super administrador inicial.
3. **Verificação de domínio**: adicionar o registro TXT fornecido pelo Google no DNS do domínio.
4. **Registros de e-mail (MX, SPF, DKIM, DMARC)**: configurar MX apontando para o Google, SPF (`v=spf1 include:_spf.google.com ~all`), DKIM (gerado no Admin Console) e DMARC (`v=DMARC1; p=quarantine; rua=mailto:dmarc@dominio.com.br`) para evitar spoofing e melhorar entregabilidade.
5. **Contas de usuário**: criar contas nominais para cada colaborador (`nome.sobrenome@dominio.com.br`); evitar contas genéricas compartilhadas exceto para automações.
6. **Grupos do Google**: criar grupos por função (`financeiro@`, `criacao@`, `comercial@`, `ti@`) para distribuição de e-mail e permissões, em vez de listar pessoas individualmente em cada integração.
7. **Segundo administrador**: nomear ao menos **dois** super administradores distintos (o dono e um responsável técnico/operacional), nunca apenas um — reduz risco de bloqueio por perda de acesso de uma única pessoa.
8. **Segurança do Admin Console**:
   - Ativar **2FA obrigatório** (preferencialmente chave de segurança/FIDO2 ou Google Authenticator) para todos os usuários, com prioridade máxima para administradores.
   - Configurar **chaves de recuperação (backup codes)** dos super admins e guardá-las em cofre de senhas corporativo (seção 6).
   - Ativar **Context-Aware Access** ou ao menos restrição de login por país/IP quando aplicável.
   - Definir política de senha forte (mínimo 12 caracteres, sem reuso).
9. **Licenciamento**: dimensionar plano (Business Starter/Standard/Plus ou Enterprise) conforme volume de usuários e necessidade de armazenamento/Vault/eDiscovery.
10. **Backup**: nativamente o Workspace não garante backup completo com retenção ilimitada — avaliar solução de backup terceirizada (ex.: Spanning, Afi, Backupify) para Drive, Gmail e Contatos, sobretudo se dados de clientes/campanhas trafegam por ali.
11. **Auditoria**: habilitar logs de auditoria (Admin Console → Relatórios) e revisão periódica de dispositivos conectados e apps de terceiros autorizados via OAuth.

## Conta Lovable

1. **Cadastro**: criar a conta com o e-mail administrativo institucional (nunca e-mail pessoal do dono), habilitando login via SSO/Google Workspace quando a plataforma suportar, para herdar a política de 2FA já configurada no Workspace.
2. **Workspace/Organização**: criar um *workspace* (ou equivalente) em nome da agência, e não um projeto solto na conta individual — isso garante que múltiplos membros da equipe possam ser convidados como colaboradores sem depender da conta pessoal de quem criou.
3. **Convite de membros**: adicionar desenvolvedores/gestores técnicos como colaboradores do workspace com papel apropriado (owner vs. editor), mantendo o e-mail administrativo como *owner* primário.
4. **Plano e billing**: assinar o plano adequado ao volume de projetos/mensagens de IA necessário; vincular o **cartão corporativo** (não pessoal) e o e-mail de faturamento (`financeiro@dominio.com.br`) para que a nota fiscal/recibo não caia na caixa pessoal do sócio.
5. **Integração com GitHub/repositório**: conectar a um repositório Git sob a **organização** da empresa no GitHub/GitLab (não em conta pessoal de um desenvolvedor), garantindo que o código-fonte gerado sobreviva à saída de qualquer colaborador.
6. **Deploy/domínio customizado**: ao publicar, apontar domínio próprio (subdomínio do domínio da agência) em vez de depender do domínio padrão da plataforma, e documentar as variáveis de ambiente/segredos usados no deploy.
7. **Backup do projeto**: exportar/versionar o código periodicamente para o repositório Git (não confiar apenas na plataforma como fonte única de verdade).

## Conta Supabase

1. **Cadastro**: criar conta com o e-mail administrativo institucional; usar login via GitHub SSO **vinculado à organização da empresa no GitHub** (não a uma conta pessoal), o que facilita rotação de acesso.
2. **Organização Supabase**: criar uma *Organization* em nome da agência (não usar o namespace pessoal de um dev); convidar membros da equipe com papéis (`Owner`, `Administrator`, `Developer`) — manter o e-mail institucional como Owner.
3. **Projeto(s)**: criar o(s) projeto(s) (banco Postgres gerenciado) dentro dessa organização, nomeando de forma padronizada (`<cliente>-prod`, `<cliente>-staging`).
4. **Billing**: vincular cartão corporativo e e-mail de faturamento institucional; escolher plano (Free/Pro/Team) conforme necessidade de storage, egress e suporte.
5. **Chaves de API e segredos**:
   - `anon` key pode ser pública (embutida no front-end), mas a `service_role` key **nunca** deve ser exposta no cliente — usar apenas em backend/edge functions.
   - Armazenar todas as chaves em cofre de senhas corporativo e em variáveis de ambiente do ambiente de deploy (Lovable/Vercel/etc.), nunca hardcoded no repositório.
   - Rotacionar chaves ao desligar qualquer colaborador com acesso.
6. **Row Level Security (RLS)**: habilitar RLS em todas as tabelas com dados sensíveis desde o início do projeto — é comum (e perigoso) deixar tabelas abertas durante prototipagem e esquecer de travar antes de produção.
7. **Backups**: planos Pro+ incluem backups diários automáticos com retenção; validar a janela de retenção contratada e, para dados críticos, configurar exportação periódica adicional (`pg_dump`) para armazenamento externo (ex.: bucket S3/Storage separado).
8. **Branching/staging**: usar o recurso de *branching* do Supabase (ou um projeto de staging separado) para nunca testar mudanças de schema direto em produção.
9. **Autenticação**: se o projeto usa Supabase Auth, configurar provedores (e-mail/senha, OAuth) com templates de e-mail no domínio institucional e revisar políticas de expiração de sessão/JWT.

## E-mail administrativo de assinaturas

Este é o ponto de governança central do onboarding: um e-mail institucional que **atua como titular técnico** das assinaturas (Google Workspace, Lovable, Supabase, domínio, e futuras ferramentas), desacoplado da pessoa física do dono.

**Padrão recomendado**

| Item | Recomendação |
| --- | --- |
| Endereço | `admin@dominio.com.br` (ou `it@`, `sistemas@`) |
| Titularidade | Conta do Google Workspace da própria empresa, não Gmail pessoal |
| Uso | Exclusivo para cadastro/recuperação de contas de serviço — nunca para correspondência do dia a dia |
| MFA | Obrigatório, com chave de segurança física (ex.: YubiKey) preferencialmente sobre SMS |
| Recuperação | Número de telefone e e-mail de recuperação corporativos (não pessoais), registrados e documentados |
| Acesso | Compartilhado de forma controlada via cofre de senhas (ver abaixo), nunca por WhatsApp/e-mail em texto puro |

**Por que não usar o e-mail pessoal do dono**

- Se o dono sai da empresa, é afastado ou falece, a empresa perde acesso a todas as assinaturas simultaneamente.
- Dificulta auditoria: não há como saber quem, de fato, tem acesso a cada ferramenta.
- Mistura despesas pessoais e empresariais nas faturas, complicando contabilidade e dedução fiscal.
- Impede resposta rápida a incidentes (ex.: revogar acesso de um ex-funcionário) sem depender da disponibilidade de uma única pessoa.

**Governança de acesso**

1. Usar um **gestor de senhas corporativo com cofres compartilhados** (ex.: Bitwarden Teams/Enterprise, 1Password Business) para armazenar credenciais do e-mail administrativo e das assinaturas — nunca em planilhas, notas ou chats.
2. Definir explicitamente quem tem acesso ao cofre "Admin/Assinaturas" (tipicamente: dono + responsável técnico/operacional), com log de acesso.
3. Sempre que possível, **preferir SSO** ("Entrar com Google") usando o e-mail administrativo institucional em vez de senha própria em cada serviço — centraliza a revogação de acesso em um único ponto (desativar a conta Google = perde acesso a tudo que usa SSO).
4. Registrar em uma planilha ou tabela de controle todas as assinaturas ativas: serviço, e-mail titular, responsável pelo pagamento, data de renovação, valor.
5. Processo de **offboarding**: ao desligar alguém com acesso administrativo, revogar imediatamente (Workspace, GitHub, Lovable, Supabase) e rotacionar segredos/chaves de API que essa pessoa possa ter manuseado.

## Ações adicionais recomendadas (padrão de mercado)

1. **Gestor de senhas corporativo**: Bitwarden, 1Password ou similar, com cofres separados por área (TI/Admin, Financeiro, Comercial) e política de compartilhamento sem exposição de senha em texto.
2. **Domínio e DNS**: manter o domínio registrado em nome jurídico da empresa (não pessoa física), com renovação automática e alerta de expiração; usar Cloudflare (ou equivalente) como camada de DNS/proteção (DDoS, WAF básico) à frente do que for exposto publicamente.
3. **Gestão de assinaturas SaaS**: planilha ou ferramenta dedicada (ex.: Vantage, Cledara, ou mesmo uma tabela) listando cada assinatura, custo, ciclo de cobrança, titular do cartão e data de renovação — evita cobranças esquecidas e concentra visão financeira.
4. **Cartão corporativo virtual**: usar cartão virtual (ex.: Conta PJ com cartão virtual, Divibank, Brex-like nacional) dedicado a assinaturas SaaS, com limite controlado, em vez do cartão pessoal do sócio — facilita conciliação contábil e permite bloquear/recriar o número sem afetar outras despesas.
5. **LGPD e proteção de dados**: como a agência tratará dados de campanhas, criadores de conteúdo e possivelmente dados pessoais de terceiros via Supabase, mapear que dados são coletados, base legal de tratamento, e definir política de retenção/exclusão; avaliar nomear encarregado de dados (DPO) mesmo que informalmente em fase inicial.
6. **Contratos e SLA dos fornecedores**: revisar termos de uso do Lovable e Supabase quanto a propriedade do código/dados gerados, política de exportação de dados e o que acontece em caso de cancelamento — garantir que a empresa consegue exportar tudo (código, banco de dados) a qualquer momento.
7. **Ambientes separados (dev/staging/prod)**: desde o início, manter projetos Supabase e deploys Lovable separados por ambiente para evitar que testes afetem dados de produção.
8. **Monitoramento e alertas**: configurar alertas de billing (Google Workspace, Lovable, Supabase) para picos de uso/custo inesperados, e monitoramento básico de uptime do que for publicado (ex.: UptimeRobot, Better Uptime).
9. **Documentação de acessos (runbook)**: manter um runbook vivo com: lista de todas as contas e serviços, quem tem acesso a cada uma, procedimento de recuperação de senha, e contato de suporte de cada fornecedor.
10. **Plano de contingência/sucessão**: definir por escrito quem assume a administração técnica caso o responsável principal fique indisponível — nome do e-mail administrativo, localização do cofre de senhas, e passo a passo mínimo para retomar operação.
11. **Revisão periódica de acessos**: agendar revisão trimestral (ou a cada saída de colaborador) de todos os usuários com acesso administrativo em Google Workspace, GitHub, Lovable e Supabase.

## Checklist consolidado

| Tarefa | Responsável | Prazo |
| --- | --- | --- |
| Criar e-mail administrativo institucional (`admin@dominio.com.br`) | | |
| Configurar 2FA + backup codes no e-mail administrativo | | |
| Assinar Google Workspace com o e-mail administrativo | | |
| Verificar domínio (TXT) e configurar MX/SPF/DKIM/DMARC | | |
| Nomear 2º super administrador no Workspace | | |
| Criar contas nominais e grupos de e-mail | | |
| Criar conta Lovable (workspace da empresa) + vincular billing PJ | | |
| Conectar Lovable a repositório Git da organização | | |
| Criar organização Supabase + projeto(s) prod/staging | | |
| Habilitar RLS em todas as tabelas do Supabase | | |
| Armazenar chaves de API em cofre de senhas | | |
| Configurar gestor de senhas corporativo com cofres compartilhados | | |
| Registrar todas as assinaturas em planilha de controle | | |
| Definir cartão corporativo/virtual para assinaturas SaaS | | |
| Mapear dados pessoais tratados (LGPD) | | |
| Escrever runbook de acessos e plano de sucessão | | |
| Agendar revisão trimestral de acessos | | |

---
Fonte: doc Claude — https://claude.ai/code/artifact/e394ee12-b8c2-450b-9365-3c13152c5d24
