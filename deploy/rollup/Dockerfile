# ══════════════════════════════════════════════════════════════
#  BattleQ Rollup Node — Docker Image (Railway Deployment)
# ══════════════════════════════════════════════════════════════
#
# This image downloads the minitiad binary at build time from
# the official Initia release, bundles chain config, and uses
# a Caddy reverse proxy so all rollup ports are served through
# a single HTTPS endpoint on Railway.
#
# The minitiad binary is NOT committed to Git — it's fetched
# during Docker build to avoid GitHub's 100MB file size limit.
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
    unzip \
    && rm -rf /var/lib/apt/lists/*

# ── Install Caddy (reverse proxy) ────────────────────────────
ARG CADDY_VERSION=2.8.4
RUN ARCH=$(dpkg --print-architecture) && \
    wget -qO /tmp/caddy.tar.gz \
      "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_${ARCH}.tar.gz" && \
    tar -xzf /tmp/caddy.tar.gz -C /usr/local/bin caddy && \
    rm /tmp/caddy.tar.gz && \
    chmod +x /usr/local/bin/caddy

# ── Download minitiad binary at build time ───────────────────
# This avoids committing the 100MB+ binary to Git.
# The binary is built from: https://github.com/initia-labs/minievm
ARG MINIEVM_VERSION=v1.2.15
RUN ARCH=$(dpkg --print-architecture) && \
    echo "Downloading minitiad ${MINIEVM_VERSION} for ${ARCH}..." && \
    if [ "$ARCH" = "amd64" ]; then \
      wget -qO /usr/local/bin/minitiad \
        "https://github.com/initia-labs/minievm/releases/download/${MINIEVM_VERSION}/minitiad_${MINIEVM_VERSION}_linux_amd64" 2>/dev/null || \
      wget -qO /tmp/minitiad.tar.gz \
        "https://github.com/initia-labs/minievm/releases/download/${MINIEVM_VERSION}/minitiad_${MINIEVM_VERSION}_linux_amd64.tar.gz" 2>/dev/null && \
      tar -xzf /tmp/minitiad.tar.gz -C /usr/local/bin minitiad 2>/dev/null; \
    elif [ "$ARCH" = "arm64" ]; then \
      wget -qO /usr/local/bin/minitiad \
        "https://github.com/initia-labs/minievm/releases/download/${MINIEVM_VERSION}/minitiad_${MINIEVM_VERSION}_linux_arm64" 2>/dev/null || \
      wget -qO /tmp/minitiad.tar.gz \
        "https://github.com/initia-labs/minievm/releases/download/${MINIEVM_VERSION}/minitiad_${MINIEVM_VERSION}_linux_arm64.tar.gz" 2>/dev/null && \
      tar -xzf /tmp/minitiad.tar.gz -C /usr/local/bin minitiad 2>/dev/null; \
    fi && \
    rm -f /tmp/minitiad.tar.gz && \
    # Fallback: if the release download didn't work, use the local copy
    if [ ! -f /usr/local/bin/minitiad ] && [ -f /tmp/context-minitiad ]; then \
      cp /tmp/context-minitiad /usr/local/bin/minitiad; \
    fi && \
    chmod +x /usr/local/bin/minitiad

# ── Fallback: copy local minitiad if provided ────────────────
# If the GitHub release download fails, provide it in context/
COPY context/minitiad* /tmp/fallback-minitiad
RUN if [ ! -x /usr/local/bin/minitiad ] && [ -f /tmp/fallback-minitiad ]; then \
      cp /tmp/fallback-minitiad /usr/local/bin/minitiad && \
      chmod +x /usr/local/bin/minitiad; \
    fi && \
    rm -f /tmp/fallback-minitiad

# ── Copy chain config + data ─────────────────────────────────
COPY context/.minitia /root/.minitia

# ── Copy proxy & startup configs ─────────────────────────────
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /start.sh
RUN chmod +x /start.sh

# ── Railway injects PORT at runtime (typically 8080) ─────────
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
