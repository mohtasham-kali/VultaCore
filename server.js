const fs = require('fs');
const path = require('path');

console.log("🚀 VultaCore Booting...");

// 1. Determine absolute paths (Searching in multiple common locations)
const rootDir = process.cwd();
const possiblePaths = [
  path.join(rootDir, 'backend-api', 'dist', 'main.js'),
  path.join(rootDir, 'dist', 'main.js'), // Root dist as backup
  path.join(rootDir, 'repository', 'backend-api', 'dist', 'main.js'),
  path.join(rootDir, '..', 'backend-api', 'dist', 'main.js')
];

let backendAppPath = possiblePaths.find(p => fs.existsSync(p));

// 2. Emergency Logging
function logError(err) {
  const msg = `[${new Date().toISOString()}] ${err.stack || err}\n`;
  fs.appendFileSync(path.join(rootDir, 'error_log.txt'), msg);
  console.error(msg);
}

// 3. Start the Application
async function start() {
  try {
    if (backendAppPath) {
      console.log(`✅ Loading Backend from: ${backendAppPath}`);
      // Use require for CommonJS NestJS build
      require(backendAppPath);
    } else {
      const searchStatus = possiblePaths.map(p => `${p} (${fs.existsSync(p) ? 'FOUND' : 'MISSING'})`).join('\n');
      throw new Error(`CRITICAL: backend distribution not found. Searched:\n${searchStatus}`);
    }
  } catch (e) {
    logError(e);
    // Fail-over: Start a tiny HTTP server so we don't get a silent 500
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>VultaCore Boot Error</h1><p>${e.message}</p><pre>${e.stack}</pre>`);
    });
    server.listen(process.env.PORT || 3001);
  }
}

start();
