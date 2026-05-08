#!/usr/bin/env node
const http = require('http');
const httpProxy = require('http-proxy');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const proxy = httpProxy.createProxyServer({});
const rootDir = __dirname;
const BACK_PORT = 49152;
const DASH_PORT = 49153;

let bootLogs = [`[${new Date().toLocaleTimeString()}] Master Proxy Booting...` || ""];

function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    bootLogs.push(line);
    if (bootLogs.length > 50) bootLogs.shift();
    console.log(line);
}

function startApp(name, filePath, port, cwd) {
    if (!fs.existsSync(filePath)) {
        log(`❌ ${name} file not found at ${filePath}`);
        return;
    }
    
    log(`📡 Spawning ${name} engine on port ${port}...`);
    const child = spawn('node', [filePath], {
        env: { ...process.env, PORT: port },
        cwd: cwd || rootDir,
        shell: true
    });

    child.stdout.on('data', (data) => log(`[${name}] ${data.toString().trim()}`));
    child.stderr.on('data', (data) => log(`[${name} ERROR] ${data.toString().trim()}`));
    child.on('exit', (code) => log(`ℹ️ ${name} exited with code ${code}`));
}

// 1. Start Engines
const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
startApp('Backend', backendEntry, BACK_PORT, path.join(rootDir, 'backend-api'));

setTimeout(() => {
    const dashboardEntry = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    const dashboardCwd = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard');
    startApp('Dashboard', dashboardEntry, DASH_PORT, dashboardCwd);
}, 5000);

// 2. Proxy Server
const masterPort = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    const target = req.url.startsWith('/api') ? BACK_PORT : DASH_PORT;
    
    proxy.web(req, res, { 
        target: `http://localhost:${target}`,
        changeOrigin: true,
        xfwd: true
    }, (e) => {
        res.writeHead(502, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <body style="background:#0f172a; color:#cbd5e1; font-family:monospace; padding:40px;">
                    <h1 style="color:#ef4444">System Initializing</h1>
                    <p>The engines are still warming up. Please refresh in 5 seconds.</p>
                    <div style="background:#000; padding:20px; border-radius:8px; border:1px solid #1e293b">
                        <h3 style="color:#3b82f6">Live Boot Logs:</h3>
                        <pre>${bootLogs.join('\n')}</pre>
                    </div>
                    <script>setTimeout(() => location.reload(), 5000)</script>
                </body>
            </html>
        `);
    });
});

server.listen(masterPort, () => {
    log(`✨ Master Proxy Online at port ${masterPort}`);
});
