#!/usr/bin/env node
 
/**
 * VultaCore Master Proxy
 *
 * Hostinger Cloud / Passenger compatible.
 *
 * IMPORTANT:
 * - No external Node dependencies required by this file.
 * - Automatically repairs missing backend cookie-parser and sqlite3.
 * - Prevents duplicate AI Engine processes on port 8001.
 * - Keeps Backend, Dashboard and AI behind one public port.
 */
 
const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
 
const rootDir = __dirname;
const BACKEND_DIR = path.join(rootDir, 'backend-api');

// Load environment variables from .env if not already defined
function loadEnv() {
    const envPaths = [
        path.join(rootDir, '.env'),
        path.join(BACKEND_DIR, '.env')
    ];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf8');
                for (const line of content.split('\n')) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx > 0) {
                        const key = trimmed.slice(0, eqIdx).trim();
                        let val = trimmed.slice(eqIdx + 1).trim();
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        if (process.env[key] === undefined || process.env[key] === '') {
                            process.env[key] = val;
                        }
                    }
                }
            } catch (_) {}
        }
    }
    // Accept SUPABASE_DATABASE_URL as an alias for DATABASE_URL
    if (!process.env.DATABASE_URL && process.env.SUPABASE_DATABASE_URL) {
        process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
    }
    if (process.env.DATABASE_URL) {
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
            /^(postgres(?:ql)?:\/\/[^:]+:)(.*)(@[^@]+)$/,
            (_m, prefix, password, hostPart) => {
                const encodedPassword = encodeURIComponent(decodeURIComponent(password));
                return `${prefix}${encodedPassword}${hostPart}`;
            }
        );
    }
}
loadEnv();

const masterPort = parseInt(process.env.PORT || '3000', 10);
const BACKEND_ENTRY = path.join(BACKEND_DIR, 'dist', 'main.js');
 
const DASHBOARD_DIR = path.join(rootDir, 'web-dashboard');
const AI_DIR = path.join(rootDir, 'ai-services');
 
const DOWNLOADS_DIR = path.join(rootDir, 'public', 'downloads');

// Lock file that ensures only ONE Passenger worker runs bootEngines().
// Scoped to rootDir so it's naturally per-deployment-version.
const BOOT_LOCK_FILE = path.join(rootDir, '.vultacore_boot.lock');
const ENGINE_STATE_FILE = path.join(rootDir, '.vultacore_state.json');

let BACK_PORT = 3001;
let DASH_PORT = 3002;
let AI_PORT = parseInt(process.env.AI_PORT || '8001', 10);
 
let bootLogs = [];
let runningChildren = [];

let isBackendReady = false;
let isDashboardReady = false;
let isAiReady = false;

let backendDependencyPromise = null;
let bootStarted = false;
let isProcessExiting = false;

function updateEngineState() {
    try {
        const state = {
            backendPort: BACK_PORT,
            dashboardPort: DASH_PORT,
            aiPort: AI_PORT,
            backendReady: isBackendReady,
            dashboardReady: isDashboardReady,
            aiReady: isAiReady,
            pid: process.pid,
            updatedAt: Date.now()
        };
        fs.writeFileSync(ENGINE_STATE_FILE, JSON.stringify(state));
    } catch (_) {}
}

function syncEngineState() {
    try {
        if (fs.existsSync(ENGINE_STATE_FILE)) {
            const raw = fs.readFileSync(ENGINE_STATE_FILE, 'utf8');
            const state = JSON.parse(raw);
            if (state) {
                if (state.backendPort) BACK_PORT = state.backendPort;
                if (state.dashboardPort) DASH_PORT = state.dashboardPort;
                if (state.aiPort) AI_PORT = state.aiPort;
                if (state.backendReady !== undefined) isBackendReady = state.backendReady;
                if (state.dashboardReady !== undefined) isDashboardReady = state.dashboardReady;
                if (state.aiReady !== undefined) isAiReady = state.aiReady;
                return state;
            }
        }
    } catch (_) {}
    return null;
}

function buildRuntimeEnv(extra = {}) {
    const nodeBinDir = process.execPath
        ? path.dirname(process.execPath)
        : null;

    const pathEntries = [
        nodeBinDir,
        '/opt/alt/python311/bin',
        '/opt/alt/python310/bin',
        '/opt/alt/python39/bin',
        '/opt/alt/alt-nodejs24/root/usr/bin',
        '/opt/alt/alt-nodejs22/root/usr/bin',
        '/opt/alt/alt-nodejs20/root/usr/bin',
        '/usr/local/bin',
        '/usr/bin',
        '/bin'
    ];

    if (process.env.PATH) {
        pathEntries.push(...process.env.PATH.split(path.delimiter));
    }

    let pyBin = null;
    const pyCandidates = [
        '/opt/alt/python311/bin/python3',
        '/opt/alt/python310/bin/python3',
        '/opt/alt/python39/bin/python3',
        '/usr/bin/python3',
        '/usr/local/bin/python3'
    ];
    for (const p of pyCandidates) {
        if (fs.existsSync(p)) {
            pyBin = p;
            break;
        }
    }

    return {
        ...process.env,
        ...(pyBin ? { PYTHON: pyBin, npm_config_python: pyBin } : {}),
        npm_config_build_from_source: 'true',
        ...extra,
        PATH: [
            ...new Set(pathEntries.filter(Boolean))
        ].join(path.delimiter)
    };
}


// ═══════════════════════════════════════════════════════════════════════════
// BOOT LOCK — ensures only one Passenger worker runs bootEngines()
// ═══════════════════════════════════════════════════════════════════════════

function tryAcquireBootLock() {
    try {
        if (fs.existsSync(BOOT_LOCK_FILE)) {
            const raw = fs.readFileSync(BOOT_LOCK_FILE, 'utf8').trim();
            const lockedPid = parseInt(raw, 10);
            if (lockedPid && lockedPid !== process.pid) {
                try {
                    // signal 0 = existence check only, no actual signal sent
                    process.kill(lockedPid, 0);
                    // PID is alive → another worker holds the lock
                    return false;
                } catch (_) {
                    // PID is dead → stale lock, take over
                }
            }
        }
        fs.writeFileSync(BOOT_LOCK_FILE, String(process.pid));
        return true;
    } catch (_) {
        return false;
    }
}

function releaseBootLock() {
    try {
        if (fs.existsSync(BOOT_LOCK_FILE)) {
            const raw = fs.readFileSync(BOOT_LOCK_FILE, 'utf8').trim();
            if (parseInt(raw, 10) === process.pid) {
                fs.unlinkSync(BOOT_LOCK_FILE);
            }
        }
    } catch (_) {}
}

// Clean up lock on all exit paths
process.on('exit', releaseBootLock);
process.on('SIGTERM', () => { releaseBootLock(); process.exit(0); });
process.on('SIGINT',  () => { releaseBootLock(); process.exit(0); });


// ═══════════════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════════════
 
function log(message) {
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
 
    bootLogs.push(line);
 
    if (bootLogs.length > 150) {
        bootLogs.shift();
    }
 
    console.log(line);
}
 
log('════════════════════════════════════════════════════════════');
log('VultaCore Master Proxy Booting...');
log(`Root directory: ${rootDir}`);
log(`Public port: ${masterPort}`);
log('════════════════════════════════════════════════════════════');
 
 
// ═══════════════════════════════════════════════════════════════════════════
// PORT HELPERS
// ═══════════════════════════════════════════════════════════════════════════
 
function checkTcpConnect(port, host = '127.0.0.1', timeout = 500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let finished = false;

        const finish = (value) => {
            if (finished) return;
            finished = true;
            try { socket.destroy(); } catch (_) {}
            resolve(value);
        };

        const timer = setTimeout(() => finish(false), timeout);

        socket.once('connect', () => {
            clearTimeout(timer);
            finish(true);
        });
        socket.once('error', () => {
            clearTimeout(timer);
            finish(false);
        });

        try {
            socket.connect(port, host);
        } catch (_) {
            clearTimeout(timer);
            finish(false);
        }
    });
}

async function isPortListening(port, timeout = 400) {
    if (!port) return false;
    // 1. Fast IPv4 TCP check
    if (await checkTcpConnect(port, '127.0.0.1', timeout)) return true;
    // 2. HTTP GET fallback
    if (await checkHttpHealth(port, '/', Math.max(timeout, 600))) return true;
    return false;
}

/**
 * Finds an available port starting at startPort, checking via non-destructive client connect.
 * NEVER creates a listening socket, completely preventing Linux kernel TIME_WAIT / EADDRINUSE collisions.
 */
async function findAvailablePort(startPort, exclude = []) {
    let port = startPort;
    while (exclude.includes(port) || (await isPortListening(port, 250))) {
        port++;
    }
    return port;
}

// Backward-compatible alias that never locks sockets
async function findFreePort(startPort = 3001, exclude = []) {
    return findAvailablePort(startPort, exclude);
}


function checkAiHealth(port, timeout = 2500) {
    if (!port) return Promise.resolve(false);
    return new Promise((resolve) => {
        let finished = false;
        const finish = (val) => {
            if (finished) return;
            finished = true;
            resolve(val);
        };

        const timer = setTimeout(() => {
            finish(false);
        }, timeout);

        try {
            const req = http.get(
                `http://127.0.0.1:${port}/`,
                (res) => {
                    clearTimeout(timer);
                    let data = '';
                    res.on('data', chunk => { data += chunk; });
                    res.on('end', () => {
                        finish(data.includes('AI Service Online') || data.includes('VultaCore') || res.statusCode === 200);
                    });
                }
            );
            req.on('error', () => {
                clearTimeout(timer);
                finish(false);
            });
        } catch (_) {
            clearTimeout(timer);
            finish(false);
        }
    });
}


function checkHttpHealth(port, path = '/', timeout = 2000) {
    if (!port) return Promise.resolve(false);
    return new Promise((resolve) => {
        let finished = false;
        const finish = (val) => {
            if (finished) return;
            finished = true;
            resolve(val);
        };

        const timer = setTimeout(() => {
            finish(false);
        }, timeout);

        try {
            const req = http.get(
                `http://127.0.0.1:${port}${path}`,
                (res) => {
                    clearTimeout(timer);
                    res.resume();
                    // Any HTTP status code below 500 confirms the server is accepting HTTP connections
                    finish(res.statusCode < 500);
                }
            );
            req.on('error', () => {
                clearTimeout(timer);
                finish(false);
            });
        } catch (_) {
            clearTimeout(timer);
            finish(false);
        }
    });
}


function waitForEngineReady(name, port, maxWaitMs = 60000) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        const check = async () => {
            let isReady = false;
            if (name === 'AI Engine') {
                isReady = await checkAiHealth(port, 2000);
            } else if (name === 'Dashboard') {
                isReady = await checkHttpHealth(port, '/', 2000);
            } else if (name === 'Backend') {
                isReady = (await checkHttpHealth(port, '/api/health', 2000)) || (await checkHttpHealth(port, '/', 2000));
            }

            if (isReady) {
                const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
                log(`✨ ${name} passed HTTP health check on port ${port} (${elapsed}s). Ready for traffic.`);
                if (name === 'Dashboard') isDashboardReady = true;
                if (name === 'Backend') isBackendReady = true;
                if (name === 'AI Engine') isAiReady = true;
                updateEngineState();
                resolve(true);
                return;
            }

            if (Date.now() - startTime > maxWaitMs) {
                log(`⚠️ ${name} on port ${port} did not pass HTTP health check within ${Math.round(maxWaitMs / 1000)}s.`);
                resolve(false);
                return;
            }
            setTimeout(check, 600);
        };
        check();
    });
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// BOOT PAGE
// ═══════════════════════════════════════════════════════════════════════════
 
function sendBooting(res) {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
    });
 
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="refresh" content="6">
<title>VultaCore — Starting</title>
 
<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}
 
body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #050a14;
    overflow: hidden;
    font-family: Segoe UI, system-ui, sans-serif;
}
 
.bg {
    position: fixed;
    border-radius: 50%;
    filter: blur(90px);
    opacity: .18;
}
 
.b1 {
    width: 500px;
    height: 500px;
    background: #7c3aed;
    top: -150px;
    left: -150px;
}
 
.b2 {
    width: 400px;
    height: 400px;
    background: #2563eb;
    bottom: -120px;
    right: -120px;
}
 
.b3 {
    width: 300px;
    height: 300px;
    background: #0ea5e9;
    top: 40%;
    left: 55%;
}
 
.wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
}
 
.stage {
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}
 
.ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(139,92,246,.4);
    animation: pulse 2.4s ease-in-out infinite;
}
 
.r1 {
    width: 130px;
    height: 130px;
}
 
.r2 {
    width: 170px;
    height: 170px;
    animation-delay: .5s;
}
 
.r3 {
    width: 210px;
    height: 210px;
    animation-delay: 1s;
}
 
.r4 {
    width: 250px;
    height: 250px;
    animation-delay: 1.5s;
}
 
.logo {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.12);
    box-shadow: 0 0 50px rgba(139,92,246,.4);
    animation: breathe 3s ease-in-out infinite;
}
 
.logo img {
    width: 54px;
    height: 54px;
    object-fit: contain;
}
 
.label {
    margin-top: 45px;
    color: rgba(255,255,255,.88);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: .06em;
}
 
.sub {
    margin-top: 8px;
    color: rgba(148,163,184,.7);
    font-size: .72rem;
    letter-spacing: .15em;
    text-transform: uppercase;
}
 
.dots {
    display: flex;
    gap: 6px;
    margin-top: 22px;
}
 
.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #7c3aed;
    animation: bounce 1.4s infinite;
}
 
.dot:nth-child(2) {
    animation-delay: .2s;
    background: #6366f1;
}
 
.dot:nth-child(3) {
    animation-delay: .4s;
    background: #3b82f6;
}
 
@keyframes pulse {
    0%,100% {
        transform: scale(.88);
        opacity: .9;
    }
 
    50% {
        transform: scale(1.05);
        opacity: .5;
    }
}
 
@keyframes breathe {
    0%,100% {
        transform: scale(1);
    }
 
    50% {
        transform: scale(1.06);
    }
}
 
@keyframes bounce {
    0%,80%,100% {
        transform: scale(.7);
        opacity: .5;
    }
 
    40% {
        transform: scale(1.2);
        opacity: 1;
    }
}
</style>
</head>
 
<body>
 
<div class="bg b1"></div>
<div class="bg b2"></div>
<div class="bg b3"></div>
 
<div class="wrapper">
 
    <div class="stage">
 
        <div class="ring r1"></div>
        <div class="ring r2"></div>
        <div class="ring r3"></div>
        <div class="ring r4"></div>
 
        <div class="logo">
            <img
                src="/logo.png"
                alt="VultaCore"
                onerror="this.style.display='none'"
            >
        </div>
 
    </div>
 
    <div class="label">VultaCore</div>
    <div class="sub">Initializing engines…</div>
 
    <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    </div>
 
</div>
 
</body>
</html>`);
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// HTTP PROXY
// ═══════════════════════════════════════════════════════════════════════════
 
function proxyRequest(req, res, targetPort) {
 
    const clientHost = req.headers.host || `127.0.0.1:${targetPort}`;
    const options = {
        hostname: '127.0.0.1',
        port: targetPort,
        path: req.url,
        method: req.method,
 
        headers: {
            ...req.headers,
            host: clientHost,
            'x-forwarded-host': clientHost,
            'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'https',
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }
    };
 
    const proxyReq = http.request(options, (proxyRes) => {
 
        res.writeHead(
            proxyRes.statusCode || 502,
            proxyRes.headers
        );
 
        proxyRes.pipe(res);
    });
 
    proxyReq.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
            if (targetPort === DASH_PORT) isDashboardReady = false;
            if (targetPort === BACK_PORT) isBackendReady = false;
            log(`ℹ️ Target port ${targetPort} temporarily unavailable (${error.code}).`);
        } else {
            log(`⚠️ Proxy error → ${error.message}`);
        }

        if (!res.headersSent) {
            const reqPath = (req.url || '').split('?')[0];
            const isApiReq = reqPath.startsWith('/api') || reqPath.startsWith('/socket.io');
            if (isApiReq) {
                res.writeHead(503, {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                });
                return res.end(JSON.stringify({
                    statusCode: 503,
                    error: 'Service Unavailable',
                    message: `Service on port ${targetPort} is currently restarting or reconnecting.`
                }));
            }
            sendBooting(res);
        }
    });

    req.pipe(proxyReq);
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════════════════════
 
function tryServeStatic(req, res) {
 
    let filePath = null;
 
    const cleanUrl = decodeURIComponent(
        req.url.split('?')[0]
    );
 
    if (cleanUrl.startsWith('/_next/static/')) {
 
        filePath = path.join(
            DASHBOARD_DIR,
            '.next',
            'static',
            cleanUrl.replace('/_next/static/', '')
        );
 
    } else if (
        /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|json)$/i.test(cleanUrl)
    ) {
 
        filePath = path.join(
            DASHBOARD_DIR,
            'public',
            cleanUrl
        );
    }
 
    if (!filePath) {
        return false;
    }
 
    const resolvedRoot = path.resolve(DASHBOARD_DIR);
    const resolvedFile = path.resolve(filePath);
 
    if (
        !resolvedFile.startsWith(resolvedRoot + path.sep) &&
        resolvedFile !== resolvedRoot
    ) {
        return false;
    }
 
    if (!fs.existsSync(resolvedFile)) {
        return false;
    }
 
    const ext = path.extname(resolvedFile).toLowerCase();
 
    const mime = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.json': 'application/json'
    };
 
    res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
    });
 
    fs.createReadStream(resolvedFile).pipe(res);
 
    return true;
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// DOWNLOADS
// ═══════════════════════════════════════════════════════════════════════════
 
function serveDownload(req, res) {
 
    const filename = decodeURIComponent(
        req.url
            .replace('/downloads/', '')
            .split('?')[0]
    );
 
    if (
        !filename ||
        filename.includes('..') ||
        filename.includes('/') ||
        filename.includes('\\')
    ) {
        res.writeHead(400);
        return res.end('Invalid filename');
    }
 
    const filePath = path.join(
        DOWNLOADS_DIR,
        filename
    );
 
    if (!fs.existsSync(filePath)) {
 
        res.writeHead(404, {
            'Content-Type': 'text/plain'
        });
 
        return res.end(
            `Installer not found: ${filename}`
        );
    }
 
    const stat = fs.statSync(filePath);
 
    const ext = path.extname(filename).toLowerCase();
 
    const mime = {
        '.deb': 'application/vnd.debian.binary-package',
        '.rpm': 'application/x-rpm',
        '.exe': 'application/x-msdownload',
        '.msi': 'application/x-msi',
        '.dmg': 'application/x-apple-diskimage',
        '.pkg': 'application/octet-stream',
        '.appimage': 'application/x-executable'
    };
 
    log(
        `⬇ Serving installer: ${filename} ` +
        `(${(stat.size / 1024 / 1024).toFixed(1)} MB)`
    );
 
    res.writeHead(200, {
 
        'Content-Type':
            mime[ext] || 'application/octet-stream',
 
        'Content-Disposition':
            `attachment; filename="${filename}"`,
 
        'Content-Length':
            stat.size,
 
        'Cache-Control':
            'public, max-age=86400'
    });
 
    fs.createReadStream(filePath).pipe(res);
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════════════════
 
const server = http.createServer(async (req, res) => {
 
    const requestPath = req.url.split('?')[0];
 
    // Downloads
    if (requestPath.startsWith('/downloads/')) {
        return serveDownload(req, res);
    }
 
    // Logs
    if (
        requestPath === '/logs' ||
        requestPath === '/_logs'
    ) {
 
        res.writeHead(200, {
            'Content-Type':
                'text/plain; charset=utf-8',
            'Cache-Control':
                'no-store'
        });
 
        return res.end(
            bootLogs.join('\n')
        );
    }
 
    // Health
    if (requestPath === '/health') {
 
        res.writeHead(200, {
            'Content-Type':
                'application/json',
            'Cache-Control':
                'no-store'
        });
 
        return res.end(
            JSON.stringify({
 
                status: 'up',
 
                ports: {
                    backend: BACK_PORT,
                    dashboard: DASH_PORT,
                    ai: AI_PORT
                },

                ready: {
                    backend: isBackendReady,
                    dashboard: isDashboardReady,
                    ai: isAiReady
                },

                backendEntry:
                    fs.existsSync(BACKEND_ENTRY),

                cookieParser:
                    checkCookieParser(),

                uptime:
                    process.uptime(),

                bootStarted

            })
        );
    }

    // Admin boot logs
    if (requestPath === '/api/boot-logs') {

        const hasErrors =
            bootLogs.some(
                line => line.includes('❌')
            );

        res.writeHead(200, {

            'Content-Type':
                'application/json',

            'Access-Control-Allow-Origin':
                '*',

            'Cache-Control':
                'no-store'
        });

        return res.end(
            JSON.stringify({

                logs: bootLogs,

                hasErrors,

                uptime:
                    process.uptime(),

                ports: {
                    backend: BACK_PORT,
                    dashboard: DASH_PORT,
                    ai: AI_PORT
                },

                ready: {
                    backend: isBackendReady,
                    dashboard: isDashboardReady,
                    ai: isAiReady
                },

                booted:
                    !!(isDashboardReady && isBackendReady),

                ts:
                    new Date().toISOString()

            })
        );
    }

    // Static assets
    if (tryServeStatic(req, res)) {
        return;
    }

    // Route API and socket.io to Backend, everything else to Dashboard
    const isApi =
        requestPath.startsWith('/api') ||
        requestPath.startsWith('/socket.io');

    // Sync state across Passenger workers
    syncEngineState();

    const targetPort = isApi ? (BACK_PORT || 3001) : (DASH_PORT || 3002);
    let targetReady = isApi ? isBackendReady : isDashboardReady;

    // Fast inline verification: if flag is false but target port is actually responding to HTTP, promote to ready!
    if (!targetReady && targetPort) {
        const ok = isApi
            ? ((await checkHttpHealth(targetPort, '/api/health', 350)) || (await checkHttpHealth(targetPort, '/', 350)))
            : (await checkHttpHealth(targetPort, '/', 350));
        if (ok) {
            if (isApi) isBackendReady = true;
            else isDashboardReady = true;
            targetReady = true;
            updateEngineState();
        }
    }

    // Hold request with bootloader until target service is confirmed ready
    if (!targetPort || !targetReady) {
        if (isApi) {
            res.writeHead(503, {
                'Content-Type': 'application/json',
                'Retry-After': '5',
                'Cache-Control': 'no-store'
            });
            return res.end(JSON.stringify({
                statusCode: 503,
                error: 'Service Unavailable',
                message: 'Backend API is initializing or database is reconnecting. Please retry shortly.',
                ready: false
            }));
        }
        return sendBooting(res);
    }

    proxyRequest(
        req,
        res,
        targetPort
    );
});

// Proxy WebSocket / Socket.io upgrades
server.on('upgrade', (req, clientSocket, head) => {
    const requestPath = req.url.split('?')[0];
    const isApi =
        requestPath.startsWith('/api') ||
        requestPath.startsWith('/socket.io');

    if (!isBackendReady || !isDashboardReady || !BACK_PORT || !DASH_PORT) {
        syncEngineState();
    }

    const targetPort = isApi ? (BACK_PORT || 3001) : (DASH_PORT || 3002);
    const targetReady = isApi ? isBackendReady : isDashboardReady;

    if (!targetPort || !targetReady) {
        clientSocket.destroy();
        return;
    }

    const proxySocket = net.connect(targetPort, '127.0.0.1', () => {
        proxySocket.write(
            `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
            Object.entries(req.headers)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('\r\n') +
            '\r\n\r\n'
        );
        if (head && head.length > 0) {
            proxySocket.write(head);
        }
        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);
    });

    proxySocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => proxySocket.destroy());
});
 
 
// ═══════════════════════════════════════════════════════════════════════════
// CHILD PROCESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
 
function killChildren() {
    isProcessExiting = true;
    for (const child of runningChildren) {
        try {
            child.kill('SIGTERM');
        } catch (_) {}
    }
}
 
process.on('exit', killChildren);
 
process.on('SIGINT', () => {
    killChildren();
    process.exit(0);
});
 
process.on('SIGTERM', () => {
    killChildren();
    process.exit(0);
});
 
 
// ═══════════════════════════════════════════════════════════════════════════
// BACKEND DEPENDENCY CHECK / AUTO INSTALL (cookie-parser + sqlite3)
// ═══════════════════════════════════════════════════════════════════════════
 
function checkCookieParser() {
 
    try {
 
        require.resolve(
            'cookie-parser',
            {
                paths: [BACKEND_DIR]
            }
        );
 
        return true;
 
    } catch (_) {
 
        return false;
 
    }
}
 
 
// TypeORM loads the sqlite3 driver relative to ITS OWN location. Logs show
// typeorm lives in <root>/node_modules, so sqlite3 must be installed there too,
// not only inside backend-api/node_modules.
function typeormProjectDir() {
 
    try {
 
        const pkg = require.resolve(
            'typeorm/package.json',
            {
                paths: [BACKEND_DIR]
            }
        );
 
        return path.resolve(
            path.dirname(pkg),
            '..',
            '..'
        );
 
    } catch (_) {
 
        return BACKEND_DIR;
    }
}
 
 
// sqlite3 is a native addon: actually load it instead of only resolving it.
// Try multiple search paths because on Hostinger the monorepo root node_modules
// is the canonical location, but typeorm resolution can vary.
function checkSqlite3() {
    const searchDirs = [
        rootDir,
        typeormProjectDir(),
        BACKEND_DIR
    ];

    for (const dir of [...new Set(searchDirs)]) {
        try {
            execSync(
                `"${process.execPath}" -e "require('sqlite3')"`,
                {
                    cwd: dir,
                    stdio: 'ignore',
                    timeout: 15000,
                    env: buildRuntimeEnv({
                        NODE_ENV: 'production'
                    })
                }
            );

            return true;

        } catch (_) {
            // try next dir
        }
    }

    return false;
}
 
 
function getBackendRequirements() {
    const dbUrl = process.env.DATABASE_URL || '';
    const isRemoteDb = dbUrl.startsWith('postgres://') ||
                       dbUrl.startsWith('postgresql://') ||
                       dbUrl.startsWith('mysql://') ||
                       dbUrl.startsWith('mariadb://');

    const reqs = [
        {
            name: 'cookie-parser',
            ok: checkCookieParser,
            dir: BACKEND_DIR
        }
    ];

    if (!isRemoteDb) {
        reqs.push({
            name: 'sqlite3',
            ok: checkSqlite3,
            dir: typeormProjectDir()
        });
    }

    return reqs;
}
 
 
function getNpmCandidates() {
 
    const candidates = [];
 
    // npm provided by Passenger / Hostinger
    if (process.env.npm_execpath) {
 
        candidates.push(
            process.env.npm_execpath
        );
    }
 
    // Common Hostinger Node paths
    candidates.push(
        '/opt/alt/alt-nodejs24/root/usr/bin/npm',
        '/opt/alt/alt-nodejs22/root/usr/bin/npm',
        '/opt/alt/alt-nodejs20/root/usr/bin/npm',
        '/usr/bin/npm',
        'npm'
    );
 
    return [
        ...new Set(
            candidates.filter(Boolean)
        )
    ];
}
 
 
async function ensureBackendDependencies() {
 
    if (backendDependencyPromise) {
        return backendDependencyPromise;
    }
 
    backendDependencyPromise = (async () => {
 
        if (!fs.existsSync(BACKEND_ENTRY)) {
 
            throw new Error(
                `Backend entry does not exist: ${BACKEND_ENTRY}`
            );
        }
 
        const missing =
            getBackendRequirements()
                .filter(requirement => !requirement.ok());
 
        // Everything already installed
        if (missing.length === 0) {
 
            log(
                '✅ Backend dependency check: ' +
                'all required packages are available.'
            );
 
            return true;
        }
 
        const missing_packages = missing.map(r => r.name).join(', ');
        log(`⚠️ Backend dependencies missing: ${missing_packages}. Attempting automatic recovery...`);

        const candidates =
            getNpmCandidates();
 
        for (const requirement of missing) {
 
            log(
                `⚠️ Backend dependency missing: ${requirement.name}`
            );
 
            log(
                '🔧 Attempting automatic npm installation...'
            );
 
            let installed = false;
            let lastError = null;
 
            for (const npmPath of candidates) {
 
                try {
 
                    log(
                        `📦 Trying npm: ${npmPath}`
                    );
 
                    let command;
 
                    // npm_execpath can point to npm-cli.js
                    if (
                        npmPath.endsWith('.js') &&
                        fs.existsSync(npmPath)
                    ) {
 
                        command =
                            `"${process.execPath}" "${npmPath}"`;
 
                    } else {
 
                        // Absolute path
                        if (
                            npmPath.startsWith('/') &&
                            !fs.existsSync(npmPath)
                        ) {
                            continue;
                        }
 
                        command =
                            `"${npmPath}"`;
                    }
 
                    if (requirement.name === 'sqlite3') {
                        log('🔨 Attempting npm rebuild sqlite3 --build-from-source for host OS...');
                        execSync(
                            `${command} rebuild sqlite3 --build-from-source`,
                            {
                                cwd: rootDir,
                                stdio: 'inherit',
                                timeout: 60000,
                                env: buildRuntimeEnv({
                                    NODE_ENV: 'production',
                                    npm_config_build_from_source: 'true',
                                    BUILD_FROM_SOURCE: '1'
                                })
                            }
                        );
                    } else {
                        execSync(
                            `${command} install ${requirement.name} ` +
                            `--save --no-audit --no-fund ` +
                            `--prefix "${requirement.dir}"`,
                            {
                                cwd: requirement.dir,
                                stdio: 'inherit',
                                timeout: 60000,
                                env: buildRuntimeEnv({
                                    NODE_ENV: 'production'
                                })
                            }
                        );
                    }

                    installed = true;
                    break;
 
                } catch (error) {
 
                    lastError = error;
 
                    log(
                        `⚠️ npm attempt failed: ${error.message}`
                    );
                }
            }
 
            if (!installed) {
                if (requirement.name === 'sqlite3') {
                    log('⚠️ sqlite3 native module could not be compiled at runtime.');
                    log('💡 Tip: Configure DATABASE_URL in .env (Hostinger MySQL or PostgreSQL) for zero-compilation stability.');
                } else {
                    throw new Error(
                        `Unable to automatically install ` +
                        `${requirement.name}. ` +
                        (lastError
                            ? `Last error: ${lastError.message}`
                            : 'npm was not found.')
                    );
                }
            }
        }
 
        log(
            '✅ Backend dependency repair complete.'
        );
 
        return true;
 
    })();
 
    try {
 
        return await backendDependencyPromise;
 
    } catch (error) {
 
        backendDependencyPromise = null;
 
        throw error;
    }
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// ZOMBIE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════
 
async function killZombieChildren() {

    // Proxy-only workers must NEVER kill any processes — they don't own the engines.
    if (fs.existsSync(BOOT_LOCK_FILE)) {
        try {
            const holderPid = parseInt(fs.readFileSync(BOOT_LOCK_FILE, 'utf8').trim(), 10);
            if (holderPid && holderPid !== process.pid) {
                let holderAlive = false;
                try { process.kill(holderPid, 0); holderAlive = true; } catch (_) {}
                if (holderAlive) {
                    log('🧹 Zombie Node/Dashboard cleanup complete.');
                    return; // another worker is alive and owns the engines
                }
            }
        } catch (_) {}
    }

    // Use TCP listening check (not HTTP) so we don't kill engines that are
    // still initialising and haven't started serving HTTP yet.
    const isBackListening = await isPortListening(3001, 800);
    const isDashListening = await isPortListening(3002, 800);

    if (isBackListening && isDashListening) {
        log('ℹ️ Dashboard and Backend are already listening. Skipping process termination.');
        return;
    }

    const targets = [];
    if (!isBackListening) targets.push(path.join(BACKEND_DIR, 'dist', 'main.js'));
    if (!isDashListening) {
        targets.push('web-dashboard/server.js');
        targets.push('standalone.*server.js');
    }

    for (const target of targets) {

        try {

            execSync(
                `pkill -f "${target}" 2>/dev/null || true`,
                {
                    shell: true,
                    stdio: 'ignore',
                    timeout: 3000
                }
            );

        } catch (_) {}
    }

    log(
        '🧹 Zombie Node/Dashboard cleanup complete.'
    );
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// ENGINE SPAWNER
// ═══════════════════════════════════════════════════════════════════════════
 
function startEngine(
    name,
    execBin,
    execArgs,
    port,
    cwd,
    envExtra = {},
    delay = 0,
    retries = 0
) {
 
    const MAX_RETRIES = 8;
    const BASE_DELAY = 5000;
 
    setTimeout(async () => {
 
        try {
 
            // Absolute executable check
            if (
                execBin.startsWith('/') &&
                !fs.existsSync(execBin)
            ) {
 
                log(
                    `❌ ${name}: executable not found → ${execBin}`
                );
 
                return;
            }
 
            // CRITICAL:
            // If something is already serving the port,
            // don't start a second copy.
            if (
                await isPortListening(port)
            ) {
 
                log(
                    `ℹ️ ${name}: port ${port} is already ` +
                    `serving. Duplicate start skipped.`
                );
 
                return;
            }
 
            log(
                `📡 Starting ${name} on port ${port} ` +
                `(attempt ${retries + 1}/${MAX_RETRIES})`
            );
 
            const child = spawn(
                execBin,
                execArgs,
                {
 
                    cwd:
                        cwd || rootDir,
 
                    env: buildRuntimeEnv({
                        PORT:
                            String(port),
 
                        NODE_ENV:
                            'production',
 
                        ...envExtra
                    }),
 
                    shell: false,
 
                    stdio: [
                        'ignore',
                        'pipe',
                        'pipe'
                    ]
                }
            );
 
            runningChildren.push(child);
 
            child.stdout.on(
                'data',
                data => {
 
                    const text =
                        data.toString().trim();
 
                    if (text) {
                        log(
                            `[${name}] ${text}`
                        );

                        // Fast inline health check trigger on engine startup confirmation
                        if (name === 'Backend' && (text.includes('Application is running on') || text.includes('Nest application successfully started'))) {
                            checkHttpHealth(port, '/api/health', 1500).then(ok => {
                                if (ok && !isBackendReady) {
                                    isBackendReady = true;
                                    log(`✨ Backend passed HTTP health check on port ${port}.`);
                                    updateEngineState();
                                }
                            });
                        }
                        if (name === 'Dashboard' && text.includes('Ready in')) {
                            checkHttpHealth(port, '/', 1500).then(ok => {
                                if (ok && !isDashboardReady) {
                                    isDashboardReady = true;
                                    log(`✨ Dashboard passed HTTP health check on port ${port}.`);
                                    updateEngineState();
                                }
                            });
                        }
                        if (name === 'AI Engine' && (text.includes('Application startup complete') || text.includes('Uvicorn running on'))) {
                            checkAiHealth(port, 1500).then(ok => {
                                if (ok && !isAiReady) {
                                    isAiReady = true;
                                    log(`✨ AI Engine passed HTTP health check on port ${port}.`);
                                    updateEngineState();
                                }
                            });
                        }

                        if (text.includes('ER_DBACCESS_DENIED_ERROR') || (text.includes('Access denied') && text.includes("'Database'"))) {
                            log('🛑 DATABASE CONFIG ERROR: MySQL rejected connection to database "Database"!');
                            log('👉 The word "Database" in your DATABASE_URL is an unreplaced placeholder.');
                            log('👉 On Hostinger, database names always include your account prefix (e.g. u879979656_dbname).');
                            log('👉 Please update DATABASE_URL in Hostinger Environment Variables with your actual database name.');
                        }
                    }
                }
            );
 
            child.stderr.on(
                'data',
                data => {

                    const text =
                        data.toString().trim();

                    if (text) {
                        log(
                            `[${name}] ${text}`
                        );

                        if (name === 'AI Engine' && (text.includes('Application startup complete') || text.includes('Uvicorn running on'))) {
                            checkAiHealth(port, 1500).then(ok => {
                                if (ok && !isAiReady) {
                                    isAiReady = true;
                                    log(`✨ AI Engine passed HTTP health check on port ${port}.`);
                                    updateEngineState();
                                }
                            });
                        }

                        if (text.includes('ER_DBACCESS_DENIED_ERROR') || (text.includes('Access denied') && text.includes("'Database'"))) {
                            log('🛑 DATABASE CONFIG ERROR: MySQL rejected connection to database "Database"!');
                            log('👉 The word "Database" in your DATABASE_URL is an unreplaced placeholder.');
                            log('👉 On Hostinger, database names always include your account prefix (e.g. u879979656_dbname).');
                            log('👉 Please update DATABASE_URL in Hostinger Environment Variables with your actual database name.');
                        }
                    }
                }
            );
 
            child.on(
                'error',
                error => {

                    log(
                        `❌ [${name}] spawn error: ` +
                        error.message
                    );
                }
            );
 
            child.on(
                'exit',
                async (code, signal) => {

                    if (name === 'Dashboard') isDashboardReady = false;
                    if (name === 'Backend') isBackendReady = false;
                    if (name === 'AI Engine') isAiReady = false;
                    updateEngineState();

                    const index =
                        runningChildren.indexOf(child);

                    if (index !== -1) {

                        runningChildren.splice(
                            index,
                            1
                        );
                    }

                    if (isProcessExiting) {
                        log(`ℹ️ ${name} stopped as master proxy is shutting down (${code}/${signal}).`);
                        return;
                    }

                    if (
                        signal === 'SIGTERM' ||
                        signal === 'SIGKILL'
                    ) {
                        log(
                            `⚠️ ${name} received ${signal} (code ${code}). ` +
                            `Auto-restarting in 3 seconds...`
                        );

                        setTimeout(
                            () => {
                                startEngine(
                                    name,
                                    execBin,
                                    execArgs,
                                    port,
                                    cwd,
                                    envExtra,
                                    0,
                                    0
                                );
                                waitForEngineReady(name, port).then(ok => {
                                    if (ok) {
                                        if (name === 'Dashboard') isDashboardReady = true;
                                        if (name === 'Backend') isBackendReady = true;
                                        if (name === 'AI Engine') isAiReady = true;
                                        updateEngineState();
                                    }
                                });
                            },
                            3000
                        );

                        return;
                    }

                    if (code === 0) {

                        log(
                            `🔄 ${name} exited normally. ` +
                            `Restarting in 5 seconds...`
                        );

                        setTimeout(
                            () => {
                                startEngine(
                                    name,
                                    execBin,
                                    execArgs,
                                    port,
                                    cwd,
                                    envExtra,
                                    0,
                                    0
                                );
                                waitForEngineReady(name, port).then(ok => {
                                    if (ok) {
                                        if (name === 'Dashboard') isDashboardReady = true;
                                        if (name === 'Backend') isBackendReady = true;
                                        if (name === 'AI Engine') isAiReady = true;
                                        updateEngineState();
                                    }
                                });
                            },
                            BASE_DELAY
                        );

                        return;
                    }

                    // Special recovery for Dashboard if port binding failed (EADDRINUSE / exit 1)
                    if (name === 'Dashboard' && code === 1) {
                        try {
                            const newPort = await findAvailablePort(DASH_PORT + 1, [masterPort, BACK_PORT, AI_PORT]);
                            log(
                                `⚠️ Dashboard port ${port} was in-use/refused (exit ${code}). ` +
                                `Switching to dynamically allocated free port ${newPort}...`
                            );
                            port = newPort;
                            DASH_PORT = newPort;
                            updateEngineState();
                            const newEnv = Object.assign({}, envExtra, { PORT: String(newPort) });
                            setTimeout(() => {
                                startEngine(name, execBin, execArgs, newPort, cwd, newEnv, 0, retries + 1);
                                waitForEngineReady(name, newPort).then(ok => {
                                    if (ok) {
                                        isDashboardReady = true;
                                        updateEngineState();
                                    }
                                });
                            }, 1500);
                            return;
                        } catch (_) {}
                    }

                    // Special recovery for AI Engine if port binding failed (Errno 98 / exit 3 / exit 1)
                    if (name === 'AI Engine' && (code === 3 || code === 1)) {
                        try {
                            const newPort = await findAvailablePort(AI_PORT + 1, [masterPort, BACK_PORT, DASH_PORT]);
                            log(
                                `⚠️ AI Engine port ${port} was in-use/refused (exit ${code}). ` +
                                `Switching to dynamically allocated free port ${newPort}...`
                            );
                            port = newPort;
                            AI_PORT = newPort;
                            updateEngineState();
                            const py = resolvePython();
                            const newArgs = py ? py.args(newPort) : execArgs;
                            setTimeout(() => {
                                startEngine(name, execBin, newArgs, newPort, cwd, envExtra, 0, retries + 1);
                                waitForEngineReady(name, newPort).then(ok => {
                                    if (ok) {
                                        isAiReady = true;
                                        updateEngineState();
                                    }
                                });
                            }, 1500);
                            return;
                        } catch (_) {}
                    }

                    const newRetries =
                        retries + 1;

                    if (
                        newRetries >= MAX_RETRIES
                    ) {

                        log(
                            `🛑 ${name} crashed ` +
                            `${MAX_RETRIES} times. ` +
                            `Giving up.`
                        );

                        return;
                    }

                    const backoff =
                        Math.min(
                            BASE_DELAY *
                            Math.pow(2, retries),
                            300000
                        );

                    log(
                        `⚠️ ${name} crashed ` +
                        `(exit ${code}). ` +
                        `Retrying in ` +
                        `${Math.round(backoff / 1000)}s...`
                    );

                    setTimeout(
                        () => {
                            startEngine(
                                name,
                                execBin,
                                execArgs,
                                port,
                                cwd,
                                envExtra,
                                0,
                                newRetries
                            );
                            waitForEngineReady(name, port).then(ok => {
                                if (ok) {
                                    if (name === 'Dashboard') isDashboardReady = true;
                                    if (name === 'Backend') isBackendReady = true;
                                    if (name === 'AI Engine') isAiReady = true;
                                    updateEngineState();
                                }
                            });
                        },
                        backoff
                    );
                }
            );
 
        } catch (error) {
 
            log(
                `❌ ${name} startup exception: ` +
                error.message
            );
 
        }
 
    }, delay);
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// PYTHON
// ═══════════════════════════════════════════════════════════════════════════
 
function findSystemPython() {
 
    const candidates = [
 
        '/opt/alt/python311/bin/python3',
        '/opt/alt/python310/bin/python3',
        '/opt/alt/python39/bin/python3',
 
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/bin/python3',
 
        'python3',
        'python'
 
    ];
 
    for (const candidate of candidates) {
 
        try {
 
            let executable = candidate;
 
            if (
                !candidate.startsWith('/')
            ) {
 
                executable =
                    execSync(
                        `which ${candidate} 2>/dev/null`,
                        {
                            encoding: 'utf8',
                            env: buildRuntimeEnv()
                        }
                    ).trim();
            }
 
            if (!executable) {
                continue;
            }
 
            if (
                executable.startsWith('/') &&
                !fs.existsSync(executable)
            ) {
                continue;
            }
 
            execSync(
                `"${executable}" --version`,
                {
                    stdio: 'ignore',
                    env: buildRuntimeEnv()
                }
            );
 
            return executable;
 
        } catch (_) {}
    }
 
    return null;
}
 
 
function resolvePython() {
 
    const venvPython3 =
        path.join(
            AI_DIR,
            'venv',
            'bin',
            'python3'
        );
 
    const venvPython =
        path.join(
            AI_DIR,
            'venv',
            'bin',
            'python'
        );
 
    if (fs.existsSync(venvPython3)) {
 
        log(
            `AI Engine: using virtualenv → ${venvPython3}`
        );
 
        return {
 
            bin: venvPython3,
 
            args: port => [
                '-m',
                'uvicorn',
                'main:app',
                '--host',
                '127.0.0.1',
                '--port',
                String(port)
            ],
 
            env: {}
        };
    }
 
    if (fs.existsSync(venvPython)) {
 
        log(
            `AI Engine: using virtualenv → ${venvPython}`
        );
 
        return {
 
            bin: venvPython,
 
            args: port => [
                '-m',
                'uvicorn',
                'main:app',
                '--host',
                '127.0.0.1',
                '--port',
                String(port)
            ],
 
            env: {}
        };
    }
 
    const python =
        findSystemPython();
 
    if (!python) {
 
        log(
            '❌ AI Engine: Python 3 not found.'
        );
 
        return null;
    }
 
    log(
        `AI Engine: resolved Python → ${python}`
    );
 
    const packages =
        path.join(
            AI_DIR,
            '.python_packages'
        );
 
    const required = [
 
        'uvicorn',
        'fastapi',
        'httpx',
        'python-dotenv',
        'pydantic',
        'google-genai',
        'groq',
        'openai',
        'anthropic'
 
    ];
 
    const importName = packageName => {
 
        if (
            packageName === 'google-genai'
        ) {
            return 'google.genai';
        }
 
        if (
            packageName === 'python-dotenv'
        ) {
            return 'dotenv';
        }
 
        return packageName
            .replace(/-/g, '_');
    };
 
    const missing = [];
 
    for (const pkg of required) {
 
        try {
 
            execSync(
 
                `"${python}" -c "import ${importName(pkg)}"`,
 
                {
                    stdio: 'ignore',
                    env: buildRuntimeEnv({
                        PYTHONPATH: fs.existsSync(packages)
                            ? packages
                            : ''
                    })
                }
 
            );
 
        } catch (_) {
 
            missing.push(pkg);
        }
    }
 
    if (missing.length > 0) {
 
        const lock =
            path.join(
                packages,
                '.pip_installing.lock'
            );
 
        if (
            fs.existsSync(lock)
        ) {
 
            log(
                'ℹ️ AI Engine: another process ' +
                'is already installing Python packages.'
            );
 
        } else {
 
            try {
 
                fs.mkdirSync(
                    packages,
                    {
                        recursive: true
                    }
                );
 
                fs.writeFileSync(
                    lock,
                    String(process.pid)
                );
 
                log(
                    `📦 AI Engine: installing ` +
                    `${missing.join(', ')}`
                );
 
                execSync(
 
                    `"${python}" -m pip install ` +
                    `--quiet --target="${packages}" ` +
                    missing.join(' '),
 
                    {
                        stdio: 'inherit',
                        timeout: 180000,
                        env: buildRuntimeEnv({
                            PYTHONPATH: fs.existsSync(packages)
                                ? packages
                                : ''
                        })
                    }
                );
 
                try {
                    fs.unlinkSync(lock);
                } catch (_) {}
 
                log(
                    '✅ AI Engine Python packages installed.'
                );
 
            } catch (error) {
 
                try {
                    fs.unlinkSync(lock);
                } catch (_) {}
 
                log(
                    `⚠️ Python package installation failed: ` +
                    error.message
                );
            }
        }
    } else {
 
        log(
            'AI Engine: Python packages available.'
        );
    }
 
    return {
 
        bin: python,
 
        args: port => [
 
            '-m',
            'uvicorn',
            'main:app',
            '--host',
            '127.0.0.1',
            '--port',
            String(port)
 
        ],
 
        env: {
 
            PYTHONPATH:
                fs.existsSync(packages)
                    ? packages
                    : ''
        }
    };
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// OLLAMA
// ═══════════════════════════════════════════════════════════════════════════
 
async function ensureOllama() {
 
    const home =
        process.env.HOME || '';
 
    const isHostinger =
        home.startsWith('/home/u');
 
    const cloud =
        isHostinger ||
        process.env.PASSENGER_APP_ENV ||
        process.env.HOSTINGER ||
        process.env.RENDER ||
        process.env.RAILWAY_ENVIRONMENT ||
        process.env.VERCEL ||
        process.env.CLOUD_ENV;
 
    if (
        cloud &&
        process.env.ENABLE_OLLAMA !== 'true'
    ) {
 
        log(
            '☁️ Cloud/Hostinger detected. ' +
            'Skipping Ollama.'
        );
 
        return;
    }
 
    try {
 
        execSync(
            'ollama --version',
            {
                stdio: 'ignore'
            }
        );
 
        log(
            '✅ Ollama detected.'
        );
 
    } catch (_) {
 
        log(
            'ℹ️ Ollama not available. ' +
            'Continuing without Ollama.'
        );
    }
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE DASHBOARD DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════

function findStandaloneServer() {
    const directA = path.join(
        DASHBOARD_DIR,
        '.next',
        'standalone',
        'web-dashboard',
        'server.js'
    );
    if (fs.existsSync(directA)) return directA;

    const directB = path.join(
        DASHBOARD_DIR,
        '.next',
        'standalone',
        'server.js'
    );
    if (fs.existsSync(directB)) return directB;

    const standaloneDir = path.join(DASHBOARD_DIR, '.next', 'standalone');
    if (!fs.existsSync(standaloneDir)) return null;

    function searchDir(current, depth = 0) {
        if (depth > 12) return null;
        try {
            const entries = fs.readdirSync(current, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name === 'server.js') {
                    return path.join(current, entry.name);
                }
            }
            for (const entry of entries) {
                if (
                    entry.isDirectory() &&
                    entry.name !== 'node_modules' &&
                    !entry.name.startsWith('.')
                ) {
                    const found = searchDir(
                        path.join(current, entry.name),
                        depth + 1
                    );
                    if (found) return found;
                }
            }
        } catch (_) {}
        return null;
    }

    return searchDir(standaloneDir);
}


// ═══════════════════════════════════════════════════════════════════════════
// ENGINE BOOT
// ═══════════════════════════════════════════════════════════════════════════

async function bootEngines() {

    // ── Cross-worker guard ──────────────────────────────────────────────────
    // Passenger spawns 4+ independent server.js worker processes. Only ONE
    // should manage the engine child processes; the others act as pure proxies.
    if (!tryAcquireBootLock()) {
        syncEngineState();
        try {
            const holderPid = fs.readFileSync(BOOT_LOCK_FILE, 'utf8').trim();
            log(
                `ℹ️ Worker PID ${holderPid} is managing the engines. ` +
                `This worker (PID ${process.pid}) will proxy only (Dashboard:${DASH_PORT}, Backend:${BACK_PORT}).`
            );
        } catch (_) {
            log(`ℹ️ Another worker is managing the engines. This worker will proxy only (Dashboard:${DASH_PORT}, Backend:${BACK_PORT}).`);
        }
        return;
    }

    if (bootStarted) {
        log(
            'ℹ️ Engine boot already started. ' +
            'Skipping duplicate boot.'
        );
        return;
    }

    bootStarted = true;

    log(
        '🚀 Starting VultaCore engines...'
    );

    try {
        const exclude = [masterPort];

        // Check if preferred Dashboard port (3002) is already running and healthy
        if (await checkHttpHealth(3002, '/')) {
            DASH_PORT = 3002;
            isDashboardReady = true;
            log(`ℹ️ Dashboard is already running and healthy on port ${DASH_PORT}. Reusing existing process.`);
        } else {
            DASH_PORT = await findAvailablePort(3002, exclude);
        }
        exclude.push(DASH_PORT);

        // Check if preferred Backend port (3001) is already running and healthy
        if (await checkHttpHealth(3001, '/')) {
            BACK_PORT = 3001;
            isBackendReady = true;
            log(`ℹ️ Backend is already running and healthy on port ${BACK_PORT}. Reusing existing process.`);
        } else {
            BACK_PORT = await findAvailablePort(3001, exclude);
        }
        exclude.push(BACK_PORT);

        // Check if preferred AI_PORT (8001) is already serving our engine or is free to bind
        const preferredAiPort = parseInt(
            process.env.AI_PORT || '8001',
            10
        );

        if (await checkAiHealth(preferredAiPort)) {
            AI_PORT = preferredAiPort;
            isAiReady = true;
            log(`ℹ️ AI Engine is already running and healthy on port ${AI_PORT}. Reusing.`);
        } else if (await isPortListening(preferredAiPort, 300)) {
            // Port is in use: try killing orphaned uvicorn process owned by this user
            try {
                execSync('pkill -f "uvicorn main:app" 2>/dev/null || true', { stdio: 'ignore', timeout: 2000 });
                await new Promise(r => setTimeout(r, 600));
            } catch (_) {}

            if (!(await isPortListening(preferredAiPort, 300)) && !exclude.includes(preferredAiPort)) {
                AI_PORT = preferredAiPort;
                log(`🧹 Cleaned up orphaned AI Engine process on port ${preferredAiPort}.`);
            } else {
                AI_PORT = await findAvailablePort(8002, exclude);
                log(`⚠️ Preferred port ${preferredAiPort} is in use by another service on this host.`);
                log(`✨ Dynamically allocated free port ${AI_PORT} for AI Engine.`);
            }
        } else {
            AI_PORT = exclude.includes(preferredAiPort) ? await findAvailablePort(8002, exclude) : preferredAiPort;
        }
        exclude.push(AI_PORT);

        log(
            `Allocated ports: ` +
            `Backend=${BACK_PORT}, ` +
            `Dashboard=${DASH_PORT}, ` +
            `AI=${AI_PORT}`
        );
        updateEngineState();

    } catch (error) {
        log(
            `❌ Port allocation failed: ` +
            error.message
        );
        return;
    }


    // ═══════════════════════════════════════════════════════════════════════
    // AI
    // ═══════════════════════════════════════════════════════════════════════

    const python = resolvePython();

    if (python) {
        if (!isAiReady) {
            startEngine(
                'AI Engine',
                python.bin,
                python.args(AI_PORT),
                AI_PORT,
                AI_DIR,
                python.env || {},
                0
            );

            waitForEngineReady('AI Engine', AI_PORT).then(ok => {
                if (ok) {
                    isAiReady = true;
                    updateEngineState();
                }
            });
        }
    } else {
        log(
            '⚠️ AI Engine skipped because Python is unavailable.'
        );
    }


    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════

    if (isDashboardReady) {
        log(
            `ℹ️ Dashboard is already active and healthy on port ${DASH_PORT}. Skipping duplicate start.`
        );
    } else {
        const standaloneServer = findStandaloneServer();

        const nextLocal =
            path.join(
                DASHBOARD_DIR,
                'node_modules',
                'next',
                'dist',
                'bin',
                'next'
            );

        const nextRoot =
            path.join(
                rootDir,
                'node_modules',
                'next',
                'dist',
                'bin',
                'next'
            );

        const nextBin =
            fs.existsSync(nextLocal)
                ? nextLocal
                : nextRoot;

        if (standaloneServer) {
            log(
                `🚀 Starting Next.js standalone Dashboard → ${standaloneServer}`
            );

            startEngine(
                'Dashboard',
                process.execPath,
                [standaloneServer],
                DASH_PORT,
                path.dirname(standaloneServer),
                {
                    HOSTNAME: '127.0.0.1'
                },
                200
            );

        } else {
            const buildIdPath = path.join(DASHBOARD_DIR, '.next', 'BUILD_ID');

            if (fs.existsSync(buildIdPath) && fs.existsSync(nextBin)) {
                log(
                    '🚀 Starting Next.js production server (next start)...'
                );

                startEngine(
                    'Dashboard',
                    process.execPath,
                    [
                        nextBin,
                        'start',
                        '-p',
                        String(DASH_PORT)
                    ],
                    DASH_PORT,
                    DASHBOARD_DIR,
                    {
                        HOSTNAME: '127.0.0.1'
                    },
                    200
                );

            } else if (fs.existsSync(nextBin)) {
                log(
                    '⚠️ Next.js production build not found. Starting Next.js dev server as fallback...'
                );

                startEngine(
                    'Dashboard',
                    process.execPath,
                    [
                        nextBin,
                        'dev',
                        '-p',
                        String(DASH_PORT)
                    ],
                    DASH_PORT,
                    DASHBOARD_DIR,
                    {
                        HOSTNAME: '127.0.0.1'
                    },
                    200
                );

            } else {
                log(
                    '❌ Next.js binary not found. Dashboard cannot start.'
                );
            }
        }

        waitForEngineReady('Dashboard', DASH_PORT).then(ok => {
            if (ok) {
                isDashboardReady = true;
                updateEngineState();
            }
        });
    }


    // ═══════════════════════════════════════════════════════════════════════
    // BACKEND
    // ═══════════════════════════════════════════════════════════════════════

    if (isBackendReady) {
        log(
            `ℹ️ Backend is already active and healthy on port ${BACK_PORT}. Skipping duplicate start.`
        );
    } else {
        try {
            log(
                '🔍 Checking backend dependencies...'
            );

            await ensureBackendDependencies();

            log(
                '🚀 Starting NestJS Backend...'
            );

            startEngine(
                'Backend',
                process.execPath,
                [BACKEND_ENTRY],
                BACK_PORT,
                BACKEND_DIR,
                {
                    AI_SERVICE_URL:
                        `http://127.0.0.1:${AI_PORT}`
                },
                500
            );

            waitForEngineReady('Backend', BACK_PORT).then(ok => {
                if (ok) {
                    isBackendReady = true;
                    updateEngineState();
                }
            });

        } catch (error) {
            log(
                `❌ Backend dependency setup failed: ` +
                error.message
            );
            log(
                '🛑 Backend was NOT started.'
            );
            log(
                'Open /logs to see the exact npm error.'
            );
        }
    }

    log(
        '════════════════════════════════════════'
    );
    log(
        '✅ Engine boot sequence initiated.'
    );
    log(
        `Backend port:    ${BACK_PORT}`
    );
    log(
        `Dashboard port:  ${DASH_PORT}`
    );
    log(
        `AI Engine port:  ${AI_PORT}`
    );
    log(
        '════════════════════════════════════════'
    );
}
 
 
// ═══════════════════════════════════════════════════════════════════════════
// SUPERVISOR WATCHDOG (MULTI-WORKER RESILIENCE)
// ═══════════════════════════════════════════════════════════════════════════

function runSupervisorWatchdog() {
    setInterval(async () => {
        if (isProcessExiting) return;

        // 1. Sync state across workers
        syncEngineState();

        // 2. Check if the boot lock holder is alive
        let isManagerAlive = false;
        let holderPid = null;
        try {
            if (fs.existsSync(BOOT_LOCK_FILE)) {
                holderPid = parseInt(fs.readFileSync(BOOT_LOCK_FILE, 'utf8').trim(), 10);
                if (holderPid === process.pid) {
                    isManagerAlive = true;
                } else if (holderPid) {
                    try { process.kill(holderPid, 0); isManagerAlive = true; } catch (_) {}
                }
            }
        } catch (_) {}

        // If the managing worker died, this worker acquires the lock and restores engines
        if (!isManagerAlive) {
            log(`⚠️ Engine manager (PID ${holderPid || 'none'}) is inactive. Worker PID ${process.pid} is claiming boot lock.`);
            releaseBootLock();
            if (tryAcquireBootLock()) {
                bootStarted = false;
                await bootEngines();
                return;
            }
        }

        // 3. Fast non-intrusive HTTP health checks to keep state fresh
        if (DASH_PORT) {
            const ok = await checkHttpHealth(DASH_PORT, '/', 1500);
            if (ok !== isDashboardReady) {
                isDashboardReady = ok;
                updateEngineState();
            }
        }
        if (BACK_PORT) {
            const ok = (await checkHttpHealth(BACK_PORT, '/api/health', 1500)) || (await checkHttpHealth(BACK_PORT, '/', 1500));
            if (ok !== isBackendReady) {
                isBackendReady = ok;
                updateEngineState();
            }
        }
        if (AI_PORT) {
            const ok = await checkAiHealth(AI_PORT, 2000);
            if (ok !== isAiReady) {
                isAiReady = ok;
                updateEngineState();
            }
        }
    }, 6000);
}


// ═══════════════════════════════════════════════════════════════════════════
// START MASTER SERVER
// ═══════════════════════════════════════════════════════════════════════════
 
server.listen(
    masterPort,
    '0.0.0.0',
    () => {
 
        log(
            `✨ Master Proxy listening on ${masterPort}`
        );
 
        // Give Passenger a moment before spawning children.
        setTimeout(async () => {
 
            try {

                // Cleanup only dead/zombie processes, protecting active healthy ones
                await killZombieChildren();
 
                await ensureOllama();
 
                await bootEngines();

                // Start background supervisor watchdog
                runSupervisorWatchdog();
 
            } catch (error) {
 
                log(
                    `❌ Boot failure: ${error.message}`
                );
            }
 
        }, 1000);
    }
);
 
 
server.on(
    'error',
    error => {
 
        log(
            `❌ Master server error: ${error.message}`
        );
 
        process.exit(1);
    }
);
