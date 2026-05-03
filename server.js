// This file acts as the primary entry point for Hostinger's Passenger Node.js server.
// Hostinger requires a top-level file (like server.js) to correctly boot the application environment.

console.log("🚀 Starting VultaCore Platform via server.js wrapper...");

// Import the compiled NestJS backend directly.
try {
  require('./backend-api/dist/main.js');
} catch (error) {
  console.error("❌ Failed to load main.js:", error);
  const fs = require('fs');
  fs.writeFileSync('error_log.txt', `[STUPID ERROR] ${new Date().toISOString()}\n${error.stack}\n`);
}
