#!/usr/bin/env bash
# ============================================================
# VultaCore — Local Build & Deploy Script
# Run this on your PC (not GitHub Actions) to build installers
# and optionally upload them to Hostinger via SCP.
#
# Usage:
#   ./build-and-deploy.sh              # Build only
#   ./build-and-deploy.sh --deploy     # Build + upload to Hostinger
#   ./build-and-deploy.sh --help       # Show help
# ============================================================

set -euo pipefail
export APPIMAGE_EXTRACT_AND_RUN=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web-dashboard"
DESKTOP_DIR="$SCRIPT_DIR/desktop-app"
DIST_DIR="$SCRIPT_DIR/dist-installers"
DEPLOY_FLAG=false

# ── Color helpers ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Help ─────────────────────────────────────────────────────
show_help() {
    cat <<EOF
VultaCore Build & Deploy Script

Usage:
  ./build-and-deploy.sh                Build installers only
  ./build-and-deploy.sh --deploy       Build + upload to Hostinger
  ./build-and-deploy.sh --help         Show this help

Environment variables for deploy:
  HOSTINGER_SSH_HOST     (e.g. 123.456.789.0 or domain)
  HOSTINGER_SSH_PORT     (default: 22)
  HOSTINGER_SSH_USER     (SSH username)
  HOSTINGER_SSH_PASS     (SSH password)

Deploy target (hardcoded):
  ~/domains/vultacore.techprogression.com/nodejs/public/downloads/
EOF
    exit 0
}

# ── Parse args ──────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --deploy) DEPLOY_FLAG=true ;;
        --help)   show_help ;;
        *)        err "Unknown argument: $arg"; show_help ;;
    esac
done

# ═══════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     VultaCore — Local Build & Deploy             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 0. Prerequisites ─────────────────────────────────────
info "Checking prerequisites..."

PREREQ_OK=true

if ! command -v node &>/dev/null; then
    err "Node.js is not installed. Install Node.js 22+ from https://nodejs.org"
    PREREQ_OK=false
else
    NODE_VER=$(node -v)
    info "Node.js: $NODE_VER"
fi

if ! command -v npm &>/dev/null; then
    err "npm is not installed."
    PREREQ_OK=false
else
    info "npm: $(npm -v)"
fi

if ! command -v rustc &>/dev/null; then
    err "Rust is not installed. Install from https://rustup.rs"
    PREREQ_OK=false
else
    info "Rust: $(rustc --version)"
fi

if ! command -v cargo &>/dev/null; then
    err "Cargo is not installed."
    PREREQ_OK=false
else
    info "Cargo: $(cargo --version)"
fi

# Check for Tauri system deps (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    for pkg in libgtk-3-dev libwebkit2gtk-4.1-dev build-essential libssl-dev libayatana-appindicator3-dev librsvg2-dev; do
        if ! dpkg -s "$pkg" &>/dev/null 2>&1; then
            warn "Missing Linux dep: $pkg (will install later)"
        fi
    done
fi

if ! $PREREQ_OK; then
    err "Fix the above issues and re-run."
    exit 1
fi

# ── 1. Install Linux system deps ──────────────────────────
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    info "Installing Linux system dependencies..."
    sudo apt-get update
    sudo apt-get install -y \
        libgtk-3-dev libwebkit2gtk-4.1-dev build-essential \
        curl wget file libxdo-dev libssl-dev \
        libayatana-appindicator3-dev librsvg2-dev patchelf
    ok "System dependencies installed"
fi

# ── 2. Build web-dashboard ───────────────────────────────
echo ""
info "Building web-dashboard (static export for Tauri)..."
cd "$WEB_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

rm -rf .next/ out/
STATIC_EXPORT=true npm run build
ok "Web-dashboard built → $WEB_DIR/out"

# ── 3. Build desktop app ──────────────────────────────────
echo ""
info "Installing desktop-app dependencies..."
cd "$DESKTOP_DIR"
npm install
ok "Desktop-app dependencies installed"

echo ""
info "Building Tauri app (this may take a while)..."
cd "$DESKTOP_DIR"
npx tauri build
ok "Tauri build complete"

# ── 4. Collect installers ─────────────────────────────────
echo ""
info "Collecting built Linux installers..."
mkdir -p "$DIST_DIR"
find "$DESKTOP_DIR/src-tauri/target" -type f \( \
    -name "*.deb" -o -name "*.AppImage" -o -name "*.rpm" \
\) 2>/dev/null | while IFS= read -r file; do
    cp "$file" "$DIST_DIR/"
    ok "Collected: $(basename "$file")"
done

echo ""
INSTALLER_COUNT=$(ls -1 "$DIST_DIR" 2>/dev/null | wc -l)
if [ "$INSTALLER_COUNT" -eq 0 ]; then
    warn "No installer files found. Check the build output."
    ls -lh "$DESKTOP_DIR/src-tauri/target/release/bundle/" 2>/dev/null || true
else
    info "Installers collected in $DIST_DIR:"
    ls -lh "$DIST_DIR"
fi

# ═══════════════════════════════════════════════════════════
# ── 5. (Optional) Deploy to Hostinger ──────────────────────
# ═══════════════════════════════════════════════════════════
if $DEPLOY_FLAG; then
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     Deploying Installers to Hostinger...         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check required env vars
    MISSING_VARS=""
    [ -z "${HOSTINGER_SSH_HOST:-}" ] && MISSING_VARS="$MISSING_VARS HOSTINGER_SSH_HOST"
    [ -z "${HOSTINGER_SSH_USER:-}" ] && MISSING_VARS="$MISSING_VARS HOSTINGER_SSH_USER"
    [ -z "${HOSTINGER_SSH_PASS:-}" ] && MISSING_VARS="$MISSING_VARS HOSTINGER_SSH_PASS"

    if [ -n "$MISSING_VARS" ]; then
        err "Missing required environment variables:$MISSING_VARS"
        err "Set them and re-run with --deploy:"
        err "  export HOSTINGER_SSH_HOST='your-hostinger-ip'"
        err "  export HOSTINGER_SSH_USER='your-username'"
        err "  export HOSTINGER_SSH_PASS='your-password'"
        exit 1
    fi

    PORT="${HOSTINGER_SSH_PORT:-22}"
    TARGET_DIR="~/domains/vultacore.techprogression.com/nodejs/public/downloads/"

    info "Uploading installers to Hostinger via SCP..."
    # Install sshpass if not available
    if ! command -v sshpass &>/dev/null; then
        warn "sshpass not found. Installing..."
        sudo apt-get install -y sshpass
    fi

    sshpass -p "$HOSTINGER_SSH_PASS" scp \
        -o StrictHostKeyChecking=no \
        -P "$PORT" \
        "$DIST_DIR"/* \
        "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}:${TARGET_DIR}"

    ok "Upload complete"

    # Verify
    echo ""
    info "Verifying upload on Hostinger..."
    sshpass -p "$HOSTINGER_SSH_PASS" ssh \
        -o StrictHostKeyChecking=no \
        -p "$PORT" \
        "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}" \
        "echo '=== Installers on Hostinger ==='; ls -lh ${TARGET_DIR} 2>/dev/null || echo 'Directory empty or missing'"

    ok "Deployment to Hostinger completed successfully!"
fi

# ── Done ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Build complete! 🚀                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
info "Installers:     $DIST_DIR"
info "Web dashboard:  $WEB_DIR/out"

if $DEPLOY_FLAG; then
    info "Deployed to:   Hostinger downloads/"
fi

echo ""
echo -e "${YELLOW}To deploy next time, run:${NC}"
echo "  export HOSTINGER_SSH_HOST='your-host'"
echo "  export HOSTINGER_SSH_USER='your-user'"
echo "  export HOSTINGER_SSH_PASS='your-pass'"
echo "  ./build-and-deploy.sh --deploy"
echo ""

