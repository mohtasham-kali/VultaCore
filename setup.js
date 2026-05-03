const { execSync } = require('child_process');
const fs = require('fs');

console.log("🛠️ Starting Emergency Setup Script...");

try {
  // 1. Install dependencies
  console.log("📦 Running 'npm install'...");
  execSync('npm install', { stdio: 'inherit' });
  console.log("✅ npm install complete.");

  // 2. Build the project
  console.log("🏗️ Running 'npm run build'...");
  execSync('npm run build', { stdio: 'inherit' });
  console.log("✅ Build complete.");

  console.log("\n✨ SETUP FINISHED! Now change your 'Startup File' back to 'server.js' in the Hostinger panel.");
  
  // Create a success flag file
  fs.writeFileSync('setup_finished.txt', `Completed at ${new Date().toISOString()}`);

} catch (error) {
  console.error("❌ Setup failed!");
  console.error(error);
  fs.writeFileSync('setup_error_log.txt', error.stack);
}
