#!/usr/bin/env bash
# ============================================================
# Unified Cross-Platform Build Script
# Builds web-dashboard and syncs to Desktop (Tauri) & Mobile (Capacitor)
# ============================================================

set -e
export APPIMAGE_EXTRACT_AND_RUN=1

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       VultaCore Platform — Unified Build          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/web-dashboard"
MOBILE_DIR="$SCRIPT_DIR/mobile-app"
DESKTOP_DIR="$SCRIPT_DIR/desktop-app"

# ── 1. Build the Next.js web dashboard (static export) ──────
echo "▶  [1/3] Building Web Dashboard..."
cd "$WEB_DIR"
STATIC_EXPORT=true npm run build
echo "✓  Web Dashboard built → $WEB_DIR/out"
echo ""

# ── 2. Sync Mobile (Capacitor) ──────────────────────────────
echo "▶  [2/3] Syncing Mobile App (Capacitor)..."
cd "$MOBILE_DIR"
npx cap sync
echo "✓  Android & iOS assets synced"
echo ""

# ── 3. Build Desktop (Tauri) ────────────────────────────────
echo "▶  [3/3] Building Desktop App (Tauri)..."
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
