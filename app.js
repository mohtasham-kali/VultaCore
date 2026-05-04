const fs = require('fs');
const path = require('path');

console.log("🚀 VultaCore Booting...");

const rootDir = __dirname;
let fallbackActive = false;

function logError(err) {
  const msg = `[${new Date().toISOString()}] ${err?.stack || err}\n`;
  try {
    fs.appendFileSync(path.join(rootDir, 'error_log.txt'), msg);
  } catch (e) {
    // Ignore permissions errors to prevent recursive failure
  }
  console.error(msg);
}

function startFallbackServer(error) {
  if (fallbackActive) return;
  fallbackActive = true;
  try {
    const http = require('http');
    const port = process.env.PORT || 3001;
    const server = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>VultaCore Error Diagnostic</h1><p><b>ISOLATION MODE HOSTINGER TEST</b></p><pre>${error?.stack || error}</pre>`);
    });
    if (typeof port === 'string') {
      server.listen(port);
    } else {
      server.listen(port, '0.0.0.0');
    }
    console.log("⚠️ Diagnostic server successfully bound to " + port);
  } catch (err) {
    logError("Diagnostic server failed to bind: " + err.message);
  }
}

process.on('uncaughtException', (err) => {
  logError(err);
  startFallbackServer(err);
});

process.on('unhandledRejection', (reason) => {
  logError(reason);
  startFallbackServer(reason);
});

async function start() {
  // ISO TEST: Skip loading backend completely to see if Litespeed can reach Node at all!
  startFallbackServer("Running in Isolation Mode to verify Passenger routing.");
}

start();
