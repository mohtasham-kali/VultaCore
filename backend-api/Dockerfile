FROM node:20-alpine AS builder
WORKDIR /app

# Install native build tools needed for sqlite3 and node-gyp
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install runtime libs needed by sqlite3
RUN apk add --no-cache sqlite

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001
CMD ["node", "dist/main"]
