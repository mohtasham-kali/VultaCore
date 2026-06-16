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

/**
 * Kill leftover zombie child processes from previous crashed runs.
 * Hostinger shared hosting has a tight per-user process limit; stale
 * node/python procs from a previous boot exhaust those slots, causing
 * EAGAIN when we try to spawn the backend/dashboard on restart.
 */
function killZombieChildren() {
    const targets = [
        path.join(rootDir, 'backend-api', 'dist', 'main.js'),
        path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'server.js'),
        path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js'),
        'uvicorn',
    ];
    for (const target of targets) {
        try {
            // pkill -f matches against the full command line
            execSync(`pkill -f "${target}" 2>/dev/null || true`, { shell: true, stdio: 'ignore' });
        } catch (_) {}
    }
    log('🧹 Zombie cleanup done — cleared stale child processes.');
}

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
            shell: false
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

function findSystemPython() {
    const cmds = [
        'python3',
        'python',
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/bin/python3',
        '/usr/bin/python',
        '/opt/alt/python311/bin/python3',
        '/opt/alt/python310/bin/python3',
        '/opt/alt/python39/bin/python3'
    ];
    for (const cmd of cmds) {
        try {
            const { execSync } = require('child_process');
            // Check if command is an absolute path or exists in PATH
            let p = cmd;
            if (!cmd.startsWith('/')) {
                p = execSync(`which ${cmd} 2>/dev/null`, { encoding: 'utf8' }).trim();
            }
            if (p && fs.existsSync(p)) {
                // Verify it actually runs and is python 3 (optional but good)
                execSync(`${p} --version`, { stdio: 'ignore' });
                return p;
            }
        } catch (_) {}
    }
    return null;
}

// Resolve python3 absolute path at boot time so we can log clearly if missing
function resolvePython() {
    const aiDir = path.join(rootDir, 'ai-services');
    const venvDir = path.join(aiDir, 'venv');
    const venvLibDir = path.join(venvDir, 'lib');

    const sysPython = findSystemPython();

    if (!fs.existsSync(venvDir)) {
        if (!sysPython) {
            log(`❌ AI Engine: No system python found to create venv.`);
        } else {
            log(`AI Engine: venv missing, attempting auto-setup via ${sysPython} -m venv...`);
            try {
                const { execSync } = require('child_process');
                execSync(`${sysPython} -m venv venv`, { cwd: aiDir, stdio: 'pipe' });
                log(`AI Engine: venv created, installing requirements...`);
                const pipBin = path.join(venvDir, 'bin', 'pip');
                execSync(`${pipBin} install -r requirements.txt`, { cwd: aiDir, stdio: 'pipe' });
                log(`AI Engine: requirements installed successfully.`);
            } catch (err) {
                log(`AI Engine: Auto-setup failed: ${err.stderr ? err.stderr.toString() : err.message}`);
            }
        }
    }

    // 1. Check if a valid venv exists (by checking lib/ dir which pip always creates)
    if (fs.existsSync(venvLibDir)) {
        try {
            // Find the python3.x subdirectory dynamically
            const pyDirs = fs.readdirSync(venvLibDir).filter(d => d.startsWith('python'));
            if (pyDirs.length > 0) {
                const sitePackages = path.join(venvLibDir, pyDirs[0], 'site-packages');
                if (fs.existsSync(sitePackages)) {
                    // Find working python binary: prefer venv python, fall back to system
                    const candidates = [
                        path.join(venvDir, 'bin', 'python3'),
                        path.join(venvDir, 'bin', 'python'),
                    ];
                    for (const bin of candidates) {
                        try {
                            const { execFileSync } = require('child_process');
                            execFileSync(bin, ['--version'], { stdio: 'ignore' });
                            log(`AI Engine: resolved → venv python (${path.basename(bin)}) with site-packages`);
                            return {
                                bin,
                                args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                                env: { PYTHONPATH: sitePackages }
                            };
                        } catch (_) {}
                    }
                    // venv binaries broken — fall back to system python with PYTHONPATH
                    if (sysPython) {
                        log(`AI Engine: venv binaries broken, using system python (${sysPython}) with PYTHONPATH=${sitePackages}`);
                        return {
                            bin: sysPython,
                            args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
                            env: { PYTHONPATH: sitePackages }
                        };
                    }
                }
            }
        } catch (e) {
            log(`AI Engine: venv scan error: ${e.message}`);
        }
    }

    // 2. No venv at all — try system python3 (no guarantee uvicorn is installed)
    if (sysPython) {
        log(`AI Engine: resolved → ${sysPython} (system, no venv — uvicorn must be installed globally)`);
        return {
            bin: sysPython,
            args: (port) => ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(port)],
            env: {}
        };
    }

    log('❌ AI Engine: no python3/python found anywhere — AI bots will be unavailable');
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


