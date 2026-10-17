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

    proxyReq.on('error', () => {
        if (req.url.startsWith('/api')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Backend engine is starting up. Please retry shortly.' }));
        }
        sendBooting(res);
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
  <meta http-equiv="refresh" content="6">
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

    /* ── Blurred ambient background blobs ── */
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

    /* ── Centre stage ── */
    .stage {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 220px;
      height: 220px;
    }

    /* ── Bubble rings ── */
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

    /* ── Logo container ── */
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

    /* ── Text beneath ── */
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

    /* ── Dot spinner ── */
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
    // Admin-only boot log endpoint (consumed by /admin/system-health page)
    if (req.url === '/api/boot-logs') {
        const hasErrors = bootLogs.some(l => l.includes('❌'));
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        return res.end(JSON.stringify({
            logs    : bootLogs,
            hasErrors,
            uptime  : process.uptime(),
            ports   : { backend: BACK_PORT, dashboard: DASH_PORT, ai: AI_PORT },
            booted  : !!(BACK_PORT && DASH_PORT),
            ts      : new Date().toISOString(),
        }));
    }

    if (tryServeStatic(req, res)) return;

    if (!BACK_PORT || !DASH_PORT) {
        if (req.url.startsWith('/api')) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Backend engine initializing...' }));
        }
        return sendBooting(res);
    }

    const targetPort = (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) ? BACK_PORT : DASH_PORT;
    proxyRequest(req, res, targetPort);
});

// ─── WebSocket Upgrade Tunneling ────────────────────────────────────────────
server.on('upgrade', (req, socket, head) => {
    const targetPort = (req.url.startsWith('/socket.io') || req.url.startsWith('/api')) ? BACK_PORT : DASH_PORT;
    if (!targetPort) {
        socket.destroy();
        return;
    }
    const net = require('net');
    const proxySocket = net.connect(targetPort, '127.0.0.1', () => {
        proxySocket.write(
            `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
            Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
            '\r\n\r\n'
        );
        if (head && head.length > 0) proxySocket.write(head);
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
    });
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
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

/**
 * Kill leftover zombie child processes from previous crashed runs.
 * Hostinger shared hosting has a tight per-user process limit; stale
 * node/python procs from a previous boot exhaust those slots, causing
 * EAGAIN when we try to spawn the backend/dashboard on restart.
 */
function killZombieChildren() {
    const patterns = [
        'backend-api/dist/main',
        'dist/main.js',
        'nest start',
        'standalone/web-dashboard/server.js',
        'standalone/server.js',
        'uvicorn',
        'analytics-engine',
    ];
    for (const pat of patterns) {
        try {
            // pkill -f matches against the full command line
            execSync(`pkill -f "${pat}" 2>/dev/null || true`, { shell: true, stdio: 'ignore' });
        } catch (_) {}
    }
    log('🧹 Zombie cleanup done — cleared stale child processes.');
}

function freePort(port) {
    try { execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' }); } catch (_) {}
}

const engineFailureCounts = new Map();

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

        const startTime = Date.now();
        const child = spawn(execBin, execArgs, {
            env  : { ...process.env, PORT: String(port), NODE_ENV: 'production', ...envExtra },
            cwd  : cwd || rootDir,
            shell: false
        });
        runningChildren.push(child);

        child.stdout.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.stderr.on('data', d => log(`[${name}] ${d.toString().trim()}`));
        child.on('error', err => {
            log(`❌ [${name}] spawn error: ${err.message}`);
        });
        child.on('exit', (code, signal) => {
            const idx = runningChildren.indexOf(child);
            if (idx !== -1) runningChildren.splice(idx, 1);

            const uptime = Date.now() - startTime;
            if (uptime > 30000) {
                // If it ran stably for more than 30s, reset failure counter
                engineFailureCounts.set(name, 0);
            }

            const currentFails = (engineFailureCounts.get(name) || 0) + 1;
            engineFailureCounts.set(name, currentFails);

            // Circuit breaker: if it immediately crashes 5 times in a row, back off to avoid process limit exhaustion
            if (currentFails >= 5 && uptime < 5000) {
                log(`🛑 [${name}] Repeatedly crashing on startup (${currentFails} consecutive immediate exits). Halting restarts to preserve server resources.`);
                return;
            }

            log(`⚠️  ${name} exited (${code ?? signal}) — restarting in 5 s… (attempt ${currentFails})`);
            setTimeout(() => startEngine(name, execBin, execArgs, port, cwd, envExtra), 5000);
        });
    }, delay);
}

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
            const { execSync } = require('child_process');
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

// Resolve python3 absolute path and ensure uvicorn can actually be loaded
function resolvePython() {
    const aiDir = path.join(rootDir, 'ai-services');
    const venvDir = path.join(aiDir, 'venv');
    const venvLibDir = path.join(venvDir, 'lib');
    const localPackagesDir = path.join(aiDir, '.python_packages');
    const { execFileSync } = require('child_process');

    const pythonCandidates = findSystemPythonCandidates();

    // Helper: test if uvicorn can be imported
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

    // 1. Check virtualenv (venv/bin/python3 or python)
    const venvBins = [
        path.join(venvDir, 'bin', 'python3'),
        path.join(venvDir, 'bin', 'python')
    ];
    for (const bin of venvBins) {
        if (fs.existsSync(bin) && canImportUvicorn(bin)) {
            log(`AI Engine: resolved → venv python (${bin}) with working uvicorn`);
            return {
                bin,
                args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                env: {}
            };
        }
    }

    // 2. Check if venv lib/site-packages exists but venv binaries are broken
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
                                args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                                env: {
                                    PYTHONPATH: sitePackages,
                                    PATH: `${path.join(venvDir, 'bin')}:${process.env.PATH || ''}`
                                }
                            };
                        }
                    }
                }
            }
        } catch (e) {
            log(`AI Engine: venv scan error: ${e.message}`);
        }
    }

    // 3. Check if .python_packages exists (created by pip install --target ./.python_packages)
    if (fs.existsSync(localPackagesDir)) {
        for (const py of pythonCandidates) {
            if (canImportUvicorn(py, { PYTHONPATH: localPackagesDir })) {
                log(`AI Engine: resolved → ${py} with PYTHONPATH=${localPackagesDir}`);
                return {
                    bin: py,
                    args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                    env: {
                        PYTHONPATH: localPackagesDir,
                        PATH: `${path.join(localPackagesDir, 'bin')}:${process.env.PATH || ''}`
                    }
                };
            }
        }
    }

    // 4. Check if any system python has uvicorn globally installed
    for (const py of pythonCandidates) {
        if (canImportUvicorn(py)) {
            log(`AI Engine: resolved → ${py} (global uvicorn)`);
            return {
                bin: py,
                args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                env: {}
            };
        }
    }

    log('⚠️  AI Engine: uvicorn is not installed in venv, .python_packages, or system python. Skipping AI Engine to avoid crash loops.');
    return null;
}

async function bootEngines() {
    killZombieChildren();

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
            pythonResolved.env || {},
            0
        );
    } else {
        log('⚠️  Skipping AI Engine — visit /logs to see diagnostics. Check python3 is installed on the host.');
    }

    // ── Backend (NestJS dist) ─────────────────────────────────────────────
    const backendEntry = path.join(rootDir, 'backend-api', 'dist', 'main.js');
    if (!fs.existsSync(backendEntry)) {
        try {
            log('🔨 Building backend-api dist bundle...');
            execSync('npm run build', { cwd: path.join(rootDir, 'backend-api'), stdio: 'ignore' });
        } catch (e) {
            log(`❌ Failed to build backend-api: ${e.message}`);
        }
    }
    startEngine('Backend', process.execPath, [backendEntry], BACK_PORT,
                path.join(rootDir, 'backend-api'), { AI_SERVICE_URL: `http://127.0.0.1:${AI_PORT}` }, 0);

    // ── Analytics Engine (Rust) ──────────────────────────────────────────
    const rustBin = path.join(rootDir, 'analytics-engine', 'target', 'release', 'analytics-engine');
    const rustDebugBin = path.join(rootDir, 'analytics-engine', 'target', 'debug', 'analytics-engine');
    const targetRustBin = fs.existsSync(rustBin) ? rustBin : (fs.existsSync(rustDebugBin) ? rustDebugBin : null);
    if (targetRustBin) {
        startEngine('Analytics', targetRustBin, [], 5000, path.join(rootDir, 'analytics-engine'), {}, 0);
    }

    // ── Dashboard (Next.js standalone) ───────────────────────────────────
    const standaloneA = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    const standaloneB = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'server.js');
    const nextBinLocal = path.join(rootDir, 'web-dashboard', 'node_modules', 'next', 'dist', 'bin', 'next');
    const nextBinRoot  = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');

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
        dashEntry = fs.existsSync(nextBinLocal) ? nextBinLocal : nextBinRoot;
        dashCwd   = path.join(rootDir, 'web-dashboard');
        dashArgs  = [dashEntry, 'start'];
    }

    startEngine('Dashboard', process.execPath, dashArgs, DASH_PORT, dashCwd, {}, 1000);
}


