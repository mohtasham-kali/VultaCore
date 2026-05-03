// This file acts as the primary entry point for Hostinger's Passenger Node.js server.
// Hostinger requires a top-level file (like server.js) to correctly boot the application environment.

console.log("🚀 Starting VultaCore Platform via server.js wrapper...");

// Import the compiled NestJS backend directly.
try {
  console.log("📂 Current Directory:", process.cwd());
  console.log("🔍 Checking for backend-api/dist/main.js...");
  const fs = require('fs');
  const path = require('path');
  const backendPath = path.join(__dirname, 'backend-api', 'dist', 'main.js');
  
  if (fs.existsSync(backendPath)) {
    console.log("✅ File found! Attempting to boot...");
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
