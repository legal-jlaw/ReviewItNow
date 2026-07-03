#!/usr/bin/env bash
# Merge per-project graphs into one cross-project graph and serve it over MCP.
#
#   ./merge-and-serve.sh <graph1.json> <graph2.json> [...more]
#
# Env:
#   GRAPHIFY_API_KEY  - require this key on the HTTP transport (recommended)
#   PORT              - HTTP port (default 8080)
set -euo pipefail

OUT="${MERGED_OUT:-$HOME/.graphify/merged-graph.json}"
PORT="${PORT:-8080}"

if [ "$#" -lt 2 ]; then
  echo "usage: $0 <graph1.json> <graph2.json> [...]" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
graphify merge-graphs "$@" --out "$OUT"

echo "[serve] merged graph at $OUT"
echo "[serve] starting MCP server on http://0.0.0.0:$PORT/mcp"
exec graphify-mcp "$OUT" --transport http --host 0.0.0.0 --port "$PORT" \
  ${GRAPHIFY_API_KEY:+--api-key "$GRAPHIFY_API_KEY"}
