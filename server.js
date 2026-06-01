#!/usr/bin/env node
/**
 * VultaCore Master Proxy
 * Zero external dependencies — uses only Node built-ins.
 * Passenger must see this process bind to process.env.PORT quickly.
 */
const http  = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');

const rootDir    = __dirname;
const masterPort = process.env.PORT || 3000;

// Child ports — assigned dynamically on boot to prevent Zombie process EADDRINUSE errors
let BACK_PORT = null;
let DASH_PORT = null;

function findFreePort() {
    return new Promise((resolve, reject) => {
        const net = require('net');
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const port = srv.address().port;
            srv.close((err) => err ? reject(err) : resolve(port));
        });
        srv.on('error', reject);
    });
}

let bootLogs = [];

function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    bootLogs.push(line);
    if (bootLogs.length > 100) bootLogs.shift();
    console.log(line);
}

log('Master Proxy Booting...');

// ─── Built-in HTTP Proxy ────────────────────────────────────────────────────
function proxyRequest(req, res, targetPort) {
    const options = {
        hostname : '127.0.0.1',
        port     : targetPort,
        path     : req.url,
        method   : req.method,
        headers  : { ...req.headers, host: `127.0.0.1:${targetPort}` }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => sendBooting(res));
    req.pipe(proxyReq, { end: true });
}

function sendBooting(res) {
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head><title>VultaCore — Starting</title><meta http-equiv="refresh" content="5"></head>
<body style="background:#0f172a;color:#cbd5e1;font-family:monospace;padding:40px">
  <h1 style="color:#ef4444">System Initializing</h1>
  <p>Engines warming up. Auto-refreshing in 5 s…</p>
  <div style="background:#000;padding:20px;border-radius:8px;border:1px solid #1e293b">
    <h3 style="color:#3b82f6">Live Boot Logs:</h3>
    <pre>${bootLogs.join('\n')}</pre>
  </div>
</body>
</html>`);
}

// ─── Static Asset Shortcuts (bypass child proxy for speed) ──────────────────
function tryServeStatic(req, res) {
    let filePath = null;

    if (req.url.startsWith('/_next/static/')) {
        filePath = path.join(rootDir, 'web-dashboard', '.next', 'static',
                            req.url.replace('/_next/static/', ''));
    } else if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|json|exe|dmg|AppImage|deb)$/i.test(req.url)) {
        filePath = path.join(rootDir, 'web-dashboard', 'public', req.url);
    }

    if (filePath && fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mime = {
            '.css':'text/css', '.js':'text/javascript', '.png':'image/png',
            '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
            '.ico':'image/x-icon', '.webp':'image/webp',
            '.woff':'font/woff', '.woff2':'font/woff2',
            '.json':'application/json'
        };
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return true;
    }
    return false;
}

// ─── Master HTTP Server (binds IMMEDIATELY so Passenger is happy) ───────────
const server = http.createServer((req, res) => {
    if (tryServeStatic(req, res)) return;

    if (!BACK_PORT || !DASH_PORT) {
        return sendBooting(res);
    }

    const targetPort = req.url.startsWith('/api') ? BACK_PORT : DASH_PORT;
    proxyRequest(req, res, targetPort);
});

server.listen(masterPort, () => {
    log(`✨ Master Proxy listening on port ${masterPort}`);
    // Spawn engines AFTER we are already listening
    bootEngines().catch(err => {
        log(`❌ Extent failure in bootEngines: ${err.message}`);
    });
});

server.on('error', (err) => {
    log(`❌ Master server error: ${err.message}`);
    process.exit(1);
});

// ─── Engine Spawner ──────────────────────────────────────────────────────────
const runningChildren = [];

function killChildren() {
    runningChildren.forEach(child => {
        try { child.kill('SIGKILL'); } catch (_) {}
    });
}
process.on('exit', killChildren);
process.on('SIGINT', () => { killChildren(); process.exit(0); });
process.on('SIGTERM', () => { killChildren(); process.exit(0); });

function freePort(port) {
    try { execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' }); } catch (_) {}
}

function startEngine(name, filePath, args, port, cwd, delay = 0) {
    setTimeout(() => {
        if (!fs.existsSync(filePath)) {
            log(`❌ ${name}: entry not found → ${filePath}`);
            return;
        }
        freePort(port);
        log(`📡 Spawning ${name} on port ${port}...`);

        const child = spawn(process.execPath, args, {
            env  : { ...process.env, PORT: String(port), NODE_ENV: 'production' },
            cwd  : cwd || rootDir,
            shell: false
        });
        runningChildren.push(child);

        child.stdout.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.stderr.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.on('exit', code => {
            log(`⚠️  ${name} exited (${code}) — restarting in 3 s…`);
            setTimeout(() => startEngine(name, filePath, args, port, cwd), 3000);
        });
    }, delay);
}

async function bootEngines() {
    try {
        BACK_PORT = await findFreePort();
        DASH_PORT = await findFreePort();
        log(`Dynamically allocated ports: Backend=${BACK_PORT}, Dashboard=${DASH_PORT}`);
    } catch (e) {
        log(`❌ Failed to allocate ports: ${e.message}`);
        return;
    }

    // ── Backend (NestJS dist) ─────────────────────────────────────────────
    const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
    startEngine('Backend', backendEntry, [backendEntry], BACK_PORT,
                path.join(rootDir, 'backend-api'), 0);

    // ── Dashboard (Next.js standalone) ───────────────────────────────────
    const standaloneA = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    const standaloneB = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'server.js');
    const nextBin     = path.join(rootDir, 'web-dashboard', 'node_modules', 'next', 'dist', 'bin', 'next');

    let dashEntry, dashCwd, dashArgs;
    if (fs.existsSync(standaloneA)) {
        dashEntry = standaloneA;
        dashCwd   = path.dirname(standaloneA);
        dashArgs  = [standaloneA];
    } else if (fs.existsSync(standaloneB)) {
        dashEntry = standaloneB;
        dashCwd   = path.dirname(standaloneB);
        dashArgs  = [standaloneB];
    } else {
        dashEntry = nextBin;
        dashCwd   = path.join(rootDir, 'web-dashboard');
        dashArgs  = [nextBin, 'start'];
    }

    startEngine('Dashboard', dashEntry, dashArgs, DASH_PORT, dashCwd, 5000);
}
