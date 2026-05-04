const fs = require('fs');
const path = require('path');

console.log("🚀 VultaCore Booting...");

const rootDir = __dirname;
const possiblePaths = [
  path.join(rootDir, 'backend-api', 'dist', 'main.js'),
  path.join(rootDir, 'dist', 'main.js'),
  path.join(rootDir, 'repository', 'backend-api', 'dist', 'main.js'),
  path.join(rootDir, '..', 'backend-api', 'dist', 'main.js')
];

let backendAppPath = possiblePaths.find(p => fs.existsSync(p));

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
      res.end(`<h1>VultaCore Error Diagnostic</h1><p><b>A FATAL BOOT ERROR OCCURRED:</b></p><pre>${error?.stack || error}</pre>`);
    });
    // Safely bind to Unix sockets if needed
    if (typeof port === 'string') {
      server.listen(port);
    } else {
      server.listen(port, '0.0.0.0');
    }
    console.log("⚠️ Fallback server successfully bound to " + port);
  } catch (err) {
    logError("Fallback server failed to bind: " + err.message);
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
