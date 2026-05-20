#!/usr/bin/env node
const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Self-heal: install deps if http-proxy is missing (e.g. fresh Hostinger deploy)
let httpProxy;
try {
    httpProxy = require('http-proxy');
} catch (e) {
    console.log('[Boot] http-proxy not found — running npm install...');
    try {
        execSync('npm install --omit=dev', { cwd: __dirname, stdio: 'inherit' });
        httpProxy = require('http-proxy');
        console.log('[Boot] ✅ npm install complete');
    } catch (installErr) {
        console.error('[Boot] ❌ npm install failed:', installErr.message);
        process.exit(1);
    }
}

const proxy = httpProxy.createProxyServer({});

const rootDir = __dirname;
const BACK_PORT = process.env.BACK_PORT || (Math.floor(Math.random() * 10000) + 40000);
const DASH_PORT = process.env.DASH_PORT || (Math.floor(Math.random() * 10000) + 50000);

let bootLogs = [`[${new Date().toLocaleTimeString()}] Master Proxy Booting...` || ""];

function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    bootLogs.push(line);
    if (bootLogs.length > 50) bootLogs.shift();
    console.log(line);
}

/** Kill any zombie process holding the given port so we can bind cleanly. */
function freePort(port) {
    try {
        execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
        log(`🧹 Freed port ${port}`);
    } catch (_) { /* nothing was holding it — that's fine */ }
}

function startApp(name, filePath, args, port, cwd, retryDelay = 3000) {
    if (!fs.existsSync(filePath)) {
        log(`❌ ${name} file not found at ${filePath}`);
        return;
    }
    
    log(`📡 Spawning ${name} engine on port ${port}...`);
    const child = spawn(process.execPath, args, {
        env: { ...process.env, PORT: port },
        cwd: cwd || rootDir,
        shell: true
    });

    child.stdout.on('data', (data) => log(`[${name}] ${data.toString().trim()}`));
    child.stderr.on('data', (data) => log(`[${name}] ${data.toString().trim()}`));
    child.on('exit', (code) => {
        log(`⚠️  ${name} exited (code ${code}). Restarting in ${retryDelay / 1000}s...`);
        setTimeout(() => {
            freePort(port);
            startApp(name, filePath, args, port, cwd, retryDelay);
        }, retryDelay);
    });
}

// 1. Free ports, then Start Engines
freePort(BACK_PORT);
const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
startApp('Backend', backendEntry, [`"${backendEntry}"`], BACK_PORT, path.join(rootDir, 'backend-api'));

setTimeout(() => {
    let dashboardEntry = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    let dashboardCwd = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard');
    let dArgs = [`"${dashboardEntry}"`];

    if (!fs.existsSync(dashboardEntry)) {
        dashboardEntry = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'server.js');
        dashboardCwd = path.join(rootDir, 'web-dashboard', '.next', 'standalone');
        dArgs = [`"${dashboardEntry}"`];
    }
    if (!fs.existsSync(dashboardEntry)) {
        dashboardEntry = path.join(rootDir, 'web-dashboard', 'node_modules', 'next', 'dist', 'bin', 'next');
        dashboardCwd = path.join(rootDir, 'web-dashboard');
        dArgs = [`"${dashboardEntry}"`, 'start'];
    }

    freePort(DASH_PORT);
    startApp('Dashboard', dashboardEntry, dArgs, DASH_PORT, dashboardCwd);
}, 5000);

// 2. Proxy Server
const masterPort = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    // 1. Handle Static Assets Automatically
    if (req.url.startsWith('/_next/static/')) {
        const filePath = path.join(rootDir, 'web-dashboard', '.next', 'static', req.url.replace('/_next/static/', ''));
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = { 
                '.css': 'text/css', 
                '.js': 'text/javascript', 
                '.png': 'image/png', 
                '.jpg': 'image/jpeg', 
                '.jpeg': 'image/jpeg', 
                '.svg': 'image/svg+xml', 
                '.json': 'application/json',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ico': 'image/x-icon'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            return fs.createReadStream(filePath).pipe(res);
        }
    }

    if (req.url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|json|exe|dmg|AppImage|deb)$/)) {
        const filePath = path.join(rootDir, 'web-dashboard', 'public', req.url);
        if (fs.existsSync(filePath)) {
             const ext = path.extname(filePath).toLowerCase();
             const mimeTypes = { 
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', 
                '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
                '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json',
                '.exe': 'application/vnd.microsoft.portable-executable', '.dmg': 'application/x-apple-diskimage',
                '.appimage': 'application/x-executable', '.deb': 'application/vnd.debian.binary-package'
             };
             res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
             return fs.createReadStream(filePath).pipe(res);
        }
    }

    // 2. Proxy to Engines
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
