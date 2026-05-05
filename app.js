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
    // Safely bind to Unix sockets if needed
    server.on('error', (e) => {
      console.error("HTTP Server Error:", e);
    });
    server.listen(port);
    console.log("⚠️ Fallback server successfully bound to " + port);
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
  try {
    if (backendAppPath) {
      console.log(`✅ Loading Backend from: ${backendAppPath}`);
      require(backendAppPath);
    } else {
      const searchStatus = possiblePaths.map(p => `${p} (${fs.existsSync(p) ? 'FOUND' : 'MISSING'})`).join('\n');
      throw new Error(`CRITICAL: backend distribution not found. Searched:\n${searchStatus}`);
    }
  } catch (e) {
    logError(e);
    startFallbackServer(e);
  }
}

start();
