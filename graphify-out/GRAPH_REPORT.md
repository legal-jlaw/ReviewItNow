# Graph Report - ReviewItNow  (2026-11-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 133 nodes · 178 edges · 16 communities (8 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.65)
- Token cost: 38,523 input · 71 output

## Graph Freshness
- Built from commit: `2e0d0dcd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Contract Analysis UI
- TypeScript Compiler Config
- NPM Package Scripts
- Linting and Dev Tooling
- Runtime Dependencies and Success Page
- Claude Project Instructions
- Stripe Checkout and Webhooks
- Anthropic API Route
- merge-and-serve.sh
- setup-project.sh
- postcss.config.mjs
- File Icon SVG
- Globe Icon SVG
- Next.js Logo SVG
- Vercel Logo SVG
- Window Icon SVG

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `ReviewItNow()` - 13 edges
3. `next` - 8 edges
4. `Pill()` - 7 edges
5. `FreeResultsPanel()` - 6 edges
6. `applyRedlinesToDocx()` - 5 edges
7. `injectTrackedChange()` - 5 edges
8. `RiskBadge()` - 5 edges
9. `scripts` - 5 edges
10. `AnalysisRenderer()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Claude Project Instructions` --references--> `Graphify Cross-Project README`  [INFERRED]
  CLAUDE.md → graphify/README.md
- `Graphify Claude Code Setup Instructions` --references--> `Claude Project Instructions`  [EXTRACTED]
  graphify/CLAUDE_CODE_INSTRUCTIONS.md → CLAUDE.md
- `Home()` --calls--> `ReviewItNow()`  [EXTRACTED]
  src/app/page.tsx → src/components/ReviewItNow.tsx
- `Next.js Project README` --conceptually_related_to--> `Next.js Agent Rules`  [INFERRED]
  README.md → AGENTS.md
- `Graphify Cross-Project README` --conceptually_related_to--> `Graphify Claude Code Setup Instructions`  [INFERRED]
  graphify/README.md → graphify/CLAUDE_CODE_INSTRUCTIONS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js Public SVG Assets** — public_file, public_globe, public_next, public_vercel, public_window [INFERRED 0.70]
- **Graphify Knowledge Graph Setup Documentation** — claude, graphify_readme, graphify_claude_code_instructions [INFERRED 0.80]

## Communities (16 total, 8 thin omitted)

### Community 0 - "Contract Analysis UI"
Cohesion: 0.12
Nodes (31): Home(), Agent, AgentBadge(), AGENTS, AnalysisRenderer(), applyRedlinesToDocx(), C, ContractViewer() (+23 more)

### Community 1 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 2 - "NPM Package Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 3 - "Linting and Dev Tooling"
Cohesion: 0.12
Nodes (21): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.2.3, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^20.19.39, @types/react@^19 (+13 more)

### Community 4 - "Runtime Dependencies and Success Page"
Cohesion: 0.17
Nodes (12): dependencies, jszip@^3.10.1, next@16.2.3, react@19.2.4, react-dom@19.2.4, @supabase/supabase-js@^2.103.0, jszip, react (+4 more)

### Community 5 - "Claude Project Instructions"
Cohesion: 0.50
Nodes (5): Next.js Agent Rules, Claude Project Instructions, Graphify Claude Code Setup Instructions, Graphify Cross-Project README, Next.js Project README

### Community 7 - "Stripe Checkout and Webhooks"
Cohesion: 0.13
Nodes (11): nextConfig, stripe@^22.0.1, next, stripe, getStripe(), POST(), PRICES, getStripe() (+3 more)

### Community 9 - "Anthropic API Route"
Cohesion: 0.40
Nodes (5): @anthropic-ai/sdk@^0.87.0, @anthropic-ai/sdk, getClient(), maxDuration, POST()

## Knowledge Gaps
- **6 isolated node(s):** `File Icon SVG`, `Globe Icon SVG`, `Next.js Logo SVG`, `Vercel Logo SVG`, `Window Icon SVG` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 57 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Runtime Dependencies and Success Page` to `Contract Analysis UI`, `Linting and Dev Tooling`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **What connects `File Icon SVG`, `Globe Icon SVG`, `Next.js Logo SVG` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contract Analysis UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11931818181818182 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Stripe Checkout and Webhooks` to `Anthropic API Route`, `Linting and Dev Tooling`, `Runtime Dependencies and Success Page`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Linting and Dev Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `Stripe Checkout and Webhooks` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._