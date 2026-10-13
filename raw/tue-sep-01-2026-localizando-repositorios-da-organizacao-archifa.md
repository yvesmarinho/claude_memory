---
title: "Localizando repositórios da organização ArchifAI"
metadata: "{\"created\":\"2026-09-01T10:27:04-03:00', \"source\": \"https://github.com/copilot/c/b838fca2-9ae1-43a6-bf14-0fb0038d2cd7/\",\"tags\":\"reclassify\",\"type\":\"reference}"
---
# Copilot Chat Conversation Export: Localizando repositórios da organização ArchiFA

**User:** @yvesmarinho
**Thread URL:** https://github.com/copilot/c/b838fca2-9ae1-43a6-bf14-0fb0038d2cd7

## @yvesmarinho

estou procurando um projeto no github e não encontro. o nome do projeto é archifai. localize o projeto.

## Copilot

Vou procurar o projeto "archifai" no GitHub para você.Excelente! Localizei a organização. Agora vou buscar os repositórios:## Localizando o Projeto ArchiFA

**Descoberta Principal:**

Consegui localizar a organização **archifai** no GitHub:

👤 **URL:** https://github.com/archifai  
**Tipo:** Organização  
**ID:** 172979494  
**Status:** Pública

---

### Situação Atual do Projeto

A organização **archifai** existe no GitHub, porém:

1. **Repositórios Públicos:** A busca não retornou repositórios públicos acessíveis diretamente
2. **Possíveis Motivos:**
   - O projeto pode ser **privado** (visível apenas para membros)
   - Pode estar em fase inicial com repositórios vazios
   - Os repositórios podem estar sob nomes específicos (não necessariamente "archifai")

---

### Próximas Ações Recomendadas

Para localizar o projeto com mais precisão, você poderia:

```bash
# Opção 1: Acessar a organização diretamente
curl https://api.github.com/orgs/archifai

# Opção 2: Listar repositórios com autenticação (se for membro)
curl -H "Authorization: token SEU_TOKEN" https://api.github.com/orgs/archifai/repos

# Opção 3: Buscar com termos adicionais
# Se souber o nome completo do repositório, a linguagem ou outro detalhe
```

---

### Informações Adicionais Encontradas

Encontrei também uma variação: **archifairstudio-ai** (usuário individual), mas parece ser um usuário diferente.

**Tem mais detalhes sobre o projeto que possa ajudar na busca?** Por exemplo:
- Nome completo do repositório?
- Linguagem de programação?
- Descrição/propósito do projeto?
- Nome do criador/mantenedor?

## @yvesmarinho

o repositório é git@github.com:tt-a1i/archify.git.
explique o que esse código faz.

## Copilot

Agora vou explorar a estrutura do código:---

## 📊 EXPLICAÇÃO TÉCNICA DETALHADA: ARCHIFY

**Archify** é um sistema avançado de renderização e validação para geração de diagramas arquiteturais interativos, construído em **Node.js** e utilizado por agentes de IA (Claude Code, Cursor, Codex, OpenCode). O projeto converte descrições textuais em **diagramas verificados e interativos** em formato HTML/SVG.

---

## 🎯 **Funcionalidade Principal**

```
INPUT: Descrição JSON estruturada (IR - Intermediate Representation)
           ↓
VALIDAÇÃO: Schemas JSON e regras de composição
           ↓
RENDERIZAÇÃO: Compilação determinística para HTML/SVG
           ↓
VERIFICAÇÃO: Múltiplas verificações de artefato
           ↓
OUTPUT: Arquivo HTML auto-contido + Exportações (PNG, SVG, WebM)
```

### **5 Tipos de Diagramas Suportados**

| Tipo | Propósito | Elementos Chave |
|------|-----------|-----------------|
| **Architecture** | Componentes, serviços, fronteiras | components, boundaries, connections |
| **Workflow** | CI/CD, aprovações, fluxos | lanes, phases, nodes, edges, mainPath |
| **Sequence** | Chamadas API, cronograma | participants, messages, activations |
| **Data Flow** | Pipeline de dados, linhagem | stages, nodes, flows |
| **Lifecycle** | Estados, retentativas | lanes, states, transitions |

---

## 🔧 **Arquitetura do Código**

### **Entry Point: `archify/bin/archify.mjs`**

Arquivo principal (1991 linhas) que implementa um **CLI poderoso** com os seguintes comandos:

```bash
archify render <type> <input.json> [output.html] [--quality standard|showcase]
archify compare architecture <base.json> <head.json> [output.html]
archify deliver <type> <input.json> [output.html] [--json] [--open]
archify preview <type> <input.json> [output.html]
archify validate <type> <input.json> [--json]
archify migrate workflow <old.json> <new.json> --to-schema 2
archify guide [scenario] [--json]
archify brands [name] [--json]
archify doctor
archify demo [output-directory]
```

---

### **Pipeline de Processamento**

#### **1️⃣ Comando RENDER**

```javascript
// Simples renderização sem validações extras
commandRender(args) {
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  const [type, input, output] = repoArgs.rest;
  
  const result = runNode([rendererPath(type), input, output], {
    env: rendererEnv(qualityArgs.quality, repoArgs.repoRoot),
  });
  
  if (result.status !== 0) exitFrom(result);
}
```

**Fluxo:**
- Extrai parâmetros de qualidade e caminho do repositório
- Executa o renderer específico do tipo como um processo Node.js separado
- Saída direta no arquivo HTML

---

#### **2️⃣ Comando DELIVER (Produção)**

```javascript
// Renderização + validação + commit atômico
async function commandDeliver(args) {
  // 1. Preparação
  const outputPath = resolveOutputPath({ requestedOutput, ... });
  const stagingDirectory = fs.mkdtempSync(...);
  const candidatePath = path.join(stagingDirectory, ...);
  
  // 2. Renderização em área de staging
  const render = runNode([renderer, specificationSnapshotPath, candidatePath], ...);
  if (render.status !== 0) { /* relatar erro */ }
  
  // 3. Verificação de artefato
  const check = runNode([checkScript, candidatePath], ...);
  if (check.status !== 0) { /* preservar output anterior */ }
  
  // 4. Commit atômico (renomear candidato para output)
  fs.renameSync(candidatePath, outputPath);
  
  // 5. (Opcional) Abrir no navegador
  if (open) { openArtifact(outputPath); }
}
```

**Estratégia de Segurança:**
- Renderiza em diretório temporário (`staging`)
- Nunca toca no arquivo de saída até todas as verificações passarem
- Se qualquer verificação falhar, o arquivo anterior se mantém intacto
- Apenas uma operação `fs.renameSync()` é o "commit" final

---

#### **3️⃣ Comando COMPARE (Arquitetura Delta)**

```javascript
// Compara dois diagramas: base vs head (como diffs de PR)
async function commandCompare(args) {
  // 1. Renderizar e validar snapshots
  const baseResult = renderValidatedArchitecture(basePath, ...);
  const headResult = renderValidatedArchitecture(headPath, ...);
  
  // 2. Canonicalizar para ordem determinística
  const base = canonicalArchitecture(baseData);
  const head = canonicalArchitecture(headData);
  
  // 3. Comparar semanticamente
  const compareIr = compareArchitecture(base, head, {
    baseRawSha256: hash(baseBuffer),
    headRawSha256: hash(headBuffer),
    baseSemanticSha256: hash(canonical(base)),
    headSemanticSha256: hash(canonical(head)),
  });
  
  // 4. Gerar SVG com anotações
  const baseSvg = annotateArchitectureSideSvg(baseSourceSvg, compareIr, 'base');
  const headSvg = annotateArchitectureSideSvg(headSourceSvg, compareIr, 'head');
  const deltaSvg = buildDeltaSvg(baseSourceSvg, headSourceSvg, compareIr);
  
  // 5. Renderizar HTML com Before/Delta/After
  const html = renderArchitectureDeltaHtml({
    receipt: artifactIr,
    baseSvg, deltaSvg, headSvg,
  });
}
```

**Saída:**
- `architecture-delta.html` - Visualização interativa comparando 3 visões
- `architecture-delta.receipt.json` - Metadados de verificação

---

#### **4️⃣ Comando VALIDATE**

```javascript
// Testa sem produzir output permanente
function commandValidate(args) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-validate-'));
  const out = path.join(tmp, `${type}.html`);
  
  try {
    // Renderiza para temp
    const render = runNode([renderer, input, out], ...);
    
    // Verifica
    const check = runNode([checkScript, out], ...);
    
    // Relata sucesso sem salvar nada
    console.log(`ok ${type} ${input} (${result.checks.length} checks)`);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
}
```

---

### **2️⃣ Validação com JSON Schemas**

```javascript
// Arquivo: archify/schemas/README.md
// Schemas validam estrutura ANTES da renderização
```

**Arquivos Schema:**
- `architecture.schema.json` - Componentes, fronteiras, conexões
- `workflow.schema.json` - Lanes, fases, nós, bordas
- `sequence.schema.json` - Participantes, mensagens
- `dataflow.schema.json` - Estágios, fluxos
- `lifecycle.schema.json` - Estados, transições
- `common.schema.json` - Definições compartilhadas

**Recursos:**
- Validação com `ajv` (draft 2020-12)
- Modo `strict: true` + `allErrors: true`
- Validators compilados em `generated-validators.mjs`
- Sem dependência de npm em runtime

---

### **3️⃣ Renderers Específicos**

```
archify/renderers/
├── architecture/    render-architecture.mjs
├── workflow/        render-workflow.mjs
├── sequence/        render-sequence.mjs
├── dataflow/        render-dataflow.mjs
├── lifecycle/       render-lifecycle.mjs
└── shared/          (utilidades comuns)
    ├── utils.mjs
    ├── cli.mjs
    ├── legend.mjs
    ├── brand-marks.mjs
    ├── validator.mjs
    └── output-path.mjs
```

---

## 🎨 **Sistema de Marcas (Brand Marks)**

```javascript
// Arquivo: archify/brand-marks/catalog.json
// 107 ícones pré-construídos (AWS, Google Cloud, Kubernetes, etc.)

export function renderBrandMark(node, { x, y, size = 16 } = {}) {
  const mark = brandMarkFor(node);
  if (!mark) return '';
  
  if (mark.kind === 'preset') {
    // Gráficos vetoriais pré-gerados
    content = `<path d="${mark.path}" transform="..." fill="#${mark.hex}"/>`;
  } else if (mark.kind === 'remote') {
    // URLs capturadas com SHA256 pinning
    content = `<image href="${mark.dataUrl}" .../>`;
  }
  
  return `<g data-brand-mark="${mark.id}" ...>${content}</g>`;
}
```

**Segurança:**
- URLs remotas requerem `archify brands capture <url> --json` antes de usar
- Digest SHA256 pinning impede mudanças surpresa
- Nenhum fetch desprotegido em tempo de renderização

---

## 📐 **Controle de Composição**

```javascript
// archify/renderers/shared/legend.mjs
// Verifica se legend/rotas sobrepõem elementos

export function positionLegend({ entries, layout, obstacles, viewBox, ... }) {
  const collision = legendRects.find((legendRect) => 
    obstacles.some((obstacle) => 
      segmentIntersectsRect({ start, end }, legendRect) ||
      rectsOverlap(obstacle, legendRect)
    )
  );
  
  if (collision) {
    throwDiagnosticError(`legend entry overlaps relationship geometry`, [{
      code: 'legend/content-overlap',
      supportedFixes: ['shorten legend, use wider viewBox, move route'],
    }]);
  }
}
```

---

## 🔄 **Tratamento de Erros com Diagnósticos**

```javascript
function diagnostic({ code, message, subject = {}, evidence = {}, supportedFixes = [], severity = 'error' }) {
  return {
    code,           // ex: 'schema/type-mismatch'
    severity,       // 'error' | 'warning'
    message,        // Mensagem legível
    subject,        // { path, id, ... }
    evidence,       // { systemCode, reason, ... }
    supportedFixes, // ["ação 1", "ação 2", ...]
  };
}

// Saída JSON estruturada com --json
{
  "schemaVersion": 1,
  "ok": false,
  "command": "deliver",
  "stage": "render",
  "error": "Input JSON could not be parsed",
  "diagnostics": [{
    "code": "input/json-parse",
    "severity": "error",
    "message": "Input JSON could not be parsed: Unexpected token",
    "subject": { "input": "diagram.json" },
    "evidence": { "reason": "..." },
    "supportedFixes": ["repair JSON syntax and retry"]
  }]
}
```

---

## 🚀 **Recursos Avançados**

### **1️⃣ Preview em Tempo Real**

```bash
archify preview architecture diagram.json output.html
# Abre servidor local na porta 127.0.0.1:RANDOM
# Vigia diagram.json e recarrega após verificação bem-sucedida
# Mantém última versão válida visível em caso de erro
```

### **2️⃣ Visual Check (Screenshots Automatizados)**

```javascript
// archify/bin/visual-check.mjs
// Captura Chrome/Chromium em múltiplas resoluções
export function findChrome({ env, platform }) {
  // Suporta ARCHIFY_CHROME env, caminhos padrão, PATH
}

// Viewports: 1920x1080, 1440x900, 768x1024, 375x667
// Temas: dark, light
// Saída: screenshots + contact sheet HTML
```

### **3️⃣ Migração de Workflow V1 → V2**

```bash
archify migrate workflow old.json new.json --to-schema 2 [--json]
# Schema v1: layout manual fixo
# Schema v2: compiler automático + views guiadas
# Mantém compatibilidade regressiva ao renderizar v1
```

### **4️⃣ Guided Stories**

```json
{
  "meta": {
    "views": [
      {
        "id": "flow-auth",
        "label": "Fluxo de Autenticação",
        "focus": ["login", "oauth", "token-store"],
        "note": "Clique em cada nó para prosseguir"
      }
    ]
  }
}
```

---

## 📊 **Checklist de Verificações Finais**

```javascript
// archify/scripts/check-render-output.mjs
const checks = [
  { name: 'single_svg', ... },        // Exatamente 1 SVG root
  { name: 'finite_svg', ... },        // Sem NaN/Infinity em coords
  { name: 'orthogonal_arrows', ... }, // Rotas ortogonais válidas
  { name: 'legend_clearance', ... },  // Legend não invade rutas
  { name: 'label_route_clearance', },
  { name: 'relationship_crossings', },
  { name: 'relationship_corridors', },
  { name: 'container_border_runs', },
  { name: 'route_rhythm', },
];
```

---

## 🛡️ **Segurança em Leitura de Arquivos**

```javascript
// archify/scripts/check-update.mjs
async function guardedCacheRead(token, read) {
  await verifyCacheToken(token);     // Verifica antes
  let result;
  try {
    result = await read();
  } catch (error) {
    await verifyCacheToken(token);   // Verifica após erro
    throw error;
  }
  await verifyCacheToken(token);     // Verifica após sucesso
  return result;
}
// Detecta TOCTOU (Time-of-Check-Time-of-Use) races
```

---

## 📈 **Estatísticas do Projeto**

| Métrica | Valor |
|---------|-------|
| **Linguagem** | JavaScript (Node.js) |
| **Versão Estável** | v2.16.0 |
| **Licença** | MIT |
| **Stars** | 41.004+ ⭐ |
| **Forks** | 2.602+ 🍴 |
| **Issues Abertos** | 89 |
| **Tamanho** | ~109 MB |
| **Criado** | 15 de abril de 2026 |
| **Atualizado** | 1º de setembro de 2026 |

---

## 🎓 **Exemplo Completo: Workflow de Entrega**

```bash
# 1. Descrever sistema em JSON (ou agent gera para você)
cat > api-architecture.json << 'EOF'
{
  "schema_version": 1,
  "diagram_type": "architecture",
  "meta": {
    "title": "API Gateway",
    "locale": "en",
    "animation": "trace",
    "visual_preset": "signal-flow"
  },
  "components": [
    {"id": "client", "type": "frontend", "label": "Web Browser"},
    {"id": "gateway", "type": "backend", "label": "API Gateway"},
    {"id": "cache", "type": "database", "label": "Redis Cache"},
    {"id": "db", "type": "database", "label": "PostgreSQL"}
  ],
  "connections": [
    {"from": "client", "to": "gateway"},
    {"from": "gateway", "to": "cache"},
    {"from": "gateway", "to": "db", "label": "fallback"}
  ]
}
EOF

# 2. Validar
archify validate architecture api-architecture.json --json

# 3. Gerar preview em tempo real
archify preview architecture api-architecture.json output.html

# 4. Deliver para produção
archify deliver architecture api-architecture.json output.html --open --quality showcase

# 5. Comparar mudanças
archify compare architecture base.json head.json delta.html --json
```

---

## 🔮 **Opinião Técnica (ChatGPT)**

**Archify é uma arquitetura muito bem pensada** por vários motivos:

1. **Determinismo:** Canonicalização de entrada + salt SHA256 = renderização byte-for-byte idêntica
2. **Segurança:** Staging atomicamente separado do destino; validação em múltiplas camadas
3. **Usabilidade:** Diagnósticos estruturados com "supported fixes" guiam correções
4. **Extensibilidade:** 5 renderers independentes compartilham schema + validator comuns
5. **Confiabilidade:** Zero-dependency validators em runtime; schemas fixos ao deploy

**Desvantagem potencial:** Não há auto-layout geral (como Mermaid faria). Archify força decisões de layout ao agente, o que é intencional — prioriza "authored judgment over automatic magic".

---

Quer explorar um subsistema específico? Por exemplo:
- 🎨 Como o renderer de Workflow compila lanes?
- 📦 Contrato de source evidence (Git-pinned code references)?
- 🔐 Validação de repository links com commit SHA?
