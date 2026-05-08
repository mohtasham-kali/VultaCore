#!/usr/bin/env node
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const fs = require('fs');

const proxy = httpProxy.createProxyServer({});
const rootDir = __dirname;

// Ports for internal apps
const BACKEND_PORT = 3001;
const DASHBOARD_PORT = 3002;

console.log("🚀 VultaCore Master Controller Booting...");

// 1. Start Backend (NestJS)
const backendPath = path.join(rootDir, 'backend-api', 'dist', 'main.js');
if (fs.existsSync(backendPath)) {
    process.env.PORT = BACKEND_PORT;
    require(backendPath);
    console.log(`✅ Backend engine started on port ${BACKEND_PORT}`);
}

// 2. Start Dashboard (Next.js Standalone)
const dashboardPath = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
if (fs.existsSync(dashboardPath)) {
    // We need to run this in a way that it doesn't conflict with the root env
    // Next.js standalone usually reads from its own environment
    process.env.PORT = DASHBOARD_PORT;
    require(dashboardPath);
    console.log(`✅ Dashboard engine started on port ${DASHBOARD_PORT}`);
}

// 3. Master Proxy Server
const masterPort = process.env.REAL_PORT || process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api')) {
        // Route to Backend
        proxy.web(req, res, { target: `http://localhost:${BACKEND_PORT}` });
    } else {
        // Route to Dashboard
        proxy.web(req, res, { target: `http://localhost:${DASHBOARD_PORT}` });
    }
});

server.on('error', (err) => {
    console.error("Master Proxy Error:", err);
});

server.listen(masterPort, () => {
    console.log(`✨ VultaCore Online at port ${masterPort}`);
});
