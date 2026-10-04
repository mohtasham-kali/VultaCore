#!/usr/bin/env bash
# ============================================================
# Unified Cross-Platform Build Script
# Installs backend deps, builds web-dashboard and syncs to
# Desktop (Tauri) & Mobile (Capacitor)
# ============================================================

set -e
export APPIMAGE_EXTRACT_AND_RUN=1

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       VultaCore Platform — Unified Build          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend-api"
WEB_DIR="$SCRIPT_DIR/web-dashboard"
MOBILE_DIR="$SCRIPT_DIR/mobile-app"
DESKTOP_DIR="$SCRIPT_DIR/desktop-app"

# ── 1. Install backend dependencies ─────────────────────────
echo "▶  [1/4] Installing Backend Dependencies..."
cd "$BACKEND_DIR"
npm install
echo "✓  Backend dependencies installed"
echo ""

# ── 2. Build the Next.js web dashboard (static export) ──────
echo "▶  [2/4] Building Web Dashboard..."
cd "$WEB_DIR"
STATIC_EXPORT=true npm run build
echo "✓  Web Dashboard built → $WEB_DIR/out"
echo ""

# ── 3. Sync Mobile (Capacitor) ──────────────────────────────
echo "▶  [3/4] Syncing Mobile App (Capacitor)..."
cd "$MOBILE_DIR"
npx cap sync
echo "✓  Android & iOS assets synced"
echo ""

# ── 4. Build Desktop (Tauri) ────────────────────────────────
echo "▶  [4/4] Building Desktop App (Tauri)..."
cd "$DESKTOP_DIR"
npm install
npm run tauri build
echo "✓  Desktop App built"
echo ""

echo "╔══════════════════════════════════════════════════╗"
echo "║   All platforms built successfully! 🚀            ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Web:     web-dashboard/out/                     ║"
echo "║  Desktop: desktop-app/src-tauri/target/release/  ║"
echo "║  Android: mobile-app/android/                    ║"
echo "║  iOS:     mobile-app/ios/                        ║"
echo "╚══════════════════════════════════════════════════╝"