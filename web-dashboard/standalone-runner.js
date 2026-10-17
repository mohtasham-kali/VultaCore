#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '.next', 'standalone', 'web-dashboard');
const standaloneNodeModules = path.join(__dirname, '.next', 'standalone', 'node_modules');

process.env.NODE_ENV = 'production';
process.chdir(dir);

const portEnv = process.env.PORT;
const isUnixSocket = typeof portEnv === 'string' && (portEnv.startsWith('/') || portEnv.endsWith('.sock'));

if (isUnixSocket) {
    try { fs.unlinkSync(portEnv); } catch (_) {}
}

const currentPort = isUnixSocket ? portEnv : (parseInt(portEnv, 10) || 3000);
const hostname = isUnixSocket ? undefined : (process.env.HOSTNAME || '0.0.0.0');

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
if (Number.isNaN(keepAliveTimeout) || !Number.isFinite(keepAliveTimeout) || keepAliveTimeout < 0) {
    keepAliveTimeout = undefined;
}

// Read nextConfig from standalone server.js
const origServerFile = path.join(dir, 'server.js');
let nextConfig = {};
if (fs.existsSync(origServerFile)) {
    const origContent = fs.readFileSync(origServerFile, 'utf8');
    const match = origContent.match(/const nextConfig = (\{.*?\})\n/);
    if (match) {
        try { nextConfig = JSON.parse(match[1]); } catch (_) {}
    }
}

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

// Require next and startServer from standalone node_modules or local
let startServer;
try {
    startServer = require(path.join(standaloneNodeModules, 'next', 'dist', 'server', 'lib', 'start-server')).startServer;
} catch (_) {
    try {
        startServer = require('next/dist/server/lib/start-server').startServer;
    } catch (e) {
        console.error('[Dashboard Runner] Could not load Next.js startServer:', e);
        process.exit(1);
    }
}

startServer({
    dir,
    isDev: false,
    config: nextConfig,
    hostname,
    port: currentPort,
    allowRetry: false,
    keepAliveTimeout,
}).then(() => {
    console.log(`[Dashboard] Ready on ${isUnixSocket ? portEnv : currentPort}`);
}).catch((err) => {
    console.error('[Dashboard] Fatal error in startServer:', err);
    process.exit(1);
});
