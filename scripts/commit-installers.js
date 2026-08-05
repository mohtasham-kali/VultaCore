#!/usr/bin/env node
/**
 * commit-installers.js
 *
 * Collects the installer binaries produced by Tauri (Linux/macOS) and NSIS/Electron (Windows),
 * moves them into a unified `dist/installers` folder, creates a ZIP archive of all installers,
 * and commits the artifacts to Git (Git LFS handles the large files).
 */

const { execSync } = require('child_process');
const { mkdirSync, renameSync, readdirSync, existsSync } = require('fs');
const path = require('path');

// ------------------------------------------------------------------
// Repository paths
// ------------------------------------------------------------------
const ROOT = path.resolve(__dirname, '..');               // repository root
const DEST = path.join(ROOT, 'dist', 'installers');       // unified installer output folder

// Ensure the destination folder exists
mkdirSync(DEST, { recursive: true });

// ------------------------------------------------------------------
// 1️⃣ Collect Tauri‑generated installers (Linux & macOS)
// ------------------------------------------------------------------
// In this monorepo the Tauri project lives under `desktop-app/src-tauri`
const tauriBundle = path.join(
  ROOT,
  'desktop-app',
  'src-tauri',
  'target',
  'release',
  'bundle'           // default output location for Tauri bundles
);

if (existsSync(tauriBundle)) {
  const files = readdirSync(tauriBundle);
  files.forEach(f => {
    if (/\.(deb|AppImage|rpm|dmg|pkg)$/i.test(f)) {
      const src = path.join(tauriBundle, f);
      const dst = path.join(DEST, f);
      renameSync(src, dst);
      console.log(`✔️  Moved Tauri installer: ${f}`);
    }
  });
}

// ------------------------------------------------------------------
// 2️⃣ Collect Windows installers (NSIS / electron‑builder)
// ------------------------------------------------------------------
// electron‑builder (and the NSIS plugin) usually drops .exe/.msi into the top‑level `dist/` folder.
const winDist = path.join(ROOT, 'dist');
if (existsSync(winDist)) {
  const files = readdirSync(winDist);
  files.forEach(f => {
    if (/\.(exe|msi)$/i.test(f)) {
      const src = path.join(winDist, f);
      const dst = path.join(DEST, f);
      renameSync(src, dst);
      console.log(`✔️  Moved Windows installer: ${f}`);
    }
  });
}

// ------------------------------------------------------------------
// 3️⃣ Create a ZIP archive of all installers (optional convenience)
// ------------------------------------------------------------------
try {
  // `zip -r installers.zip .` creates installers.zip containing everything in DEST
  execSync('zip -r installers.zip .', { cwd: DEST, stdio: 'inherit' });
  console.log('✅ Created installers.zip');
} catch (e) {
  console.warn('⚠️  ZIP creation failed – maybe `zip` is not installed.');
}

// ------------------------------------------------------------------
// 4️⃣ Git add / commit / push (LFS handles the binaries automatically)
// ------------------------------------------------------------------
try {
  // Force‑add because `dist/` is ignored in .gitignore
  execSync('git add -f dist/installers', { stdio: 'inherit', cwd: ROOT });
  execSync(
    'git commit -m "chore: add freshly built installer binaries (LFS tracked)"',
    { stdio: 'inherit', cwd: ROOT }
  );
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('✅ Installers committed and pushed – LFS now stores them.');
} catch (e) {
  // If there are no changes to commit, Git returns a non‑zero exit code.
  console.warn('⚠️  Nothing to commit (no new installers) or Git error.');
}
