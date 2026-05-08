#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const backendPath = path.join(rootDir, 'backend-api', 'dist', 'main.js');

console.log("🚀 VultaCore Booting (Single Process Mode)...");

// Use the system provided port (Passenger/Hostinger)
const port = process.env.PORT || 3000;

if (fs.existsSync(backendPath)) {
    console.log("✅ Launching Backend...");
    // We allow the backend to take over the primary port
    process.env.PORT = port;
    require(backendPath);
} else {
    const dashboardPath = path.join(rootDir, 'web-dashboard', '.next', 'standalone', 'web-dashboard', 'server.js');
    if (fs.existsSync(dashboardPath)) {
        console.log("✅ Launching Dashboard (Backend missing)...");
        process.env.PORT = port;
        require(dashboardPath);
    } else {
        console.error("❌ No bootable application found!");
    }
}
