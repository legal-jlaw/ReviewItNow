# Instructions for Claude Code: graphify all projects + shared MCP server

Paste everything below this line into a local Claude Code session started
anywhere on this machine (e.g. `~/Desktop`).

---

Set up graphify (https://github.com/safishamsi/graphify) knowledge graphs
for my projects and a shared cross-project MCP server. Follow these steps
exactly; all of this runs locally with no API keys.

## Context

- ReviewItNow is already done. Its graphify setup (`graphify/`,
  `graphify-out/`, the CLAUDE.md rules and the `.claude/settings.json`
  hooks) is merged into `main` of `legal-jlaw/ReviewItNow`. A local clone
  that has not pulled `main` since will not have these files.
- A newer rebuild of the ReviewItNow graph (133 nodes, 178 edges, 16
  communities, graphify 0.9.106) sits on the branch
  `claude/graphify-cross-project-iwvi6h`, one commit ahead of `main` and
  not merged yet.
- "Merge" means two different things in this document:
  - a git merge (Step 1) only brings the finished graphify files onto this
    machine. It adds tooling files and changes no app code.
  - a graph merge (Step 5, `graphify merge-graphs`) combines the four
    projects' `graph.json` files into one cross-project graph.
- The end result: every project has its own graph that Claude consults
  before reading source, and one merged graph is served over MCP so any
  Claude Code session on this machine can answer questions that span all
  four projects.
- My projects live on this machine (adjust paths if needed — note that
  "ReviewItNow 2" contains a space and must be quoted):
  - `~/Desktop/ReviewItNow 2`  (repo: legal-jlaw/ReviewItNow)
  - pineapplesol-website, markitnow, maidbyher-website — find their local
    clones (likely also under `~/Desktop`); clone any that are missing from
    GitHub (`legal-jlaw/<name>`).

## Step 1 — Pull the existing graphify work into ReviewItNow

```bash
cd ~/Desktop/"ReviewItNow 2"
git checkout main && git pull origin main
# optional: also take the newer graph rebuild that is not on main yet
git fetch origin claude/graphify-cross-project-iwvi6h
git merge origin/claude/graphify-cross-project-iwvi6h
```

This brings in `graphify/` (scripts + docs), `graphify-out/` (the finished
ReviewItNow graph), CLAUDE.md rules, and `.claude/settings.json` hooks.
Nothing needs to be built for ReviewItNow.

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

`graphify update .` rebuilds the code graph with no LLM. If it reports that
the community set changed, name the new communities with:

```bash
graphify label . --missing-only --backend claude-cli --max-concurrency 1
```

Docs and images are not re-read by `update`; re-run the `extract` command
from Step 3 when those change.

## Step 7 — Commit

In each of the three newly-graphed repos, commit `graphify-out/` (except
`cache/`, dated backup dirs, `.graphify_build_state.json` and
`.graphify_labels.pending.json` — gitignore those), `CLAUDE.md`, and
`.claude/settings.json` on a feature branch, and push. Ask me before
merging to main.
