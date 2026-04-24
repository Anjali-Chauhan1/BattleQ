#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  BattleQ Rollup – Startup Script
#  Runs inside the Docker container on Railway.
# ══════════════════════════════════════════════════════════════

set -euo pipefail

MINITIA_HOME="${MINITIA_HOME:-/root/.minitia}"
LOG_DIR="/var/log/battleq"
mkdir -p "$LOG_DIR"

echo "═══════════════════════════════════════════════════════"
echo "  BattleQ Rollup Node — Starting (Railway)"
echo "═══════════════════════════════════════════════════════"
echo "  Home:   $MINITIA_HOME"
echo "  Port:   ${PORT:-8080}"
echo "  Time:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════════"

# ── Verify config exists ─────────────────────────────────────
if [[ ! -f "$MINITIA_HOME/config/genesis.json" ]]; then
  echo "ERROR: No genesis.json found at $MINITIA_HOME/config/"
  echo "Did you run prepare.sh and copy your chain data?"
  exit 1
fi

echo "✓ Genesis found: $(jq -r '.chain_id' "$MINITIA_HOME/config/genesis.json")"

# ── Ensure data directory exists ─────────────────────────────
if [[ ! -d "$MINITIA_HOME/data" ]]; then
  echo "  Initializing data directory (fresh from genesis)..."
  mkdir -p "$MINITIA_HOME/data"
fi

# ── Patch config for production ──────────────────────────────
# Enable all RPC/API endpoints to bind to 0.0.0.0 (needed for
# Caddy reverse proxy within the same container).

CONFIG_TOML="$MINITIA_HOME/config/config.toml"
APP_TOML="$MINITIA_HOME/config/app.toml"

if [[ -f "$CONFIG_TOML" ]]; then
  echo "  Patching config.toml for container networking..."
  # Tendermint RPC: listen on all interfaces
  sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|g' "$CONFIG_TOML"
  sed -i 's|laddr = "tcp://localhost:26657"|laddr = "tcp://0.0.0.0:26657"|g' "$CONFIG_TOML"
  # P2P: listen on all interfaces
  sed -i 's|laddr = "tcp://127.0.0.1:26656"|laddr = "tcp://0.0.0.0:26656"|g' "$CONFIG_TOML"
  sed -i 's|laddr = "tcp://localhost:26656"|laddr = "tcp://0.0.0.0:26656"|g' "$CONFIG_TOML"
  # Enable CORS for RPC
  sed -i 's|cors_allowed_origins = \[\]|cors_allowed_origins = ["*"]|g' "$CONFIG_TOML"
fi

if [[ -f "$APP_TOML" ]]; then
  echo "  Patching app.toml for container networking..."
  # REST API: enable and bind to all interfaces
  sed -i 's|enable = false|enable = true|g' "$APP_TOML"
  sed -i 's|address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|g' "$APP_TOML"
  sed -i 's|address = "tcp://127.0.0.1:1317"|address = "tcp://0.0.0.0:1317"|g' "$APP_TOML"
  # gRPC: bind to all interfaces
  sed -i 's|address = "localhost:9090"|address = "0.0.0.0:9090"|g' "$APP_TOML"
  sed -i 's|address = "127.0.0.1:9090"|address = "0.0.0.0:9090"|g' "$APP_TOML"
  # JSON-RPC: bind to all interfaces
  sed -i 's|address = "127.0.0.1:8545"|address = "0.0.0.0:8545"|g' "$APP_TOML"
  sed -i 's|address = "localhost:8545"|address = "0.0.0.0:8545"|g' "$APP_TOML"
  # WS: bind to all interfaces
  sed -i 's|ws-address = "127.0.0.1:8546"|ws-address = "0.0.0.0:8546"|g' "$APP_TOML"
  sed -i 's|ws-address = "localhost:8546"|ws-address = "0.0.0.0:8546"|g' "$APP_TOML"
  # Enable JSON-RPC and WS
  sed -i '/\[json-rpc\]/,/^\[/ s|enable = false|enable = true|' "$APP_TOML"
fi

echo "✓ Config patched"

# ── Start Caddy (reverse proxy) in background ───────────────
echo "  Starting Caddy reverse proxy on port ${PORT:-8080}..."
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile \
  > "$LOG_DIR/caddy.log" 2>&1 &
CADDY_PID=$!
echo "  Caddy PID: $CADDY_PID"

# ── Start minitiad ───────────────────────────────────────────
echo "  Starting minitiad..."
echo "═══════════════════════════════════════════════════════"

# Run minitiad in the foreground so Docker/Railway can monitor it.
# If minitiad crashes, the container exits and Railway restarts it.
exec minitiad start \
  --home "$MINITIA_HOME" \
  --json-rpc.enable \
  --json-rpc.address "0.0.0.0:8545" \
  --json-rpc.ws-address "0.0.0.0:8546" \
  --json-rpc.api "eth,net,web3,txpool" \
  2>&1 | tee "$LOG_DIR/minitiad.log"
