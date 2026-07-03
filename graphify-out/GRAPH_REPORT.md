# Graph Report - .  (2026-07-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 116 nodes · 108 edges · 24 communities (10 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `42182c15`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Contract Analysis UI|Contract Analysis UI]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_NPM Package Scripts|NPM Package Scripts]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Claude Project Instructions|Claude Project Instructions]]
- [[_COMMUNITY_injectTrackedChange|injectTrackedChange]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_API Client Route|API Client Route]]
- [[_COMMUNITY_Stripe Checkout Route|Stripe Checkout Route]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_merge-and-serve.sh|merge-and-serve.sh]]
- [[_COMMUNITY_setup-project.sh|setup-project.sh]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_unescXml|unescXml]]
- [[_COMMUNITY_File Icon SVG|File Icon SVG]]
- [[_COMMUNITY_Globe Icon SVG|Globe Icon SVG]]
- [[_COMMUNITY_Next.js Logo SVG|Next.js Logo SVG]]
- [[_COMMUNITY_Vercel Logo SVG|Vercel Logo SVG]]
- [[_COMMUNITY_Window Icon SVG|Window Icon SVG]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 5 edges
3. `injectTrackedChange()` - 5 edges
4. `getParagraphText()` - 4 edges
5. `unescXml()` - 3 edges
6. `applyRedlinesToDocx()` - 3 edges
7. `Claude Project Instructions` - 3 edges
8. `getClient()` - 2 edges
9. `POST()` - 2 edges
10. `getStripe()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Project README` --conceptually_related_to--> `Next.js Agent Rules`  [INFERRED]
  README.md → AGENTS.md
- `Claude Project Instructions` --references--> `Graphify Cross-Project README`  [INFERRED]
  CLAUDE.md → graphify/README.md
- `Claude Project Instructions` --references--> `Next.js Agent Rules`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `Graphify Claude Code Setup Instructions` --references--> `Claude Project Instructions`  [EXTRACTED]
  graphify/CLAUDE_CODE_INSTRUCTIONS.md → CLAUDE.md
- `Graphify Cross-Project README` --conceptually_related_to--> `Graphify Claude Code Setup Instructions`  [INFERRED]
  graphify/README.md → graphify/CLAUDE_CODE_INSTRUCTIONS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Knowledge Graph Setup Documentation** — claude, graphify_readme, graphify_claude_code_instructions [INFERRED 0.80]
- **Next.js Public SVG Assets** — public_file, public_globe, public_next, public_vercel, public_window [INFERRED 0.70]
- **Next.js starter template SVG icon set** — public_file_icon, public_globe_icon, public_next_icon, public_vercel_icon, public_window_icon [INFERRED 0.60]

## Communities (24 total, 14 thin omitted)

### Community 0 - "Contract Analysis UI"
Cohesion: 0.08
Nodes (12): Agent, AGENTS, C, CriticalIssue, CrossoverFlag, FOCUS_AREAS, FreeAnalysisData, JURISDICTIONS (+4 more)

### Community 1 - "TypeScript Compiler Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 2 - "NPM Package Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 3 - "Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.25
Nodes (8): dependencies, @anthropic-ai/sdk, jszip, next, react, react-dom, stripe, @supabase/supabase-js

### Community 5 - "Claude Project Instructions"
Cohesion: 0.50
Nodes (5): Next.js Agent Rules, Claude Project Instructions, Graphify Claude Code Setup Instructions, Graphify Cross-Project README, Next.js Project README

### Community 6 - "injectTrackedChange"
Cohesion: 0.50
Nodes (5): applyRedlinesToDocx(), escXml(), extractRPr(), getParagraphText(), injectTrackedChange()

### Community 7 - "route.ts"
Cohesion: 0.67
Nodes (3): getStripe(), POST(), PRICES

## Knowledge Gaps
- **65 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `NPM Package Scripts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `NPM Package Scripts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contract Analysis UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._