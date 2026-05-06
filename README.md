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

### 3. Unified Build
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