#!/usr/bin/env node
/**
 * VultaCore Master Proxy
 * Zero external dependencies — uses only Node built-ins.
 * Supports Phusion Passenger / LiteSpeed multi-worker pooling with Unix Domain Sockets.
 */
const http  = require('http');
const https = require('https');
const { spawn, execSync, execFileSync } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const net   = require('net');

const rootDir    = __dirname;
const masterPort = process.env.PORT || 3000;

// State files for multi-worker coordination
const stateFile = path.join(rootDir, '.engine-state.json');
const lockFile  = path.join(rootDir, '.engine.lock');

// User-scoped Unix domain sockets (avoids TCP loopback / firewall restrictions in CloudLinux/CageFS)
const uid = typeof process.getuid === 'function' ? process.getuid() : 'shared';
let BACK_TARGET = path.join('/tmp', `vultacore-back-${uid}.sock`);
let DASH_TARGET = path.join('/tmp', `vultacore-dash-${uid}.sock`);
let AI_TARGET   = path.join('/tmp', `vultacore-ai-${uid}.sock`);
let AI_PORT     = null;

let BACK_READY = false;
let DASH_READY = false;
let AI_READY   = false;
let isPrimaryManager = false;

let bootLogs = [];

function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    bootLogs.push(line);
    if (bootLogs.length > 150) bootLogs.shift();
    console.log(line);
}

log(`Master Proxy Booting (PID ${process.pid})...`);

// ─── Socket & Port Availability Check ───────────────────────────────────────
function checkSocket(target, timeoutMs = 1200) {
    return new Promise((resolve) => {
        if (!target) return resolve(false);
        const isSocket = typeof target === 'string' && (target.startsWith('/') || target.endsWith('.sock'));
        const socket = new net.Socket();
        let called = false;
        const done = (result) => {
            if (!called) {
                called = true;
                socket.destroy();
                resolve(result);
            }
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => done(true));
        socket.once('error', () => done(false));
        socket.once('timeout', () => done(false));

        if (isSocket) {
            socket.connect(target);
        } else {
            socket.connect(Number(target), '127.0.0.1');
        }
    });
}

function findFreePort() {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const port = srv.address().port;
            srv.close((err) => err ? reject(err) : resolve(port));
        });
        srv.on('error', reject);
    });
}

// ─── Built-in HTTP Proxy ────────────────────────────────────────────────────
function proxyRequest(req, res, target) {
    const isSocket = typeof target === 'string' && (target.startsWith('/') || target.endsWith('.sock'));
    const options = isSocket ? {
        socketPath : target,
        path       : req.url,
        method     : req.method,
        headers    : {
            ...req.headers,
            host              : req.headers.host || 'vultacore.techprogression.com',
            'x-forwarded-host': req.headers.host || 'vultacore.techprogression.com',
            'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https'
        }
    } : {
        hostname   : '127.0.0.1',
        port       : target,
        path       : req.url,
        method     : req.method,
        headers    : {
            ...req.headers,
            host              : `127.0.0.1:${target}`,
            'x-forwarded-host': req.headers.host || 'vultacore.techprogression.com',
            'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https'
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        log(`❌ Proxy connection failed [${req.method} ${req.url} -> ${target}]: ${err.code || err.message}`);

        if (req.url.startsWith('/api')) {
            if (!res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend engine is starting up. Please retry shortly.' }));
            }
        } else {
            if (!res.headersSent) {
                sendBooting(res);
            }
        }
    });

    req.on('error', () => {
        try { proxyReq.destroy(); } catch (_) {}
    });
    res.on('error', () => {
        try { proxyReq.destroy(); } catch (_) {}
    });

    req.pipe(proxyReq, { end: true });
}

function sendBooting(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="2">
  <title>VultaCore — Starting</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #050a14;
      overflow: hidden;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .bg-blob {
      position: fixed;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.18;
      animation: blobDrift 8s ease-in-out infinite alternate;
    }
    .bg-blob-1 { width: 500px; height: 500px; background: #7c3aed; top: -150px; left: -150px; animation-delay: 0s; }
    .bg-blob-2 { width: 400px; height: 400px; background: #2563eb; bottom: -120px; right: -120px; animation-delay: -3s; }
    .bg-blob-3 { width: 300px; height: 300px; background: #0ea5e9; top: 40%; left: 55%; animation-delay: -6s; }

    @keyframes blobDrift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(30px, 20px) scale(1.08); }
    }

    .stage {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 220px;
      height: 220px;
    }

    .ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid rgba(139, 92, 246, 0.5);
      animation: ringPulse 2.4s ease-in-out infinite;
    }
    .ring-1 { width: 130px; height: 130px; animation-delay: 0s;    border-color: rgba(139,92,246,0.55); }
    .ring-2 { width: 170px; height: 170px; animation-delay: 0.5s;  border-color: rgba(99,102,241,0.40); }
    .ring-3 { width: 210px; height: 210px; animation-delay: 1.0s;  border-color: rgba(59,130,246,0.30); }
    .ring-4 { width: 250px; height: 250px; animation-delay: 1.5s;  border-color: rgba(14,165,233,0.20); }

    @keyframes ringPulse {
      0%   { transform: scale(0.88); opacity: 0.9; }
      50%  { transform: scale(1.05); opacity: 0.5; }
      100% { transform: scale(0.88); opacity: 0.9; }
    }

    .logo-wrap {
      position: relative;
      z-index: 10;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.15);
      animation: logoBreath 3s ease-in-out infinite;
    }
    .logo-wrap img {
      width: 54px;
      height: 54px;
      object-fit: contain;
      filter: drop-shadow(0 0 12px rgba(139,92,246,0.6));
    }

    @keyframes logoBreath {
      0%, 100% { transform: scale(1);    box-shadow: 0 0 40px rgba(139,92,246,0.35), 0 0 80px rgba(139,92,246,0.15); }
      50%       { transform: scale(1.06); box-shadow: 0 0 60px rgba(139,92,246,0.55), 0 0 120px rgba(139,92,246,0.25); }
    }

    .label {
      margin-top: 48px;
      text-align: center;
      color: rgba(255,255,255,0.85);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-shadow: 0 0 20px rgba(139,92,246,0.5);
    }
    .sublabel {
      margin-top: 8px;
      text-align: center;
      color: rgba(148,163,184,0.7);
      font-size: 0.72rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .dots {
      display: flex;
      gap: 6px;
      margin-top: 22px;
      justify-content: center;
    }
    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #7c3aed;
      animation: dotBounce 1.4s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; background: #6366f1; }
    .dot:nth-child(3) { animation-delay: 0.4s; background: #3b82f6; }

    @keyframes dotBounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%            { transform: scale(1.2); opacity: 1; }
    }

    .wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="bg-blob bg-blob-1"></div>
  <div class="bg-blob bg-blob-2"></div>
  <div class="bg-blob bg-blob-3"></div>

  <div class="wrapper">
    <div class="stage">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="ring ring-3"></div>
      <div class="ring ring-4"></div>
      <div class="logo-wrap">
        <img src="/logo.png" alt="VultaCore" onerror="this.style.display='none';this.parentNode.innerHTML='<span style=\\'font-size:2rem\\'>⚡</span>'">
      </div>
    </div>

    <div class="label">VultaCore</div>
    <div class="sublabel">Initializing engines…</div>
    <div class="dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  </div>
</body>
</html>`);
}

// ─── Static Asset Shortcuts (bypass child proxy for speed) ──────────────────
function tryServeStatic(req, res) {
    let filePath = null;
    const cleanUrl = (req.url || '').split('?')[0];

    if (cleanUrl.startsWith('/_next/static/')) {
        filePath = path.join(rootDir, 'web-dashboard', '.next', 'static',
                            cleanUrl.replace('/_next/static/', ''));
    } else if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|json|exe|dmg|AppImage|deb)$/i.test(cleanUrl)) {
        filePath = path.join(rootDir, 'web-dashboard', 'public', cleanUrl);
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

// ─── Master HTTP Server ─────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    // Diagnostic endpoints — always available
    if (req.url === '/logs' || req.url === '/_logs') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(bootLogs.join('\n'));
    }
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status   : 'up',
            ready    : { backend: BACK_READY, dashboard: DASH_READY, ai: AI_READY },
            targets  : { backend: BACK_TARGET, dashboard: DASH_TARGET, ai: AI_TARGET },
            isPrimary: isPrimaryManager,
            pid      : process.pid,
            uptime   : process.uptime()
        }));
    }
    // Admin boot log endpoint
    if (req.url === '/api/boot-logs') {
        const hasErrors = bootLogs.some(l => l.includes('❌'));
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        return res.end(JSON.stringify({
            logs     : bootLogs,
            hasErrors,
            uptime   : process.uptime(),
            targets  : { backend: BACK_TARGET, dashboard: DASH_TARGET, ai: AI_TARGET },
            booted   : !!(BACK_READY && DASH_READY),
            ready    : { backend: BACK_READY, dashboard: DASH_READY, ai: AI_READY },
            isPrimary: isPrimaryManager,
            pid      : process.pid,
            ts       : new Date().toISOString(),
        }));
    }

    if (tryServeStatic(req, res)) return;

    const isApi = req.url.startsWith('/api') || req.url.startsWith('/socket.io');

    if (isApi) {
        if (!BACK_READY || !BACK_TARGET) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Backend engine initializing... Please retry shortly.' }));
        }
        return proxyRequest(req, res, BACK_TARGET);
    } else {
        if (!DASH_READY || !DASH_TARGET) {
            return sendBooting(res);
        }
        return proxyRequest(req, res, DASH_TARGET);
    }
});

// ─── WebSocket Upgrade Tunneling ────────────────────────────────────────────
server.on('upgrade', (req, socket, head) => {
    const isApi = req.url.startsWith('/socket.io') || req.url.startsWith('/api');
    const target = isApi ? BACK_TARGET : DASH_TARGET;
    const isReady = isApi ? BACK_READY : DASH_READY;

    if (!target || !isReady) {
        socket.destroy();
        return;
    }

    const isSocket = typeof target === 'string' && (target.startsWith('/') || target.endsWith('.sock'));
    const proxySocket = isSocket
        ? net.connect(target, () => onConnected())
        : net.connect(Number(target), '127.0.0.1', () => onConnected());

    function onConnected() {
        proxySocket.write(
            `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
            Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
            '\r\n\r\n'
        );
        if (head && head.length > 0) proxySocket.write(head);
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
    }

    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
});

server.listen(masterPort, () => {
    log(`✨ Master Proxy listening on port ${masterPort}`);
    bootEngines().catch(err => {
        log(`❌ Failure in bootEngines: ${err.message}`);
    });
});

server.on('error', (err) => {
    log(`❌ Master server error: ${err.message}`);
    process.exit(1);
});

// ─── Child Process Tracking & Lifecycle ──────────────────────────────────────
const runningChildren = [];

function killChildren() {
    runningChildren.forEach(child => {
        try { child.kill('SIGTERM'); } catch (_) {}
    });
}

function cleanup() {
    if (isPrimaryManager) {
        try { fs.unlinkSync(lockFile); } catch (_) {}
        try { fs.unlinkSync(stateFile); } catch (_) {}
        try { fs.unlinkSync(BACK_TARGET); } catch (_) {}
        try { fs.unlinkSync(DASH_TARGET); } catch (_) {}
        try { fs.unlinkSync(AI_TARGET); } catch (_) {}
    }
    killChildren();
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('uncaughtException', (err) => { log(`❌ Uncaught exception: ${err.stack || err}`); });
process.on('unhandledRejection', (reason) => { log(`❌ Unhandled rejection: ${reason?.stack || reason}`); });

function freePortOrSocket(target) {
    if (typeof target === 'string' && (target.startsWith('/') || target.endsWith('.sock'))) {
        try { fs.unlinkSync(target); } catch (_) {}
    } else if (target) {
        try { execSync(`fuser -k ${target}/tcp`, { stdio: 'ignore' }); } catch (_) {}
    }
}

const engineFailureCounts = new Map();

function startEngine(name, execBin, execArgs, portOrSocket, cwd, envExtra = {}, delay = 0) {
    setTimeout(() => {
        const isAbsPath = execBin.startsWith('/');
        if (isAbsPath && !fs.existsSync(execBin)) {
            log(`❌ ${name}: executable not found → ${execBin}`);
            return;
        }
        freePortOrSocket(portOrSocket);
        log(`📡 Spawning ${name} on ${portOrSocket} [${execBin}]...`);

        const startTime = Date.now();
        const child = spawn(execBin, execArgs, {
            env  : { ...process.env, PORT: String(portOrSocket), NODE_ENV: 'production', ...envExtra },
            cwd  : cwd || rootDir,
            shell: false
        });
        runningChildren.push(child);

        child.stdout.on('data', d => {
            const line = d.toString().trim();
            log(`[${name}] ${line}`);
            if (name === 'Dashboard' && (line.includes('Ready in') || line.includes('started server on') || line.includes('Ready on'))) {
                DASH_READY = true;
            }
            if (name === 'Backend' && line.includes('Application is running on')) {
                BACK_READY = true;
            }
            if (name === 'AI Engine' && (line.includes('Application startup complete') || line.includes('Uvicorn running on'))) {
                AI_READY = true;
            }
        });
        child.stderr.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.on('error', err => {
            log(`❌ [${name}] spawn error: ${err.message}`);
        });
        child.on('exit', (code, signal) => {
            const idx = runningChildren.indexOf(child);
            if (idx !== -1) runningChildren.splice(idx, 1);

            if (name === 'Dashboard') DASH_READY = false;
            if (name === 'Backend') BACK_READY = false;
            if (name === 'AI Engine') AI_READY = false;

            const uptime = Date.now() - startTime;
            if (uptime > 30000) {
                engineFailureCounts.set(name, 0);
            }

            const currentFails = (engineFailureCounts.get(name) || 0) + 1;
            engineFailureCounts.set(name, currentFails);

            // Progressive backoff: 3s, 6s, 9s, max 30s
            const backoff = Math.min(3000 * Math.min(currentFails, 10), 30000);
            log(`⚠️  ${name} exited (${code ?? signal}) — restarting in ${(backoff / 1000).toFixed(0)} s… (attempt ${currentFails})`);
            setTimeout(() => {
                startEngine(name, execBin, execArgs, portOrSocket, cwd, envExtra);
            }, backoff);
        });
    }, delay);
}

// ─── Python Environment Discovery ───────────────────────────────────────────
function findSystemPythonCandidates() {
    const cmds = [
        '/opt/alt/python311/bin/python3',
        '/opt/alt/python310/bin/python3',
        '/opt/alt/python39/bin/python3',
        'python3.11',
        'python3.10',
        'python3.9',
        'python3',
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/bin/python3',
        'python',
        '/usr/bin/python'
    ];
    const found = [];
    for (const cmd of cmds) {
        try {
            let p = cmd;
            if (!cmd.startsWith('/')) {
                p = execSync(`which ${cmd} 2>/dev/null`, { encoding: 'utf8' }).trim();
            }
            if (p && fs.existsSync(p) && !found.includes(p)) {
                execSync(`${p} --version`, { stdio: 'ignore' });
                found.push(p);
            }
        } catch (_) {}
    }
    return found;
}

function getUvicornArgs(target) {
    const isSocket = typeof target === 'string' && (target.startsWith('/') || target.endsWith('.sock'));
    return isSocket
        ? ['-m', 'uvicorn', 'main:app', '--uds', target]
        : ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(target)];
}

function resolvePython() {
    const aiDir = path.join(rootDir, 'ai-services');
    const venvDir = path.join(aiDir, 'venv');
    const venvLibDir = path.join(venvDir, 'lib');
    const localPackagesDir = path.join(aiDir, '.python_packages');

    const pythonCandidates = findSystemPythonCandidates();

    function canImportUvicorn(bin, extraEnv = {}) {
        try {
            execFileSync(bin, ['-c', 'import uvicorn'], {
                env: { ...process.env, ...extraEnv },
                stdio: 'ignore'
            });
            return true;
        } catch (_) {
            return false;
        }
    }

    // 1. Check virtualenv
    const venvBins = [
        path.join(venvDir, 'bin', 'python3'),
        path.join(venvDir, 'bin', 'python')
    ];
    for (const bin of venvBins) {
        if (fs.existsSync(bin) && canImportUvicorn(bin)) {
            log(`AI Engine: resolved → venv python (${bin}) with working uvicorn`);
            return {
                bin,
                args: getUvicornArgs,
                env: {}
            };
        }
    }

    // 2. Check venv site-packages with system python
    if (fs.existsSync(venvLibDir)) {
        try {
            const pyDirs = fs.readdirSync(venvLibDir).filter(d => d.startsWith('python'));
            if (pyDirs.length > 0) {
                const sitePackages = path.join(venvLibDir, pyDirs[0], 'site-packages');
                if (fs.existsSync(sitePackages)) {
                    for (const py of pythonCandidates) {
                        if (canImportUvicorn(py, { PYTHONPATH: sitePackages })) {
                            log(`AI Engine: resolved → ${py} using venv site-packages`);
                            return {
                                bin: py,
                                args: getUvicornArgs,
                                env: {
                                    PYTHONPATH: sitePackages,
                                    PATH: `${path.join(venvDir, 'bin')}:${process.env.PATH || ''}`
                                }
                            };
                        }
                    }
                }
            }
        } catch (_) {}
    }

    // 3. Check .python_packages
    if (fs.existsSync(localPackagesDir)) {
        for (const py of pythonCandidates) {
            if (canImportUvicorn(py, { PYTHONPATH: localPackagesDir })) {
                log(`AI Engine: resolved → ${py} with PYTHONPATH=${localPackagesDir}`);
                return {
                    bin: py,
                    args: getUvicornArgs,
                    env: {
                        PYTHONPATH: localPackagesDir,
                        PATH: `${path.join(localPackagesDir, 'bin')}:${process.env.PATH || ''}`
                    }
                };
            }
        }
    }

    // 4. Check global uvicorn
    for (const py of pythonCandidates) {
        if (canImportUvicorn(py)) {
            log(`AI Engine: resolved → ${py} (global uvicorn)`);
            return {
                bin: py,
                args: getUvicornArgs,
                env: {}
            };
        }
    }

    log('⚠️  AI Engine: uvicorn is not installed in venv, .python_packages, or system python. Skipping AI Engine to avoid crash loops.');
    return null;
}

// ─── Engine Boot & Coordination Orchestration ───────────────────────────────
async function waitForReadiness(backTarget, dashTarget, aiTarget) {
    let backDone = false;
    let dashDone = false;
    let aiDone   = false;

    for (let i = 0; i < 60; i++) {
        if (!backDone) {
            backDone = await checkSocket(backTarget);
            if (backDone) {
                BACK_READY = true;
                log(`✅ Backend is operational on ${backTarget}`);
            }
        }
        if (!dashDone) {
            dashDone = await checkSocket(dashTarget);
            if (dashDone) {
                DASH_READY = true;
                log(`✅ Dashboard is operational on ${dashTarget}`);
            }
        }
        if (!aiDone && aiTarget) {
            aiDone = await checkSocket(aiTarget);
            if (aiDone) {
                AI_READY = true;
                log(`✅ AI Engine is operational on ${aiTarget}`);
            }
        }
        if (backDone && dashDone && (aiDone || !aiTarget)) break;
        await new Promise(r => setTimeout(r, 500));
    }

    if (backDone && dashDone) {
        try {
            fs.writeFileSync(stateFile, JSON.stringify({
                managerPid     : process.pid,
                backendTarget  : backTarget,
                dashboardTarget: dashTarget,
                aiTarget       : aiTarget,
                updatedAt      : Date.now()
            }), 'utf8');
            try { fs.unlinkSync(lockFile); } catch (_) {}
            log(`🚀 All engines operational! Master Proxy ready to serve.`);
        } catch (e) {
            log(`Warning: Failed to save engine state: ${e.message}`);
        }
    } else {
        log(`⚠️ Readiness check incomplete after 30s (Backend=${backDone}, Dashboard=${dashDone}, AI=${aiDone})`);
    }
}

async function bootEngines() {
    // ── Phase 1: Check if sibling worker already manages healthy engines ──
    if (fs.existsSync(stateFile)) {
        try {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            const bTarget = state.backendTarget || state.backendPort;
            const dTarget = state.dashboardTarget || state.dashboardPort;
            const aTarget = state.aiTarget || state.aiPort;

            if (bTarget && dTarget) {
                const dashOk = await checkSocket(dTarget);
                const backOk = await checkSocket(bTarget);
                if (dashOk && backOk) {
                    BACK_TARGET = bTarget;
                    DASH_TARGET = dTarget;
                    AI_TARGET   = aTarget || AI_TARGET;
                    BACK_READY  = true;
                    DASH_READY  = true;
                    if (aTarget) AI_READY = await checkSocket(aTarget);
                    log(`✨ Attached to existing healthy engines (Manager PID ${state.managerPid}): Backend=${BACK_TARGET}, Dashboard=${DASH_TARGET}, AI=${AI_TARGET}`);
                    return;
                }
            }
        } catch (_) {}
    }

    // ── Phase 2: Try to acquire Primary Manager lock ──
    try {
        const fd = fs.openSync(lockFile, 'wx');
        fs.writeSync(fd, String(process.pid));
        fs.closeSync(fd);
        isPrimaryManager = true;
    } catch (e) {
        // Lock exists. Check if stale (> 45s)
        try {
            const stat = fs.statSync(lockFile);
            if (Date.now() - stat.mtimeMs > 45000) {
                try { fs.unlinkSync(lockFile); } catch (_) {}
                const fd = fs.openSync(lockFile, 'wx');
                fs.writeSync(fd, String(process.pid));
                fs.closeSync(fd);
                isPrimaryManager = true;
            }
        } catch (_) {}
    }

    // ── Phase 3: Secondary Worker Waiting ──
    if (!isPrimaryManager) {
        log(`⏳ Another worker is currently starting engines. Waiting for readiness...`);
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 1000));
            if (fs.existsSync(stateFile)) {
                try {
                    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                    const bTarget = state.backendTarget || state.backendPort;
                    const dTarget = state.dashboardTarget || state.dashboardPort;
                    const aTarget = state.aiTarget || state.aiPort;
                    if (bTarget && dTarget) {
                        const dashOk = await checkSocket(dTarget);
                        const backOk = await checkSocket(bTarget);
                        if (dashOk && backOk) {
                            BACK_TARGET = bTarget;
                            DASH_TARGET = dTarget;
                            AI_TARGET   = aTarget || AI_TARGET;
                            BACK_READY  = true;
                            DASH_READY  = true;
                            if (aTarget) AI_READY = await checkSocket(aTarget);
                            log(`✨ Engines ready! Attached: Backend=${BACK_TARGET}, Dashboard=${DASH_TARGET}, AI=${AI_TARGET}`);
                            return;
                        }
                    }
                } catch (_) {}
            }
        }
        log(`⚠️ Wait timed out — taking over as Primary Engine Manager.`);
        try { fs.unlinkSync(lockFile); } catch (_) {}
        isPrimaryManager = true;
    }

    // ── Phase 4: Primary Manager Engine Boot ──
    log(`👑 Operating as Primary Engine Manager.`);

    // Ensure stale socket files from prior crashes are removed
    freePortOrSocket(BACK_TARGET);
    freePortOrSocket(DASH_TARGET);
    freePortOrSocket(AI_TARGET);

    // 1. AI Engine (optional)
    const pythonResolved = resolvePython();
    if (pythonResolved) {
        startEngine(
            'AI Engine',
            pythonResolved.bin,
            pythonResolved.args(AI_TARGET),
            AI_TARGET,
            path.join(rootDir, 'ai-services'),
            pythonResolved.env || {},
            0
        );
    } else {
        log('⚠️  Skipping AI Engine — visit /logs to see diagnostics. Check python3 is installed on the host.');
    }

    // 2. Backend (NestJS)
    const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
    if (!fs.existsSync(backendEntry)) {
        try {
            log('🔨 Building backend-api dist bundle...');
            execSync('npm run build', { cwd: path.join(rootDir, 'backend-api'), stdio: 'ignore' });
        } catch (e) {
            log(`❌ Failed to build backend-api: ${e.message}`);
        }
    }
    const aiServiceUrl = (typeof AI_TARGET === 'string' && (AI_TARGET.startsWith('/') || AI_TARGET.endsWith('.sock')))
        ? AI_TARGET
        : `http://127.0.0.1:${AI_TARGET}`;

    startEngine('Backend', process.execPath, [backendEntry], BACK_TARGET,
                path.join(rootDir, 'backend-api'),
                { AI_SERVICE_URL: aiServiceUrl, HOSTNAME: '127.0.0.1' }, 0);

    // 3. Analytics Engine (Rust)
    const rustBin = path.join(rootDir, 'analytics-engine', 'target', 'release', 'analytics-engine');
    const rustDebugBin = path.join(rootDir, 'analytics-engine', 'target', 'debug', 'analytics-engine');
    const targetRustBin = fs.existsSync(rustBin) ? rustBin : (fs.existsSync(rustDebugBin) ? rustDebugBin : null);
    if (targetRustBin) {
        startEngine('Analytics', targetRustBin, [], 5000, path.join(rootDir, 'analytics-engine'), {}, 0);
    }

    // 4. Dashboard (Next.js)
    const customRunner = path.join(rootDir, 'web-dashboard', 'standalone-runner.js');
    const standaloneA  = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    const standaloneB  = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'server.js');
    const nextBinLocal = path.join(rootDir, 'web-dashboard', 'node_modules', 'next', 'dist', 'bin', 'next');
    const nextBinRoot  = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');

    let dashEntry, dashCwd, dashArgs;
    if (fs.existsSync(customRunner)) {
        dashEntry = customRunner;
        dashCwd   = path.join(rootDir, 'web-dashboard');
        dashArgs  = [customRunner];
    } else if (fs.existsSync(standaloneA)) {
        dashEntry = standaloneA;
        dashCwd   = path.dirname(standaloneA);
        dashArgs  = [standaloneA];
    } else if (fs.existsSync(standaloneB)) {
        dashEntry = standaloneB;
        dashCwd   = path.dirname(standaloneB);
        dashArgs  = [standaloneB];
    } else {
        dashEntry = fs.existsSync(nextBinLocal) ? nextBinLocal : nextBinRoot;
        dashCwd   = path.join(rootDir, 'web-dashboard');
        dashArgs  = [dashEntry, 'start'];
    }

    startEngine('Dashboard', process.execPath, dashArgs, DASH_TARGET, dashCwd, {}, 0);

    // Begin async health monitoring and state publishing
    waitForReadiness(BACK_TARGET, DASH_TARGET, AI_TARGET);

    // Periodic heartbeat to keep state file fresh
    setInterval(() => {
        if (isPrimaryManager && fs.existsSync(stateFile)) {
            try {
                const s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                s.updatedAt = Date.now();
                fs.writeFileSync(stateFile, JSON.stringify(s), 'utf8');
            } catch (_) {}
        }
    }, 15000);
}
