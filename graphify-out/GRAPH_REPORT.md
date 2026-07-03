# Graph Report - /home/user/ReviewItNow  (2026-07-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 110 nodes · 103 edges · 22 communities (10 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.4)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4f30cc8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Contract Analysis UI|Contract Analysis UI]]
- [[_COMMUNITY_TypeScript Compiler Config|TypeScript Compiler Config]]
- [[_COMMUNITY_NPM Package Scripts|NPM Package Scripts]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_DOCX Redline Injection|DOCX Redline Injection]]
- [[_COMMUNITY_Stripe Checkout Route|Stripe Checkout Route]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_API Client Route|API Client Route]]
- [[_COMMUNITY_Stripe Checkout Route|Stripe Checkout Route]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_DOCX XML Parsing|DOCX XML Parsing]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Globe Icon Asset|Globe Icon Asset]]
- [[_COMMUNITY_Next.js Logo Asset|Next.js Logo Asset]]
- [[_COMMUNITY_Vercel Logo Asset|Vercel Logo Asset]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 5 edges
3. `injectTrackedChange()` - 5 edges
4. `getParagraphText()` - 4 edges
5. `unescXml()` - 3 edges
6. `applyRedlinesToDocx()` - 3 edges
7. `getClient()` - 2 edges
8. `POST()` - 2 edges
9. `getStripe()` - 2 edges
10. `POST()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `getParagraphText()` --calls--> `unescXml()`  [EXTRACTED]
  src/components/ReviewItNow.tsx → src/components/ReviewItNow.tsx  _Bridges community 16 → community 5_

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Next.js starter template SVG icon set** — public_file_icon, public_globe_icon, public_next_icon, public_vercel_icon, public_window_icon [INFERRED 0.60]

## Communities (22 total, 12 thin omitted)

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

### Community 5 - "DOCX Redline Injection"
Cohesion: 0.50
Nodes (5): applyRedlinesToDocx(), escXml(), extractRPr(), getParagraphText(), injectTrackedChange()

### Community 6 - "Stripe Checkout Route"
Cohesion: 0.67
Nodes (3): getStripe(), POST(), PRICES

## Knowledge Gaps
- **62 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `NPM Package Scripts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `NPM Package Scripts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _62 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contract Analysis UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `TypeScript Compiler Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._