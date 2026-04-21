# VaultaCore Tri-Stack Platform

## Architecture
- **Web Dashboard**: Next.js (React) — static export
- **Desktop App**: Tauri v2 — wraps the web dashboard
- **Mobile App**: Capacitor v6 — Android & iOS
- **Backend API**: NestJS
- **AI Services**: Python (FastAPI)
- **Analytics Engine**: Rust

---

## 🖥️ Desktop App (Linux / Windows / macOS)

Built with **Tauri v2** — uses the exact same Next.js UI.

```bash
# First build the web dashboard
cd web-dashboard && npm run build

# Then run/build the desktop app
cd ../desktop-app
npm install
npm run dev       # hot-reload dev mode
npm run build     # production binary → src-tauri/target/release/
```

---

## 📱 Mobile App (Android & iOS)

Built with **Capacitor v6** — same Next.js UI packaged as a native app.

```bash
# After building the web dashboard (web-dashboard/out):
cd mobile-app

npm run sync           # sync all platforms
npm run sync:android   # sync Android only
npm run sync:ios       # sync iOS only
npm run open:android   # open in Android Studio
npm run open:ios       # open in Xcode (macOS only)
```

> **Note**: Android requires Android Studio + Android SDK.
> iOS requires macOS with Xcode and CocoaPods installed.

---

## 🌐 Web Dashboard

```bash
cd web-dashboard
npm run dev      # local dev server → http://localhost:3000
npm run build    # static export → out/
```

---

## 🚀 Unified Build (All Platforms)

```bash
./build-all.sh
```

This will:
1. Build the Next.js dashboard (`out/`)
2. Sync to Android + iOS via Capacitor
3. Compile the Tauri desktop binary

---

## 🔧 Backend Services

### Backend API (NestJS)
```bash
cd backend-api && npm run start:dev
```

### AI Services (FastAPI)
```bash
cd ai-services && pip install -r requirements.txt && uvicorn main:app --reload
```

### Analytics Engine (Rust)
```bash
cd analytics-engine && cargo run
```

### Infrastructure
```bash
docker-compose up -d
```
