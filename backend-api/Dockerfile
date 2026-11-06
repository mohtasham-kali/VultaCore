# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Native build tools needed for native node modules (e.g. sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install runtime sqlite3 library
RUN apk add --no-cache sqlite wget

# Security: Create non-root dedicated service user & group
RUN addgroup -S appgroup -g 10001 && \
    adduser -S -u 10001 -G appgroup -s /sbin/nologin appuser

# Prepare persistent data directory for SQLite if running in container
RUN mkdir -p /data && chown -R appuser:appgroup /data

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure app ownership
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api || exit 1

CMD ["node", "dist/main"]
