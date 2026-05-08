#!/usr/bin/env node
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

const proxy = httpProxy.createProxyServer({});
const rootDir = __dirname;
const BACKEND_PORT = 3001;
const DASHBOARD_PORT = 3002;

console.log("🚀 VultaCore Master Controller Booting...");

// 1. Start Backend (Isolated Process)
const backendPath = path.join(rootDir, 'backend-api', 'dist', 'main.js');
if (fs.existsSync(backendPath)) {
    console.log("Starting Backend engine...");
    fork(backendPath, [], {
        env: { ...process.env, PORT: BACKEND_PORT }
    });
}

// 2. Start Dashboard (Isolated Process - Delayed to save RAM)
setTimeout(() => {
    const dashboardPath = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    if (fs.existsSync(dashboardPath)) {
        console.log("Starting Dashboard engine...");
        fork(dashboardPath, [], {
            env: { ...process.env, PORT: DASHBOARD_PORT }
        });
    }
}, 5000);

// 3. Master Proxy
const masterPort = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api')) {
        proxy.web(req, res, { target: `http://localhost:${BACKEND_PORT}` }, (e) => {
            res.writeHead(502);
            res.end("Backend is still waking up...");
        });
    } else {
        proxy.web(req, res, { target: `http://localhost:${DASHBOARD_PORT}` }, (e) => {
            res.writeHead(502);
            res.end("Dashboard is still waking up...");
        });
    }
});

server.listen(masterPort, () => {
    console.log(`✨ VultaCore Master Proxy Online at port ${masterPort}`);
});
