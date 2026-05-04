const fs = require('fs');
const path = require('path');

console.log("🚀 VultaCore Booting...");

// 1. Determine absolute paths
const rootDir = process.cwd();
const possiblePaths = [
  path.join(rootDir, 'backend-api', 'dist', 'main.js'),
  path.join(rootDir, 'dist', 'main.js')
];
const backendAppPath = possiblePaths.find(p => fs.existsSync(p));

// 2. Emergency Logging
function logError(err) {
  const msg = `[${new Date().toISOString()}] ${err.stack || err}\n`;
  fs.appendFileSync(path.join(rootDir, 'error_log.txt'), msg);
  console.error(msg);
}

// 3. Start the Application
try {
  if (backendAppPath) {
    console.log(`✅ Loading Backend from: ${backendAppPath}`);
    require(backendAppPath);
  } else {
    throw new Error(`CRITICAL: backend distribution not found. Searched: ${possiblePaths.join(', ')}`);
  }
} catch (e) {
  logError(e);
  // Fail-over: Start a tiny HTTP server so we don't get a silent 500
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`VultaCore Error: ${e.message}\nCheck error_log.txt for details.`);
  });
  server.listen(process.env.PORT || 3001);
}
