# Graphify — cross-project knowledge graphs

[Graphify](https://github.com/safishamsi/graphify) turns each codebase into a
queryable knowledge graph, then merges them so one MCP server can answer
questions across every project.

Projects covered:

- `legal-jlaw/ReviewItNow` (this repo)
- `legal-jlaw/pineapplesol-website`
- `legal-jlaw/markitnow`
- `legal-jlaw/maidbyher-website`

## 1. Per-project setup

From each repo root:

```bash
./graphify/setup-project.sh
```

This installs graphify (PyPI package `graphifyy`), extracts the repo into
`graphify-out/` (graph.json + interactive graph.html + GRAPH_REPORT.md), and
registers it in the global cross-project graph at
`~/.graphify/global-graph.json`.

Commit `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` so
teammates and CI get the graph without re-extracting.

## 2. Keep graphs fresh

```bash
graphify hook install     # post-commit auto-refresh (per repo)
# or on demand:
graphify update .
```

## 3. Cross-project queries (no server needed)

```bash
graphify global list                       # repos in the global graph
graphify query "how does auth work" --graph ~/.graphify/global-graph.json
graphify path "ReviewForm" "supabase client" --graph ~/.graphify/global-graph.json
```

## 4. Shared MCP server

Serve one merged graph to every assistant (Claude Code, Cursor, etc.):

```bash
GRAPHIFY_API_KEY=<pick-a-secret> ./graphify/merge-and-serve.sh \
  ~/code/ReviewItNow/graphify-out/graph.json \
  ~/code/pineapplesol-website/graphify-out/graph.json \
  ~/code/markitnow/graphify-out/graph.json \
  ~/code/maidbyher-website/graphify-out/graph.json
```

Then register it with Claude Code:

```bash
claude mcp add --transport http graphify http://localhost:8080/mcp \
  --header "Authorization: Bearer <pick-a-secret>"
```

Or per-project stdio (no server process to babysit):

```bash
claude mcp add graphify -- graphify-mcp ./graphify-out/graph.json
```

## 5. Claude Code skill integration

`graphify claude install` (run in each repo) adds a CLAUDE.md section and a
PreToolUse hook that steers Claude toward graph queries instead of re-reading
the whole codebase.
