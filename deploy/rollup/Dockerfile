# ══════════════════════════════════════════════════════════════
#  BattleQ Rollup Node — Docker Image (Railway Deployment)
# ══════════════════════════════════════════════════════════════
#
# This image packages your local minitiad binary + chain config
# with a Caddy reverse proxy so all rollup ports are served
# through a single HTTPS endpoint on Railway.
#
# Build:  docker build -t battleq-rollup -f deploy/rollup/Dockerfile deploy/rollup/
# Run:    docker run -e PORT=8080 battleq-rollup
# ══════════════════════════════════════════════════════════════

FROM ubuntu:22.04

LABEL maintainer="BattleQ"
LABEL description="Initia MiniEVM Rollup Node for BattleQ (Railway)"

# ── System dependencies ──────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    jq \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# ── Install Caddy (reverse proxy) ────────────────────────────
ARG CADDY_VERSION=2.8.4
RUN ARCH=$(dpkg --print-architecture) && \
    wget -qO /tmp/caddy.tar.gz \
      "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_${ARCH}.tar.gz" && \
    tar -xzf /tmp/caddy.tar.gz -C /usr/local/bin caddy && \
    rm /tmp/caddy.tar.gz && \
    chmod +x /usr/local/bin/caddy

# ── Copy minitiad binary ─────────────────────────────────────
COPY context/minitiad /usr/local/bin/minitiad
RUN chmod +x /usr/local/bin/minitiad

# ── Copy chain config + data ─────────────────────────────────
COPY context/.minitia /root/.minitia

# ── Copy proxy & startup configs ─────────────────────────────
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /start.sh
RUN chmod +x /start.sh

# ── Railway injects PORT at runtime (typically 8080) ─────────
# We set a default fallback; Railway will override at runtime.
ENV PORT=8080
ENV MINITIA_HOME=/root/.minitia

# ── Health check ─────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:8545 -X POST \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        || exit 1

# ── Run ──────────────────────────────────────────────────────
CMD ["/start.sh"]
