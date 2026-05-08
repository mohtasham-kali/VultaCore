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

// Log file for debugging engine startups
const logFile = path.join(rootDir, 'engine_log.txt');
fs.writeFileSync(logFile, `--- Boot Log ${new Date().toISOString()} ---\n`);

function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
    fs.appendFileSync(logFile, line);
    console.log(line.trim());
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

    child.stdout.on('data', (data) => log(`[${name}] ${data}`));
    child.stderr.on('data', (data) => log(`[${name} ERROR] ${data}`));
    
    child.on('exit', (code) => log(`ℹ️ ${name} exited with code ${code}`));
}

// 1. Start Engines with correct WorkDirs
const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
startApp('Backend', backendEntry, BACK_PORT, path.join(rootDir, 'backend-api'));

setTimeout(() => {
    // Next.js standalone must be run from the standalone folder to find .next/static
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
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end("System is initializing. Please refresh in 5 seconds.\nCheck engine_log.txt for details.");
    });
});

server.listen(masterPort, () => {
    log(`✨ Master Proxy Online at port ${masterPort}`);
});
