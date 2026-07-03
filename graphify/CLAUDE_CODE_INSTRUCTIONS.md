# Instructions for Claude Code: graphify all projects + shared MCP server

Paste everything below this line into a local Claude Code session started
anywhere on this machine (e.g. `~/Desktop`).

---

Set up graphify (https://github.com/safishamsi/graphify) knowledge graphs
for my projects and a shared cross-project MCP server. Follow these steps
exactly; all of this runs locally with no API keys.

## Context

- The graphs for ReviewItNow were already built in a remote session and
  pushed to the branch `claude/graphify-cross-project-iwvi6h` of
  `legal-jlaw/ReviewItNow` — NOT main. That's why earlier searches found
  no `graphify/` directory.
- My projects live on this machine (adjust paths if needed — note that
  "ReviewItNow 2" contains a space and must be quoted):
  - `~/Desktop/ReviewItNow 2`  (repo: legal-jlaw/ReviewItNow)
  - pineapplesol-website, markitnow, maidbyher-website — find their local
    clones (likely also under `~/Desktop`); clone any that are missing from
    GitHub (`legal-jlaw/<name>`).

## Step 1 — Pull the existing graphify work into ReviewItNow

```bash
cd ~/Desktop/"ReviewItNow 2"
git fetch origin claude/graphify-cross-project-iwvi6h
git merge origin/claude/graphify-cross-project-iwvi6h   # or checkout the branch first to review
```

This brings in `graphify/` (scripts + docs), `graphify-out/` (the finished
ReviewItNow graph: 110 nodes, 22 communities), CLAUDE.md rules, and
`.claude/settings.json` hooks.

## Step 2 — Install graphify

```bash
pip install graphifyy   # PyPI name is graphifyy; the CLI is `graphify`
# macOS "externally managed environment" error? use: pipx install graphifyy
graphify --version      # expect 0.9.x
```

## Step 3 — Extract each of the other three projects

For EACH of pineapplesol-website, markitnow, maidbyher-website, from its
repo root (replace the path):

```bash
cd <repo-root>
graphify extract . --backend claude-cli --max-concurrency 1
graphify cluster-only . --backend claude-cli --max-concurrency 1
graphify global add graphify-out/graph.json --as "$(basename "$PWD")"
graphify claude install    # CLAUDE.md rules + hooks so Claude uses the graph
```

Notes:
- `--backend claude-cli` uses the local `claude` CLI for semantic extraction
  of docs/images — no API key, effectively free.
- If a repo is code-only, extraction needs no LLM at all.
- Register ReviewItNow in the global graph too:
  `cd ~/Desktop/"ReviewItNow 2" && graphify global add graphify-out/graph.json --as ReviewItNow`

## Step 4 — Verify cross-project queries work

```bash
graphify global list   # should show all 4 projects
graphify query "how is payment handled" --graph ~/.graphify/global-graph.json
```

## Step 5 — Shared MCP server

Merge and serve (pick a real secret for the API key):

```bash
graphify merge-graphs \
  ~/Desktop/"ReviewItNow 2"/graphify-out/graph.json \
  <pineapplesol-website>/graphify-out/graph.json \
  <markitnow>/graphify-out/graph.json \
  <maidbyher-website>/graphify-out/graph.json \
  --out ~/.graphify/merged-graph.json

GRAPHIFY_API_KEY=<secret> graphify-mcp ~/.graphify/merged-graph.json \
  --transport http --host 127.0.0.1 --port 8080
```

Register it with Claude Code (user scope so every project gets it):

```bash
claude mcp add --scope user --transport http graphify http://127.0.0.1:8080/mcp \
  --header "Authorization: Bearer <secret>"
```

To keep the server running after the terminal closes, create a LaunchAgent
(macOS) or just re-run the serve command when needed. Alternatively, skip
the HTTP server entirely and use per-project stdio:

```bash
claude mcp add --scope user graphify -- graphify-mcp ~/.graphify/merged-graph.json
```

## Step 6 — Keep graphs fresh

In each repo: `graphify hook install` (post-commit auto-refresh), and after
big changes re-run `graphify update .` then re-run the merge in Step 5.

## Step 7 — Commit

In each of the three newly-graphed repos, commit `graphify-out/` (except
`cache/` and dated backup dirs — gitignore those), `CLAUDE.md`, and
`.claude/settings.json` on a feature branch, and push. Ask me before
merging to main.
