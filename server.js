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
const masterPort = parseInt(process.env.PORT || '3000', 10);
 
const BACKEND_DIR = path.join(rootDir, 'backend-api');
const BACKEND_ENTRY = path.join(BACKEND_DIR, 'dist', 'main.js');
 
const DASHBOARD_DIR = path.join(rootDir, 'web-dashboard');
const AI_DIR = path.join(rootDir, 'ai-services');
 
const DOWNLOADS_DIR = path.join(rootDir, 'public', 'downloads');
 
let BACK_PORT = null;
let DASH_PORT = null;
let AI_PORT = parseInt(process.env.AI_PORT || '8001', 10);
 
let bootLogs = [];
let runningChildren = [];

let isBackendReady = false;
let isDashboardReady = false;
let isAiReady = false;

let backendDependencyPromise = null;
let bootStarted = false;

function buildRuntimeEnv(extra = {}) {
    const nodeBinDir = process.execPath
        ? path.dirname(process.execPath)
        : null;

    const pathEntries = [
        nodeBinDir,
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

    return {
        ...process.env,
        ...extra,
        PATH: [
            ...new Set(pathEntries.filter(Boolean))
        ].join(path.delimiter)
    };
}


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
 
function isPortListening(port, timeout = 400) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let finished = false;

        const finish = (value) => {
            if (finished) return;
            finished = true;

            try {
                socket.destroy();
            } catch (_) {}

            resolve(value);
        };

        socket.setTimeout(timeout);
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
        socket.once('timeout', () => finish(false));

        try {
            socket.connect(port, '127.0.0.1');
        } catch (_) {
            finish(false);
        }
    });
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


function checkAiHealth(port, timeout = 1500) {
    return new Promise((resolve) => {
        const req = http.get(
            `http://127.0.0.1:${port}/`,
            { timeout },
            (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    resolve(data.includes('AI Service Online') || data.includes('VultaCore'));
                });
            }
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}


function waitForEngineReady(name, port, maxWaitMs = 60000) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        const check = async () => {
            const listening = await isPortListening(port, 800);
            if (listening) {
                log(`✨ ${name} is ready and listening on port ${port} (${Math.round((Date.now() - startTime) / 100) / 10}s).`);
                resolve(true);
                return;
            }
            if (Date.now() - startTime > maxWaitMs) {
                log(`⚠️ ${name} on port ${port} did not report ready within ${Math.round(maxWaitMs / 1000)}s.`);
                resolve(false);
                return;
            }
            setTimeout(check, 800);
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
 
    const options = {
        hostname: '127.0.0.1',
        port: targetPort,
        path: req.url,
        method: req.method,
 
        headers: {
            ...req.headers,
            host: `127.0.0.1:${targetPort}`
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
            log(`ℹ️ Target port ${targetPort} temporarily unavailable (${error.code}). Serving bootloader.`);
        } else {
            log(`⚠️ Proxy error → ${error.message}`);
        }

        if (!res.headersSent) {
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
 
const server = http.createServer((req, res) => {
 
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

    const targetPort = isApi ? BACK_PORT : DASH_PORT;
    const targetReady = isApi ? isBackendReady : isDashboardReady;

    // Hold request with bootloader until target service is confirmed ready
    if (!targetPort || !targetReady) {
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

    const targetPort = isApi ? BACK_PORT : DASH_PORT;
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
 
    return [
 
        {
            name: 'cookie-parser',
            ok: checkCookieParser,
            dir: BACKEND_DIR
        },
 
        {
            name: 'sqlite3',
            ok: checkSqlite3,
            dir: typeormProjectDir()
        }
 
    ];
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
 
                    execSync(
 
                        `${command} install ${requirement.name} ` +
                        `--save --no-audit --no-fund ` +
                        `--prefix "${requirement.dir}"`,
 
                        {
 
                            cwd: requirement.dir,
 
                            stdio: 'inherit',
 
                            timeout: 240000,
 
                            env: buildRuntimeEnv({
                                NODE_ENV: 'production'
                            })
 
                        }
                    );

                    installed = true;

                    lastError =
                        new Error(
                            `npm finished but ${requirement.name} ` +
                            `cannot be loaded.`
                        );
 
                } catch (error) {
 
                    lastError = error;
 
                    log(
                        `⚠️ npm attempt failed: ${error.message}`
                    );
                }
            }
 
            if (!installed) {
 
                throw new Error(
 
                    `Unable to automatically install ` +
                    `${requirement.name}. ` +
 
                    (lastError
                        ? `Last error: ${lastError.message}`
                        : 'npm was not found.')
 
                );
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
 
function killZombieChildren() {

    const targets = [
        path.join(BACKEND_DIR, 'dist', 'main.js'),
        'web-dashboard/server.js',
        'standalone.*server.js'
    ];

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

                    const index =
                        runningChildren.indexOf(child);

                    if (index !== -1) {

                        runningChildren.splice(
                            index,
                            1
                        );
                    }

                    if (
                        signal === 'SIGTERM' ||
                        signal === 'SIGKILL'
                    ) {

                        log(
                            `ℹ️ ${name} stopped ` +
                            `(${code}/${signal}).`
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
                                    }
                                });
                            },
                            BASE_DELAY
                        );

                        return;
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
                            const py = resolvePython();
                            const newArgs = py ? py.args(newPort) : execArgs;
                            setTimeout(() => {
                                startEngine(name, execBin, newArgs, newPort, cwd, envExtra, 0, retries + 1);
                                waitForEngineReady(name, newPort).then(ok => {
                                    if (ok) isAiReady = true;
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

        // Allocate Backend port (starting around 3001)
        BACK_PORT = await findAvailablePort(3001, exclude);
        exclude.push(BACK_PORT);

        // Allocate Dashboard port (starting around 3002)
        DASH_PORT = await findAvailablePort(3002, exclude);
        exclude.push(DASH_PORT);

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
                if (ok) isAiReady = true;
            });
        }
    } else {
        log(
            '⚠️ AI Engine skipped because Python is unavailable.'
        );
    }


    // ═══════════════════════════════════════════════════════════════════════
    // BACKEND
    // ═══════════════════════════════════════════════════════════════════════

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
            if (ok) isBackendReady = true;
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


    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════

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
            500
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
                500
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
                500
            );

        } else {
            log(
                '❌ Next.js binary not found. Dashboard cannot start.'
            );
        }
    }

    waitForEngineReady('Dashboard', DASH_PORT).then(ok => {
        if (ok) isDashboardReady = true;
    });

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
// START MASTER SERVER
// ═══════════════════════════════════════════════════════════════════════════
 
server.listen(
    masterPort,
    '0.0.0.0',
    () => {
 
        log(
            `✨ Master Proxy listening on ${masterPort}`
        );
 
        // Cleanup only old Node/Dashboard processes.
        killZombieChildren();
 
        // Give Passenger a moment before spawning children.
        setTimeout(async () => {
 
            try {
 
                await ensureOllama();
 
                await bootEngines();
 
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
