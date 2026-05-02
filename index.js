const http = require('http');
const fs = require('fs');

console.log("🛠 Proof of Life script starting...");

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ VultaCore Node.js is ALIVE on Hostinger!\n\nIf you see this, it means our startup port and path are correct.');
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Proof of Life running on port ${port}`);
  fs.writeFileSync('alive_check.txt', 'Successfully started at ' + new Date().toISOString());
});
