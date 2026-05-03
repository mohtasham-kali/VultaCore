// This file acts as the primary entry point for Hostinger's Passenger Node.js server.
// Hostinger requires a top-level file (like server.js) to correctly boot the application environment.

console.log("🚀 Starting VultaCore Platform via server.js wrapper...");

// Import the compiled NestJS backend directly.
try {
  const fs = require('fs');
  const path = require('path');
  
  console.log("📂 Current Directory:", process.cwd());
  console.log("📁 Root Files:", fs.readdirSync(process.cwd()).join(', '));
  
  const outPath = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outPath)) {
    console.warn("⚠️ Warning: 'out' directory not found at root. Creating it...");
    fs.mkdirSync(outPath, { recursive: true });
    fs.writeFileSync(path.join(outPath, 'index.html'), '<html><body><h1>VultaCore is building... Please refresh in a minute.</h1></body></html>');
  }

  const backendPath = path.join(__dirname, 'backend-api', 'dist', 'main.js');
  console.log("🔍 Checking for backend-api/dist/main.js...");
  
  if (fs.existsSync(backendPath)) {
    console.log("✅ Backend found! Attempting to boot...");
    require(backendPath);
  } else {
    throw new Error(`CRITICAL: backend-api/dist/main.js not found at ${backendPath}`);
  }
} catch (error) {
  const fs = require('fs');
  const logMessage = `[${new Date().toISOString()}] CRASH ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
  fs.appendFileSync('error_log.txt', logMessage);
  console.error("❌ " + logMessage);
}
