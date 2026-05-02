const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Starting VultaCore Platform (Multi-Process)...");

// Absolute paths to entry points
const apiEntry = path.join(__dirname, 'backend-api', 'dist', 'main.js');
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

// 1. Start Backend API on internal port 3001
console.log("-> Launching Backend API...");
const api = spawn('node', [apiEntry], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

// 2. Start Web Dashboard on Hostinger's assigned port
console.log("-> Launching Web Dashboard...");
const web = spawn('node', [nextBin, 'start', 'web-dashboard'], {
  stdio: 'inherit',
  env: { ...process.env }
});

api.on('error', (err) => {
  console.error('❌ Failed to start API process:', err);
});

web.on('error', (err) => {
  console.error('❌ Failed to start Web Dashboard process:', err);
});

api.on('exit', (code) => {
  if (code !== 0) console.error(`❌ API process exited with code ${code}`);
});

web.on('exit', (code) => {
  if (code !== 0) console.error(`❌ Web Dashboard process exited with code ${code}`);
});
