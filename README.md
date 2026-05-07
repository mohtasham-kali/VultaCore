# VultaCore Tri-Stack Platform 🚀

Advanced Developer & Cybersecurity Dashboard with AI-powered assistance.

## 🏗️ Architecture
- **Web Dashboard**: Next.js 16 (React 19) — High-performance static export.
- **Desktop App**: Tauri v2 — Native performance with a web soul.
- **Mobile App**: Capacitor v6 — Cross-platform Android & iOS.
- **Backend API**: NestJS (Unified PostgreSQL/SQLite support).
- **AI Services**: Python (FastAPI) — Specialized LLM agents.
- **Analytics Engine**: Rust — Real-time high-speed data processing.

---

## ⚡ Performance Features
- **Smooth Animations**: Powered by `framer-motion` for 60fps UI transitions.
- **Instant Feedback**: integrated `nprogress` for route change indicators.
- **Optimized Data**: Automated payload compression and aggressive caching.
- **Database Fallback**: Automatic failover from PostgreSQL (Production) to SQLite (Local Development).

---

## 🛠️ Local Development

### 1. Web Dashboard
```bash
cd web-dashboard
npm install
npm run dev      # http://localhost:3000
```

### 2. Backend API
```bash
cd backend-api
npm install
npm run start:dev
# Automatically uses local saas.sqlite if DATABASE_URL is not set.
```

### 3. Desktop App (Tauri)
```bash
# First build the web dashboard
cd web-dashboard && npm run build

# Then run/build the desktop app
cd ../desktop-app
npm install
npm run dev       # hot-reload dev mode
npm run build     # production binary → src-tauri/target/release/
```

### 4. Mobile App (Capacitor)
```bash
# After building the web dashboard (web-dashboard/out):
cd mobile-app

npm run sync           # sync all platforms
npm run sync:android   # sync Android only
npm run sync:ios       # sync iOS only
npm run open:android   # open in Android Studio
npm run open:ios       # open in Xcode (macOS only)
```
> **Note**: Android requires Android Studio + Android SDK. On this system, Android Studio is located at `/home/hacker/android-studio/bin/studio.sh`. iOS requires macOS with Xcode and CocoaPods installed.

### 5. AI Services (FastAPI)
```bash
cd ai-services
pip install -r requirements.txt
source venv/bin/activate
uvicorn main:app --reload
```

### 6. Analytics Engine (Rust)
```bash
cd analytics-engine
cargo run
```

### 7. Core Infrastructure (Docker)
```bash
docker-compose up -d
```

### 8. Unified Build (All Platforms)
```bash
./build-all.sh   # Builds Web, Desktop, and Mobile in one go.
```

---

## 🌐 Deployment
This platform is designed for high-availability deployment on **Hostinger** or **Vercel/Render**.
- **Database**: Use Supabase or Hostinger PostgreSQL.
- **Environment**: Ensure `DATABASE_URL` is set in production to enable PostgreSQL.

---

## 🧹 Maintenance
Remove cache and temporary files:
```bash
rm -rf web-dashboard/.next
rm -rf **/node_modules/.cache
```

---

*Built with ❤️ for the Cybersecurity and Dev Community.*