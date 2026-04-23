#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  BattleQ Rollup – Railway Deployment Prep Script
# ══════════════════════════════════════════════════════════════
#
# Run this ONCE on your local machine (Linux/WSL) to collect
# the files needed for the Docker build. Then commit and push.
#
# Usage:  bash deploy/rollup/prepare.sh
# ══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${SCRIPT_DIR}/context"

echo "═══ BattleQ Rollup – Preparing Docker context ═══"
echo ""

# ── 1. Locate minitiad binary ────────────────────────────────
MINITIAD_BIN=""
# Check common locations
for candidate in \
  "$HOME/.weave/data/minievm@v1.2.15/minitiad" \
  "$HOME/.weave/data/minievm@v1.2.14/minitiad" \
  "$(which minitiad 2>/dev/null || true)" \
; do
  if [[ -x "$candidate" ]]; then
    MINITIAD_BIN="$candidate"
    break
  fi
done

if [[ -z "$MINITIAD_BIN" ]]; then
  echo "ERROR: Could not find minitiad binary."
  echo "Looked in: ~/.weave/data/minievm@v1.2.*/minitiad"
  echo "Please set MINITIAD_BIN=/path/to/minitiad and re-run."
  exit 1
fi

echo "✓ Found minitiad: $MINITIAD_BIN"

# ── 2. Locate chain config ──────────────────────────────────
MINITIA_HOME="${MINITIA_HOME:-$HOME/.minitia}"
if [[ ! -d "$MINITIA_HOME/config" ]]; then
  echo "ERROR: Chain config not found at $MINITIA_HOME/config"
  echo "Set MINITIA_HOME=/path/to/.minitia and re-run."
  exit 1
fi

echo "✓ Found chain config: $MINITIA_HOME/config/"

# ── 3. Copy files ────────────────────────────────────────────
rm -rf "$DEST"
mkdir -p "$DEST/.minitia"

echo "  Copying minitiad binary..."
cp "$MINITIAD_BIN" "$DEST/minitiad"
chmod +x "$DEST/minitiad"

echo "  Copying chain config (genesis, keys, toml)..."
cp -r "$MINITIA_HOME/config" "$DEST/.minitia/config"

# If data/ exists and is small enough, copy it too (for single-node testnet)
if [[ -d "$MINITIA_HOME/data" ]]; then
  DATA_SIZE_MB=$(du -sm "$MINITIA_HOME/data" 2>/dev/null | cut -f1 || echo 0)
  if [[ "$DATA_SIZE_MB" -lt 500 ]]; then
    echo "  Copying chain data (${DATA_SIZE_MB}MB)..."
    cp -r "$MINITIA_HOME/data" "$DEST/.minitia/data"
  else
    echo "  ⚠ Chain data is ${DATA_SIZE_MB}MB — skipping (too large for Docker image)."
    echo "    Node will start fresh from genesis. Re-fund treasury after deploy."
  fi
fi

echo ""
echo "═══ Done! Files ready in: $DEST ═══"
echo ""
echo "Size: $(du -sh "$DEST" | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. git add deploy/rollup/context/"
echo "  2. git commit -m 'Add rollup deployment files'"
echo "  3. Push to GitHub and connect to Railway"
