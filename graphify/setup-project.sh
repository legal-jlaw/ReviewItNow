#!/usr/bin/env bash
# Graphify per-project setup — run from any repo root.
#
#   ./setup-project.sh [path-to-repo]
#
# Installs graphify if missing, extracts the repo's knowledge graph,
# and registers it in the global cross-project graph.
set -euo pipefail

REPO="${1:-.}"
REPO="$(cd "$REPO" && pwd)"
TAG="$(basename "$REPO")"

if ! command -v graphify >/dev/null 2>&1; then
  echo "[setup] installing graphifyy..."
  pip install --user graphifyy
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "[setup] extracting $TAG..."
if command -v claude >/dev/null 2>&1; then
  BACKEND="claude-cli"
elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  BACKEND="claude"
elif [ -n "${GEMINI_API_KEY:-}${GOOGLE_API_KEY:-}" ]; then
  BACKEND="gemini"
else
  BACKEND=""
fi

if [ -n "$BACKEND" ]; then
  graphify extract "$REPO" --backend "$BACKEND" --max-concurrency 1 \
    --global --as "$TAG"
else
  # Code-only extraction needs no LLM; docs/images are skipped.
  echo "[setup] no LLM backend available — code-only extraction"
  graphify extract "$REPO" --no-cluster
  graphify cluster-only "$REPO" --no-label \
    --graph "$REPO/graphify-out/graph.json" || true
  graphify global add "$REPO/graphify-out/graph.json" --as "$TAG"
fi

echo "[setup] done. Outputs in $REPO/graphify-out/"
echo "[setup] global graph: $(graphify global path)"
