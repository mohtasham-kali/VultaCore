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
let AI_PORT   = null;

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

// ─── /logs diagnostic route ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    // Diagnostic endpoints — always available
    if (req.url === '/logs' || req.url === '/_logs') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(bootLogs.join('\n'));
    }
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'up',
            ports : { backend: BACK_PORT, dashboard: DASH_PORT, ai: AI_PORT },
            uptime: process.uptime()
        }));
    }

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

function startEngine(name, execBin, execArgs, port, cwd, envExtra = {}, delay = 0) {
    setTimeout(() => {
        // Only stat-check absolute paths — bare commands are resolved by the OS
        const isAbsPath = execBin.startsWith('/');
        if (isAbsPath && !fs.existsSync(execBin)) {
            log(`❌ ${name}: executable not found → ${execBin}`);
            return;
        }
        freePort(port);
        log(`📡 Spawning ${name} on port ${port} [${execBin}]...`);

        const child = spawn(execBin, execArgs, {
            env  : { ...process.env, PORT: String(port), NODE_ENV: 'production', ...envExtra },
            cwd  : cwd || rootDir,
            shell: true   // shell:true ensures PATH resolution works in Passenger's env
        });
        runningChildren.push(child);

        child.stdout.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.stderr.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.on('error', err => {
            log(`❌ [${name}] spawn error: ${err.message}`);
        });
        child.on('exit', code => {
            log(`⚠️  ${name} exited (${code}) — restarting in 5 s…`);
            setTimeout(() => startEngine(name, execBin, execArgs, port, cwd, envExtra), 5000);
        });
    }, delay);
}

// Resolve python3 absolute path at boot time so we can log clearly if missing
function resolvePython() {
    // 1. Prefer the venv we install during CD
    const venvUvicorn = path.join(rootDir, 'ai-services', 'venv', 'bin', 'uvicorn');
    const venvPython  = path.join(rootDir, 'ai-services', 'venv', 'bin', 'python3');
    if (fs.existsSync(venvUvicorn)) {
        log('AI Engine: resolved → venv/bin/uvicorn');
        return { bin: venvUvicorn, args: (port) => ['main:app', '--host', '127.0.0.1', '--port', String(port)] };
    }
    if (fs.existsSync(venvPython)) {
        log('AI Engine: resolved → venv/bin/python3 -m uvicorn');
        return { bin: venvPython, args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)] };
    }

    // 2. Try to find system python3 via `which`
    for (const cmd of ['python3', 'python']) {
        try {
            const p = execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
            if (p) {
                log(`AI Engine: resolved → ${p} (system, shell=true)`);
                return { bin: p, args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)] };
            }
        } catch (_) {}
    }

    log('❌ AI Engine: no python3/python found anywhere — AI bots will be unavailable');
    return null;
}

async function bootEngines() {
    try {
        BACK_PORT = await findFreePort();
        DASH_PORT = await findFreePort();
        AI_PORT   = await findFreePort();
        log(`Dynamically allocated ports: Backend=${BACK_PORT}, Dashboard=${DASH_PORT}, AI=${AI_PORT}`);
    } catch (e) {
        log(`❌ Failed to allocate ports: ${e.message}`);
        return;
    }

    // ── AI Engine (FastAPI) ────────────────────────────────────────────────
    const pythonResolved = resolvePython();
    if (pythonResolved) {
        startEngine(
            'AI Engine',
            pythonResolved.bin,
            pythonResolved.args(AI_PORT),
            AI_PORT,
            path.join(rootDir, 'ai-services'),
            {},
            0
        );
    } else {
        log('⚠️  Skipping AI Engine — visit /logs to see diagnostics. Check python3 is installed on the host.');
    }

    // ── Backend (NestJS dist) ─────────────────────────────────────────────
    const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
    startEngine('Backend', process.execPath, [backendEntry], BACK_PORT,
                path.join(rootDir, 'backend-api'), { AI_SERVICE_URL: `http://127.0.0.1:${AI_PORT}` }, 0);

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

    startEngine('Dashboard', process.execPath, dashArgs, DASH_PORT, dashCwd, {}, 5000);
}


