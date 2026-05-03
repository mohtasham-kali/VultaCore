const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  
  let info = "<h1>🪲 VultaCore Emergency Debugger</h1>";
  
  info += `<h2>📍 Current Path:</h2> <pre>${process.cwd()}</pre>`;
  info += `<h2>🖥️ Node Version:</h2> <pre>${process.version}</pre>`;
  
  info += "<h2>📂 Root Directory Files:</h2><pre>";
  try {
    info += fs.readdirSync('.').join('\n');
  } catch (e) { info += `Error: ${e.message}`; }
  info += "</pre>";

  info += "<h2>📦 node_modules Check:</h2><pre>";
  if (fs.existsSync('node_modules')) {
    info += "✅ node_modules folder EXISTS\n";
    try {
      const deps = fs.readdirSync('node_modules').slice(0, 10);
      info += `Found ${deps.length}+ packages including: ${deps.join(', ')}`;
    } catch (e) { info += `Error reading: ${e.message}`; }
  } else {
    info += "❌ node_modules folder MISSING!";
  }
  info += "</pre>";

  info += "<h2>🏗️ Backend Build Check:</h2><pre>";
  const backendPath = './backend-api/dist/main.js';
  if (fs.existsSync(backendPath)) {
    info += `✅ Backend main.js found at: ${backendPath}`;
  } else {
    info += `❌ Backend main.js is MISSING at: ${backendPath}`;
  }
  info += "</pre>";

  info += "<h2>🔑 Env Variable Check:</h2><pre>";
  info += `DATABASE_URL: ${process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING'}\n`;
  info += `PORT: ${process.env.PORT || 'NOT SET (using default)'}`;
  info += "</pre>";

  res.end(info);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});
