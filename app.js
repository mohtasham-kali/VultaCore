#!/usr/bin/env node
// Entry point shim — Hostinger panel may be configured to run app.js or server.js.
// This file ensures the full master proxy always starts regardless.
console.log('[app.js] → forwarding to master proxy (server.js)');
require('./server.js');
