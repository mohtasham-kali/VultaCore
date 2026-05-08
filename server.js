#!/usr/bin/env node
const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const proxy = httpProxy.createProxyServer({});
const rootDir = __dirname;

// Use high ports to avoid common conflicts on shared hosting
const BACK_PORT = 49152;
const DASH_PORT = 49153;

console.log("🚀 VultaCore Master Proxy Booting...");

function startApp(name, filePath, port) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ${name} file not found at ${filePath}`);
        return;
    }
    console.log(`📡 Spawning ${name} engine on port ${port}...`);
    const child = spawn('node', [filePath], {
        env: { ...process.env, PORT: port },
        stdio: 'inherit',
        shell: true
    });
    child.on('error', (err) => console.error(`❌ ${name} process error:`, err));
    child.on('exit', (code) => console.log(`ℹ️ ${name} exited with code ${code}`));
}

// 1. Start Engines
startApp('Backend', path.join(rootDir, 'backend-api', 'dist', 'main.js'), BACK_PORT);

setTimeout(() => {
    startApp('Dashboard', path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js'), DASH_PORT);
}, 4000);

// 2. Proxy Server
const masterPort = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    // Route /api to Backend, everything else to Dashboard
    const isApi = req.url.startsWith('/api');
    const targetPort = isApi ? BACK_PORT : DASH_PORT;
    
    proxy.web(req, res, { 
        target: `http://localhost:${targetPort}`,
        changeOrigin: true,
        xfwd: true 
    }, (e) => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end("System is initializing. Please refresh in 5 seconds.");
    });
});

server.listen(masterPort, () => {
    console.log(`✨ VultaCore Master Proxy Online at port ${masterPort}`);
});
