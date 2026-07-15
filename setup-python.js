#!/usr/bin/env node
/**
 * VultaCore Python Dependency Setup
 * Runs automatically after `npm install` (postinstall hook).
 * Pre-installs all Python AI packages into ai-services/.python_packages
 * so the AI Engine starts correctly on any host (Hostinger, Render, etc.)
 * without needing a virtualenv or root access.
 */
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const rootDir   = __dirname;
const aiDir     = path.join(rootDir, 'ai-services');
const targetDir = path.join(aiDir, '.python_packages');
const reqFile   = path.join(aiDir, 'requirements.txt');

// Lightweight packages only — skip heavy ML libs that aren't needed on the server
const REQUIRED = [
  'uvicorn',
  'fastapi',
  'httpx',
  'python-dotenv',
  'pydantic',
  'google-genai',
  'groq',
  'openai',
  'anthropic',
];

function findPython() {
  const candidates = [
    'python3',
    'python',
    '/opt/alt/python311/bin/python3',
    '/opt/alt/python310/bin/python3',
    '/opt/alt/python39/bin/python3',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
  ];
  for (const cmd of candidates) {
    try {
      const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.includes('3.')) return cmd;
    } catch (_) {}
  }
  return null;
}

// Skip if we're inside a git CI context that doesn't need Python
if (process.env.CI && !process.env.SETUP_PYTHON) {
  console.log('[setup-python] CI environment detected — skipping Python setup.');
  process.exit(0);
}

// Skip if a venv already exists (local dev)
const venvPy = path.join(aiDir, 'venv', 'bin', 'python3');
if (fs.existsSync(venvPy)) {
  console.log('[setup-python] Local virtualenv found — skipping cloud package install.');
  process.exit(0);
}

const python = findPython();
if (!python) {
  console.warn('[setup-python] ⚠️  No Python 3 found — AI Engine will be unavailable.');
  process.exit(0);
}

console.log(`[setup-python] Using Python: ${python}`);

function getImportName(pkg) {
  if (pkg === 'google-genai') return 'google.genai';
  if (pkg === 'google-generativeai') return 'google.generativeai';
  if (pkg === 'python-dotenv') return 'dotenv';
  return pkg.replace(/-/g, '_').split('[')[0];
}

// Check which packages are already importable
const missing = REQUIRED.filter(pkg => {
  const importName = getImportName(pkg);
  try {
    const r = spawnSync(python, ['-c', `import ${importName}`], { encoding: 'utf8' });
    return r.status !== 0;
  } catch (_) { return true; }
});

if (missing.length === 0) {
  console.log('[setup-python] ✅ All Python packages already available globally.');
  process.exit(0);
}

console.log(`[setup-python] Installing missing packages: ${missing.join(', ')}`);
console.log(`[setup-python] Target directory: ${targetDir}`);

try {
  fs.mkdirSync(targetDir, { recursive: true });
  const result = spawnSync(
    python,
    ['-m', 'pip', 'install', '--quiet', '--target', targetDir, ...missing],
    { stdio: 'inherit', timeout: 180000, encoding: 'utf8' }
  );
  if (result.status === 0) {
    console.log('[setup-python] ✅ Python packages installed successfully into .python_packages');
  } else {
    console.error('[setup-python] ⚠️  pip install exited with error. AI Engine may not start.');
  }
} catch (err) {
  console.error(`[setup-python] ❌ Failed to install packages: ${err.message}`);
}
