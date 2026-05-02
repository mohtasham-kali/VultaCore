const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Starting VultaCore Platform (Dashboard + API)...");

// 1. Start Backend API on internal port 3001
const api = spawn('npm', ['run', 'start:prod', '-w', 'backend-api'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3001' }
});

// 2. Start Web Dashboard on Hostinger's assigned port
const web = spawn('npm', ['run', 'start', '-w', 'web-dashboard'], {
  stdio: 'inherit',
  shell: true
});

api.on('exit', (code) => {
  console.error(`❌ API process exited with code ${code}`);
  process.exit(code || 1);
});

web.on('exit', (code) => {
  console.error(`❌ Web Dashboard process exited with code ${code}`);
  process.exit(code || 1);
});
