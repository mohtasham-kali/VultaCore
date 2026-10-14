#!/usr/bin/env node

/**
 * VultaCore Master Proxy
 *
 * Hostinger / Passenger compatible.
 *
 * Internal services:
 *   Backend:   3001
 *   Dashboard: 3002
 *   AI Engine: 8002
 *
 * The public Node.js process listens on process.env.PORT.
 *
 * Important:
 * - Only one Passenger worker manages child processes.
 * - No pkill commands are used.
 * - Existing healthy services are reused.
 * - Existing unhealthy services are not killed automatically.
 */

'use strict';

const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const rootDir = __dirname;
const BACKEND_DIR = path.join(rootDir, 'backend-api');
const DASHBOARD_DIR = path.join(rootDir, 'web-dashboard');
const AI_DIR = path.join(rootDir, 'ai-services');
const DOWNLOADS_DIR = path.join(rootDir, 'public', 'downloads');

const ENGINE_STATE_FILE = path.join(
    rootDir,
    '.vultacore_state.json'
);

const BOOT_LOCK_FILE = path.join(
    rootDir,
    '.vultacore_boot.lock'
);

const LOCK_STALE_MS = 60000;

let heartbeatInterval = null;
let runningChildren = [];
let bootLogs = [];

let bootStarted = false;
let isProcessExiting = false;
let isBootLockOwner = false;

let isBackendReady = false;
let isDashboardReady = false;
let isAiReady = false;

let backendDependencyPromise = null;

/**
 * Load .env files without requiring dotenv.
 */
function loadEnv() {
    const envFiles = [
        path.join(rootDir, '.env'),
        path.join(BACKEND_DIR, '.env')
    ];

    for (const file of envFiles) {
        if (!fs.existsSync(file)) {
            continue;
        }

        try {
            const content = fs.readFileSync(file, 'utf8');

            for (const line of content.split('\n')) {
                const trimmed = line.trim();

                if (!trimmed || trimmed.startsWith('#')) {
                    continue;
                }

                const separator = trimmed.indexOf('=');

                if (separator <= 0) {
                    continue;
                }

                const key = trimmed
                    .slice(0, separator)
                    .trim();

                let value = trimmed
                    .slice(separator + 1)
                    .trim();

                if (
                    (value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))
                ) {
                    value = value.slice(1, -1);
                }

                if (
                    process.env[key] === undefined ||
                    process.env[key] === ''
                ) {
                    process.env[key] = value;
                }
            }
        } catch (_) {
            // Environment loading must not crash the proxy.
        }
    }

    if (
        !process.env.DATABASE_URL &&
        process.env.SUPABASE_DATABASE_URL
    ) {
        process.env.DATABASE_URL =
            process.env.SUPABASE_DATABASE_URL;
    }

    if (process.env.DATABASE_URL) {
        process.env.DATABASE_URL =
            process.env.DATABASE_URL.replace(
                /^(postgres(?:ql)?:\/\/[^:]+:)(.*)(@[^@]+)$/,
                (_match, prefix, password, host) => {
                    const encodedPassword =
                        encodeURIComponent(
                            decodeURIComponent(password)
                        );

                    return `${prefix}${encodedPassword}${host}`;
                }
            );
    }
}

loadEnv();

/**
 * Port parser.
 */
function getPort(value, fallback) {
    const port = Number.parseInt(value, 10);

    if (
        Number.isInteger(port) &&
        port > 0 &&
        port < 65536
    ) {
        return port;
    }

    return fallback;
}

/**
 * Public and internal ports.
 *
 * Set these in Hostinger environment variables if required:
 *
 * PORT=Hostinger assigned public port
 * BACKEND_PORT=3001
 * DASHBOARD_PORT=3002
 * AI_PORT=8002
 */
const masterPort = getPort(
    process.env.PORT,
    3000
);

const BACK_PORT = getPort(
    process.env.BACKEND_PORT,
    3001
);

const DASH_PORT = getPort(
    process.env.DASHBOARD_PORT,
    3002
);

const AI_PORT = getPort(
    process.env.AI_PORT,
    8002
);

const BACKEND_ENTRY = path.join(
    BACKEND_DIR,
    'dist',
    'main.js'
);

/**
 * Logging.
 */
function log(message) {
    const line =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    bootLogs.push(line);

    if (bootLogs.length > 200) {
        bootLogs.shift();
    }

    console.log(line);
}

/**
 * Runtime environment.
 */
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
        pathEntries.push(
            ...process.env.PATH.split(path.delimiter)
        );
    }

    return {
        ...process.env,
        ...extra,
        PATH: [
            ...new Set(
                pathEntries.filter(Boolean)
            )
        ].join(path.delimiter),
        NODE_ENV: extra.NODE_ENV || 'production'
    };
}

/**
 * Lock handling.
 *
 * Only one Passenger worker is allowed to manage:
 *
 * - Backend
 * - Dashboard
 * - AI Engine
 */
function readBootLock() {
    try {
        return JSON.parse(
            fs.readFileSync(
                BOOT_LOCK_FILE,
                'utf8'
            )
        );
    } catch (_) {
        return null;
    }
}

function writeBootLock() {
    fs.writeFileSync(
        BOOT_LOCK_FILE,
        JSON.stringify({
            pid: process.pid,
            timestamp: Date.now()
        }),
        'utf8'
    );
}

function isProcessAlive(pid) {
    if (!pid) {
        return false;
    }

    try {
        process.kill(Number(pid), 0);
        return true;
    } catch (error) {
        return error.code === 'EPERM';
    }
}

function isLockStale(lock) {
    if (!lock || !lock.pid || !lock.timestamp) {
        return true;
    }

    if (Number(lock.pid) === process.pid) {
        return false;
    }

    const age = Date.now() - Number(lock.timestamp);

    if (age < LOCK_STALE_MS) {
        return false;
    }

    try {
        process.kill(Number(lock.pid), 0);
        return false;
    } catch (error) {
        return error.code === 'ESRCH';
    }
}

function startLockHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(() => {
        if (!isBootLockOwner) {
            return;
        }

        try {
            writeBootLock();
        } catch (_) {}
    }, 3000);

    if (heartbeatInterval.unref) {
        heartbeatInterval.unref();
    }
}

function tryAcquireBootLock() {
    if (fs.existsSync(BOOT_LOCK_FILE)) {
        const existingLock = readBootLock();

        if (
            existingLock &&
            Number(existingLock.pid) === process.pid
        ) {
            isBootLockOwner = true;
            startLockHeartbeat();
            return true;
        }

        if (!isLockStale(existingLock)) {
            return false;
        }

        try {
            fs.unlinkSync(BOOT_LOCK_FILE);
        } catch (_) {
            return false;
        }
    }

    try {
        const fd = fs.openSync(
            BOOT_LOCK_FILE,
            'wx'
        );

        fs.writeSync(
            fd,
            JSON.stringify({
                pid: process.pid,
                timestamp: Date.now()
            })
        );

        fs.closeSync(fd);

        isBootLockOwner = true;
        startLockHeartbeat();

        return true;
    } catch (error) {
        return error.code === 'EEXIST'
            ? false
            : false;
    }
}

function releaseBootLock() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    if (!isBootLockOwner) {
        return;
    }

    try {
        const lock = readBootLock();

        if (
            lock &&
            Number(lock.pid) === process.pid
        ) {
            fs.unlinkSync(BOOT_LOCK_FILE);
        }
    } catch (_) {}

    isBootLockOwner = false;
}

/**
 * Engine state.
 */
function updateEngineState() {
    const state = {
        backendPort: BACK_PORT,
        dashboardPort: DASH_PORT,
        aiPort: AI_PORT,
        backendReady: isBackendReady,
        dashboardReady: isDashboardReady,
        aiReady: isAiReady,
        managerPid: isBootLockOwner
            ? process.pid
            : null,
        updatedAt: Date.now()
    };

    try {
        const temporaryFile =
            `${ENGINE_STATE_FILE}.${process.pid}.tmp`;

        fs.writeFileSync(
            temporaryFile,
            JSON.stringify(state, null, 2),
            'utf8'
        );

        fs.renameSync(
            temporaryFile,
            ENGINE_STATE_FILE
        );
    } catch (_) {}
}

function syncEngineState() {
    try {
        if (!fs.existsSync(ENGINE_STATE_FILE)) {
            return null;
        }

        const state = JSON.parse(
            fs.readFileSync(
                ENGINE_STATE_FILE,
                'utf8'
            )
        );

        if (!state) {
            return null;
        }

        isBackendReady =
            Boolean(state.backendReady);

        isDashboardReady =
            Boolean(state.dashboardReady);

        isAiReady =
            Boolean(state.aiReady);

        return state;
    } catch (_) {
        return null;
    }
}

/**
 * Network helpers.
 */
function checkTcpConnect(
    port,
    host = '127.0.0.1',
    timeout = 700
) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let finished = false;

        const finish = (result) => {
            if (finished) {
                return;
            }

            finished = true;

            try {
                socket.destroy();
            } catch (_) {}

            resolve(result);
        };

        const timer = setTimeout(
            () => finish(false),
            timeout
        );

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

function checkHttpHealth(
    name,
    port,
    requestPath = '/',
    timeout = 2500
) {
    if (!port) {
        return Promise.resolve(false);
    }

    const hosts = [
        '127.0.0.1',
        '0.0.0.0'
    ];

    function probe(index) {
        if (index >= hosts.length) {
            return Promise.resolve(false);
        }

        const host = hosts[index];

        return new Promise((resolve) => {
            let finished = false;

            const finish = (result) => {
                if (finished) {
                    return;
                }

                finished = true;
                resolve(result);
            };

            const timer = setTimeout(
                () => finish(false),
                timeout
            );

            const request = http.get(
                {
                    hostname: host,
                    port,
                    path: requestPath,
                    timeout
                },
                (response) => {
                    clearTimeout(timer);
                    response.resume();

                    finish(
                        response.statusCode < 500
                    );
                }
            );

            request.on('error', () => {
                clearTimeout(timer);
                finish(false);
            });
        }).then((ok) => {
            if (ok) {
                log(
                    `🩺 ${name} is reachable on ` +
                    `${host}:${port}${requestPath}`
                );

                return true;
            }

            return probe(index + 1);
        });
    }

    return probe(0);
}

function isPortListening(port) {
    return checkTcpConnect(
        port,
        '127.0.0.1',
        700
    );
}

function checkAiHealth(port) {
    return checkHttpHealth(
        'AI Engine',
        port,
        '/',
        2500
    );
}

function waitForEngineReady(
    name,
    port,
    maximumWait = 60000
) {
    const startedAt = Date.now();
    const requestPath =
        name === 'Backend'
            ? '/api'
            : '/';

    return new Promise((resolve) => {
        const check = async () => {
            let ready = false;

            if (name === 'AI Engine') {
                ready = await checkAiHealth(port);
            } else {
                ready = await checkHttpHealth(
                    name,
                    port,
                    requestPath,
                    2000
                );
            }

            if (ready) {
                if (name === 'Backend') {
                    isBackendReady = true;
                }

                if (name === 'Dashboard') {
                    isDashboardReady = true;
                }

                if (name === 'AI Engine') {
                    isAiReady = true;
                }

                updateEngineState();

                log(
                    `✅ ${name} is ready on port ${port}.`
                );

                resolve(true);
                return;
            }

            if (
                Date.now() - startedAt >= maximumWait
            ) {
                log(
                    `⚠️ ${name} did not become ready ` +
                    `within ${maximumWait / 1000}s.`
                );

                resolve(false);
                return;
            }

            setTimeout(check, 1000);
        };

        check();
    });
}

/**
 * Boot page.
 */
function sendBooting(res) {
    if (res.headersSent) {
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
    });

    res.end(`
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="6">
<title>VultaCore Starting</title>
<style>
body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: #050a14;
    font-family: system-ui, sans-serif;
}
main {
    text-align: center;
}
h1 {
    margin-bottom: 8px;
}
p {
    color: #94a3b8;
}
</style>
</head>
<body>
<main>
<h1>VultaCore</h1>
<p>Initializing engines...</p>
</main>
</body>
</html>
`);
}

/**
 * Static files.
 */
function tryServeStatic(req, res) {
    const cleanUrl = decodeURIComponent(
        (req.url || '/').split('?')[0]
    );

    let filePath = null;

    if (cleanUrl.startsWith('/_next/static/')) {
        filePath = path.join(
            DASHBOARD_DIR,
            '.next',
            'static',
            cleanUrl.slice('/_next/static/'.length)
        );
    } else if (
        /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|json|css|js)$/i
            .test(cleanUrl)
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

    const root = path.resolve(
        DASHBOARD_DIR
    );

    const resolved = path.resolve(
        filePath
    );

    if (
        !resolved.startsWith(root + path.sep) &&
        resolved !== root
    ) {
        return false;
    }

    if (!fs.existsSync(resolved)) {
        return false;
    }

    const mimeTypes = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };

    const extension =
        path.extname(resolved).toLowerCase();

    res.writeHead(200, {
        'Content-Type':
            mimeTypes[extension] ||
            'application/octet-stream',
        'Cache-Control':
            'public, max-age=31536000'
    });

    fs.createReadStream(resolved).pipe(res);

    return true;
}

/**
 * Downloads.
 */
function serveDownload(req, res) {
    const filename = decodeURIComponent(
        (req.url || '')
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
        res.end('Invalid filename');
        return;
    }

    const filePath = path.join(
        DOWNLOADS_DIR,
        filename
    );

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, {
            'Content-Type': 'text/plain'
        });

        res.end(
            `Installer not found: ${filename}`
        );

        return;
    }

    const stat = fs.statSync(filePath);

    res.writeHead(200, {
        'Content-Type':
            'application/octet-stream',
        'Content-Disposition':
            `attachment; filename="${filename}"`,
        'Content-Length':
            stat.size,
        'Cache-Control':
            'public, max-age=86400'
    });

    fs.createReadStream(filePath).pipe(res);
}

/**
 * Proxy requests.
 */
function proxyRequest(req, res, targetPort) {
    const clientHost =
        req.headers.host ||
        `127.0.0.1:${targetPort}`;

    const proxyRequestOptions = {
        hostname: '127.0.0.1',
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: clientHost,
            'x-forwarded-host': clientHost,
            'x-forwarded-proto':
                req.headers['x-forwarded-proto'] ||
                'https',
            'x-forwarded-for':
                req.headers['x-forwarded-for'] ||
                req.socket.remoteAddress
        }
    };

    const proxy = http.request(
        proxyRequestOptions,
        (proxyResponse) => {
            res.writeHead(
                proxyResponse.statusCode || 502,
                proxyResponse.headers
            );

            proxyResponse.pipe(res);
        }
    );

    proxy.on('error', (error) => {
        log(
            `⚠️ Proxy error on port ${targetPort}: ` +
            error.message
        );

        if (res.headersSent) {
            return;
        }

        const requestPath =
            (req.url || '').split('?')[0];

        const isApiRequest =
            requestPath.startsWith('/api') ||
            requestPath.startsWith('/socket.io');

        if (isApiRequest) {
            res.writeHead(503, {
                'Content-Type':
                    'application/json',
                'Cache-Control':
                    'no-store'
            });

            res.end(JSON.stringify({
                statusCode: 503,
                error: 'Service Unavailable',
                message:
                    'The internal service is restarting.'
            }));

            return;
        }

        sendBooting(res);
    });

    req.pipe(proxy);
}

/**
 * HTTP server.
 */
const server = http.createServer(
    async (req, res) => {
        const requestPath =
            (req.url || '/').split('?')[0];

        if (
            requestPath.startsWith('/downloads/')
        ) {
            return serveDownload(req, res);
        }

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

            res.end(
                bootLogs.join('\n')
            );

            return;
        }

        if (requestPath === '/health') {
            res.writeHead(200, {
                'Content-Type':
                    'application/json',
                'Cache-Control':
                    'no-store'
            });

            res.end(JSON.stringify({
                status: 'up',
                publicPort: masterPort,
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
                managerPid: isBootLockOwner
                    ? process.pid
                    : null,
                backendEntryExists:
                    fs.existsSync(BACKEND_ENTRY),
                uptime: process.uptime(),
                bootStarted
            }));

            return;
        }

        if (
            requestPath === '/api/boot-logs'
        ) {
            res.writeHead(200, {
                'Content-Type':
                    'application/json',
                'Access-Control-Allow-Origin':
                    '*',
                'Cache-Control':
                    'no-store'
            });

            res.end(JSON.stringify({
                logs: bootLogs,
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
                    isBackendReady &&
                    isDashboardReady,
                timestamp:
                    new Date().toISOString()
            }));

            return;
        }

        if (tryServeStatic(req, res)) {
            return;
        }

        syncEngineState();

        const isApi =
            requestPath.startsWith('/api') ||
            requestPath.startsWith('/socket.io');

        const targetPort = isApi
            ? BACK_PORT
            : DASH_PORT;

        const targetReady = isApi
            ? isBackendReady
            : isDashboardReady;

        if (!targetReady) {
            const confirmed =
                await checkHttpHealth(
                    isApi
                        ? 'Backend'
                        : 'Dashboard',
                    targetPort,
                    isApi ? '/api' : '/',
                    700
                );

            if (confirmed) {
                if (isApi) {
                    isBackendReady = true;
                } else {
                    isDashboardReady = true;
                }

                updateEngineState();
            }
        }

        const readyNow = isApi
            ? isBackendReady
            : isDashboardReady;

        if (!readyNow) {
            if (isApi) {
                res.writeHead(503, {
                    'Content-Type':
                        'application/json',
                    'Retry-After': '5',
                    'Cache-Control':
                        'no-store'
                });

                res.end(JSON.stringify({
                    statusCode: 503,
                    error: 'Service Unavailable',
                    message:
                        'Backend API is still starting.'
                }));

                return;
            }

            sendBooting(res);
            return;
        }

        proxyRequest(
            req,
            res,
            targetPort
        );
    }
);

/**
 * WebSocket and Socket.IO proxy.
 */
server.on(
    'upgrade',
    (req, clientSocket, head) => {
        const requestPath =
            (req.url || '/').split('?')[0];

        const isApi =
            requestPath.startsWith('/api') ||
            requestPath.startsWith('/socket.io');

        syncEngineState();

        const targetPort = isApi
            ? BACK_PORT
            : DASH_PORT;

        const targetReady = isApi
            ? isBackendReady
            : isDashboardReady;

        if (!targetReady) {
            clientSocket.destroy();
            return;
        }

        const proxySocket = net.connect(
            targetPort,
            '127.0.0.1',
            () => {
                const headers = Object.entries(
                    req.headers
                )
                    .map(([key, value]) => {
                        const normalized =
                            Array.isArray(value)
                                ? value.join(', ')
                                : value;

                        return `${key}: ${normalized}`;
                    })
                    .join('\r\n');

                proxySocket.write(
                    `${req.method} ${req.url} ` +
                    `HTTP/${req.httpVersion}\r\n` +
                    `${headers}\r\n\r\n`
                );

                if (head && head.length) {
                    proxySocket.write(head);
                }

                proxySocket.pipe(clientSocket);
                clientSocket.pipe(proxySocket);
            }
        );

        proxySocket.on(
            'error',
            () => clientSocket.destroy()
        );

        clientSocket.on(
            'error',
            () => proxySocket.destroy()
        );
    }
);

/**
 * Backend dependency checks.
 */
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

function checkSqlite3() {
    const locations = [
        rootDir,
        BACKEND_DIR
    ];

    for (const location of locations) {
        try {
            execSync(
                `"${process.execPath}" -e "require('sqlite3')"`,
                {
                    cwd: location,
                    stdio: 'ignore',
                    timeout: 15000,
                    env: buildRuntimeEnv()
                }
            );

            return true;
        } catch (_) {}
    }

    return false;
}

function typeormProjectDir() {
    try {
        const packagePath =
            require.resolve(
                'typeorm/package.json',
                {
                    paths: [BACKEND_DIR]
                }
            );

        return path.resolve(
            path.dirname(packagePath),
            '..',
            '..'
        );
    } catch (_) {
        return BACKEND_DIR;
    }
}

function getNpmCandidates() {
    return [
        process.env.npm_execpath,
        '/opt/alt/alt-nodejs24/root/usr/bin/npm',
        '/opt/alt/alt-nodejs22/root/usr/bin/npm',
        '/opt/alt/alt-nodejs20/root/usr/bin/npm',
        '/usr/bin/npm',
        'npm'
    ].filter(Boolean);
}

async function ensureBackendDependencies() {
    if (backendDependencyPromise) {
        return backendDependencyPromise;
    }

    backendDependencyPromise = (async () => {
        if (!fs.existsSync(BACKEND_ENTRY)) {
            throw new Error(
                `Backend entry not found: ${BACKEND_ENTRY}`
            );
        }

        const databaseUrl =
            process.env.DATABASE_URL || '';

        const remoteDatabase =
            /^(postgres|postgresql|mysql|mariadb):\/\//
                .test(databaseUrl);

        const missing = [];

        if (!checkCookieParser()) {
            missing.push({
                name: 'cookie-parser',
                cwd: BACKEND_DIR
            });
        }

        if (
            !remoteDatabase &&
            !checkSqlite3()
        ) {
            missing.push({
                name: 'sqlite3',
                cwd: typeormProjectDir()
            });
        }

        if (!missing.length) {
            log(
                '✅ Backend dependencies are available.'
            );

            return true;
        }

        for (const dependency of missing) {
            let installed = false;

            for (const npm of getNpmCandidates()) {
                try {
                    const npmCommand =
                        npm.endsWith('.js')
                            ? `"${process.execPath}" "${npm}"`
                            : `"${npm}"`;

                    if (
                        npm.startsWith('/') &&
                        !fs.existsSync(npm)
                    ) {
                        continue;
                    }

                    log(
                        `📦 Installing ${dependency.name}`
                    );

                    execSync(
                        `${npmCommand} install ` +
                        `${dependency.name} ` +
                        '--save --no-audit --no-fund',
                        {
                            cwd: dependency.cwd,
                            stdio: 'inherit',
                            timeout: 120000,
                            env: buildRuntimeEnv()
                        }
                    );

                    installed = true;
                    break;
                } catch (error) {
                    log(
                        `⚠️ Could not install ` +
                        `${dependency.name}: ` +
                        error.message
                    );
                }
            }

            if (
                !installed &&
                dependency.name !== 'sqlite3'
            ) {
                throw new Error(
                    `Unable to install ${dependency.name}.`
                );
            }
        }

        return true;
    })();

    try {
        return await backendDependencyPromise;
    } catch (error) {
        backendDependencyPromise = null;
        throw error;
    }
}

/**
 * Python detection and dependencies.
 */
function findPython() {
    const candidates = [
        '/opt/alt/python311/bin/python3',
        '/opt/alt/python310/bin/python3',
        '/opt/alt/python39/bin/python3',
        '/usr/local/bin/python3',
        '/usr/bin/python3',
        'python3',
        'python'
    ];

    for (const candidate of candidates) {
        try {
            let executable = candidate;

            if (!candidate.startsWith('/')) {
                executable = execSync(
                    `command -v ${candidate}`,
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
    const virtualenvCandidates = [
        path.join(
            AI_DIR,
            'venv',
            'bin',
            'python3'
        ),
        path.join(
            AI_DIR,
            'venv',
            'bin',
            'python'
        )
    ];

    for (const python of virtualenvCandidates) {
        if (fs.existsSync(python)) {
            return {
                bin: python,
                env: {},
                args: (port) => [
                    '-m',
                    'uvicorn',
                    'main:app',
                    '--host',
                    '127.0.0.1',
                    '--port',
                    String(port)
                ]
            };
        }
    }

    const python = findPython();

    if (!python) {
        log(
            '❌ Python 3 was not found.'
        );

        return null;
    }

    const packagesDir = path.join(
        AI_DIR,
        '.python_packages'
    );

    const requiredPackages = [
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

    const importName = (packageName) => {
        if (packageName === 'google-genai') {
            return 'google.genai';
        }

        if (packageName === 'python-dotenv') {
            return 'dotenv';
        }

        return packageName.replace(/-/g, '_');
    };

    const missing = [];

    for (const packageName of requiredPackages) {
        try {
            execSync(
                `"${python}" -c "import ${importName(packageName)}"`,
                {
                    stdio: 'ignore',
                    env: buildRuntimeEnv({
                        PYTHONPATH: fs.existsSync(packagesDir)
                            ? packagesDir
                            : ''
                    })
                }
            );
        } catch (_) {
            missing.push(packageName);
        }
    }

    if (missing.length) {
        try {
            fs.mkdirSync(
                packagesDir,
                {
                    recursive: true
                }
            );

            const lockFile = path.join(
                packagesDir,
                '.pip_installing.lock'
            );

            if (!fs.existsSync(lockFile)) {
                fs.writeFileSync(
                    lockFile,
                    String(process.pid)
                );

                log(
                    `📦 Installing Python packages: ` +
                    `${missing.join(', ')}`
                );

                execSync(
                    `"${python}" -m pip install ` +
                    `--quiet --target="${packagesDir}" ` +
                    missing.join(' '),
                    {
                        stdio: 'inherit',
                        timeout: 180000,
                        env: buildRuntimeEnv({
                            PYTHONPATH: packagesDir
                        })
                    }
                );

                fs.unlinkSync(lockFile);

                log(
                    '✅ Python packages installed.'
                );
            }
        } catch (error) {
            log(
                `⚠️ Python dependency installation failed: ` +
                error.message
            );
        }
    }

    return {
        bin: python,
        env: {
            PYTHONPATH: fs.existsSync(packagesDir)
                ? packagesDir
                : ''
        },
        args: (port) => [
            '-m',
            'uvicorn',
            'main:app',
            '--host',
            '127.0.0.1',
            '--port',
            String(port)
        ]
    };
}

/**
 * Dashboard discovery.
 */
function findDashboardServer() {
    const candidates = [
        path.join(
            DASHBOARD_DIR,
            '.next',
            'standalone',
            'web-dashboard',
            'server.js'
        ),
        path.join(
            DASHBOARD_DIR,
            '.next',
            'standalone',
            'server.js'
        )
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

/**
 * Child process management.
 */
function markReady(name) {
    if (name === 'Backend') {
        isBackendReady = true;
    }

    if (name === 'Dashboard') {
        isDashboardReady = true;
    }

    if (name === 'AI Engine') {
        isAiReady = true;
    }

    updateEngineState();
}

function markNotReady(name) {
    if (name === 'Backend') {
        isBackendReady = false;
    }

    if (name === 'Dashboard') {
        isDashboardReady = false;
    }

    if (name === 'AI Engine') {
        isAiReady = false;
    }

    updateEngineState();
}

function startEngine(
    name,
    executable,
    args,
    port,
    cwd,
    extraEnv = {},
    delay = 0,
    attempt = 0
) {
    const maximumAttempts = 6;

    setTimeout(async () => {
        if (isProcessExiting) {
            return;
        }

        if (
            await isPortListening(port)
        ) {
            log(
                `ℹ️ ${name}: port ${port} is already ` +
                'in use. No duplicate process will start.'
            );

            const ready =
                name === 'AI Engine'
                    ? await checkAiHealth(port)
                    : await checkHttpHealth(
                        name,
                        port,
                        name === 'Backend'
                            ? '/api'
                            : '/',
                        2000
                    );

            if (ready) {
                markReady(name);
            } else {
                log(
                    `⚠️ ${name}: port ${port} is occupied ` +
                    'but the service is not healthy.'
                );
            }

            return;
        }

        log(
            `🚀 Starting ${name} on port ${port} ` +
            `(attempt ${attempt + 1})`
        );

        let child;

        try {
            child = spawn(
                executable,
                args,
                {
                    cwd: cwd || rootDir,
                    env: buildRuntimeEnv({
                        ...extraEnv,
                        PORT: String(port)
                    }),
                    shell: false,
                    detached: false,
                    stdio: [
                        'ignore',
                        'pipe',
                        'pipe'
                    ]
                }
            );
        } catch (error) {
            log(
                `❌ Could not start ${name}: ` +
                error.message
            );

            return;
        }

        runningChildren.push(child);

        log(
            `📡 ${name} started with PID ${child.pid}.`
        );

        const processOutput = (data) => {
            const text = data
                .toString()
                .trim();

            if (!text) {
                return;
            }

            log(`[${name}] ${text}`);

            const readyMessage =
                text.includes('Application startup complete') ||
                text.includes('Uvicorn running on') ||
                text.includes('Application is running on') ||
                text.includes('Nest application successfully started') ||
                text.includes('Ready in');

            if (readyMessage) {
                markReady(name);
            }
        };

        child.stdout.on(
            'data',
            processOutput
        );

        child.stderr.on(
            'data',
            processOutput
        );

        child.on(
            'error',
            (error) => {
                log(
                    `❌ ${name} process error: ` +
                    error.message
                );
            }
        );

        child.on(
            'exit',
            (code, signal) => {
                const index =
                    runningChildren.indexOf(child);

                if (index !== -1) {
                    runningChildren.splice(
                        index,
                        1
                    );
                }

                markNotReady(name);

                if (isProcessExiting) {
                    return;
                }

                log(
                    `⚠️ ${name} exited ` +
                    `(code=${code}, signal=${signal}).`
                );

                if (attempt >= maximumAttempts) {
                    log(
                        `🛑 ${name} reached the retry limit.`
                    );

                    return;
                }

                const wait =
                    Math.min(
                        5000 *
                        Math.pow(2, attempt),
                        60000
                    );

                log(
                    `🔁 ${name} will retry in ` +
                    `${Math.round(wait / 1000)} seconds.`
                );

                startEngine(
                    name,
                    executable,
                    args,
                    port,
                    cwd,
                    extraEnv,
                    wait,
                    attempt + 1
                );
            }
        );

        waitForEngineReady(
            name,
            port,
            60000
        ).then((ready) => {
            if (ready) {
                markReady(name);
            }
        });
    }, delay);
}

/**
 * Start all internal engines.
 */
async function bootEngines() {
    if (!tryAcquireBootLock()) {
        syncEngineState();

        const owner = readBootLock();

        log(
            `ℹ️ Another worker is managing the engines ` +
            `(PID ${owner ? owner.pid : 'unknown'}).`
        );

        return;
    }

    if (bootStarted) {
        return;
    }

    bootStarted = true;

    log(
        '🚀 Starting VultaCore engines.'
    );

    updateEngineState();

    const python = resolvePython();

    if (python) {
        startEngine(
            'AI Engine',
            python.bin,
            python.args(AI_PORT),
            AI_PORT,
            AI_DIR,
            python.env || {},
            0
        );
    } else {
        log(
            '⚠️ AI Engine was not started because Python ' +
            'was unavailable.'
        );
    }

    const standaloneServer =
        findDashboardServer();

    const localNext = path.join(
        DASHBOARD_DIR,
        'node_modules',
        'next',
        'dist',
        'bin',
        'next'
    );

    const rootNext = path.join(
        rootDir,
        'node_modules',
        'next',
        'dist',
        'bin',
        'next'
    );

    const nextBinary =
        fs.existsSync(localNext)
            ? localNext
            : rootNext;

    if (standaloneServer) {
        startEngine(
            'Dashboard',
            process.execPath,
            [standaloneServer],
            DASH_PORT,
            path.dirname(standaloneServer),
            {
                HOSTNAME: '127.0.0.1'
            },
            1000
        );
    } else if (fs.existsSync(nextBinary)) {
        startEngine(
            'Dashboard',
            process.execPath,
            [
                nextBinary,
                'start',
                '-p',
                String(DASH_PORT)
            ],
            DASHBOARD_DIR,
            {
                HOSTNAME: '127.0.0.1'
            },
            1000
        );
    } else {
        log(
            '❌ Next.js production server was not found.'
        );
    }

    try {
        await ensureBackendDependencies();

        startEngine(
            'Backend',
            process.execPath,
            [BACKEND_ENTRY],
            BACK_PORT,
            BACKEND_DIR,
            {
                AI_SERVICE_URL:
                    `http://127.0.0.1:${AI_PORT}`,
                AI_PORT: String(AI_PORT)
            },
            1500
        );
    } catch (error) {
        log(
            `❌ Backend dependency setup failed: ` +
            error.message
        );
    }

    log(
        `✅ Engine boot initiated: ` +
        `Backend=${BACK_PORT}, ` +
        `Dashboard=${DASH_PORT}, ` +
        `AI=${AI_PORT}`
    );
}

/**
 * Watchdog.
 *
 * Only the lock owner performs recovery.
 * Other Passenger workers only synchronize state.
 */
function startWatchdog() {
    setInterval(async () => {
        if (isProcessExiting) {
            return;
        }

        syncEngineState();

        if (!isBootLockOwner) {
            return;
        }

        const dashboardHealthy =
            await checkHttpHealth(
                'Dashboard',
                DASH_PORT,
                '/',
                1500
            );

        const backendHealthy =
            await checkHttpHealth(
                'Backend',
                BACK_PORT,
                '/api',
                1500
            );

        const aiHealthy =
            await checkAiHealth(AI_PORT);

        if (
            dashboardHealthy !== isDashboardReady ||
            backendHealthy !== isBackendReady ||
            aiHealthy !== isAiReady
        ) {
            isDashboardReady = dashboardHealthy;
            isBackendReady = backendHealthy;
            isAiReady = aiHealthy;

            updateEngineState();
        }
    }, 10000);
}

/**
 * Stop only child processes owned by this master process.
 */
function shutdown() {
    if (isProcessExiting) {
        return;
    }

    isProcessExiting = true;

    for (const child of runningChildren) {
        try {
            child.kill('SIGTERM');
        } catch (_) {}
    }

    releaseBootLock();
}

process.once('SIGTERM', () => {
    shutdown();
    process.exit(0);
});

process.once('SIGINT', () => {
    shutdown();
    process.exit(0);
});

process.once('exit', () => {
    releaseBootLock();
});

/**
 * Start public proxy.
 */
server.listen(
    masterPort,
    '0.0.0.0',
    () => {
        log(
            `✨ Master proxy listening on port ${masterPort}.`
        );

        setTimeout(async () => {
            try {
                await bootEngines();
                startWatchdog();
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
    (error) => {
        log(
            `❌ Master proxy error: ${error.message}`
        );

        shutdown();
        process.exit(1);
    }
);