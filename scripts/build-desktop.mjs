// Builds the Blueprint desktop app (Electron).
//  1. Exports the web build (expo export -p web)
//  2. Copies dist/ into electron/dist so the renderer is self-contained
//  3. Runs electron-builder inside electron/ (which has its own package.json/main)
// Usage: node scripts/build-desktop.mjs [--dir | --win | --mac | --linux]
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const electronDir = join(root, 'electron');
const distDir = join(root, 'dist');
const electronDist = join(electronDir, 'dist');

// 1. Export the web build.
console.log('[1/3] Exporting web build…');
execSync('npx expo export -p web', { cwd: root, stdio: 'inherit' });

// 2. Copy dist into electron/dist.
console.log('[2/3] Staging web build into electron/dist…');
rmSync(electronDist, { recursive: true, force: true });
cpSync(distDir, electronDist, { recursive: true });

// 3. Run electron-builder in the electron dir.
const args = process.argv.slice(2);
const targets = args.filter((a) => !a.startsWith('--'));
const builderCli = join(root, 'node_modules', 'electron-builder', 'cli.js');
const command = `node "${builderCli}" ${targets.join(' ')}`;
// electron-builder reads its config from the nearest package.json (electron/),
// which has the app's "main" and its own "build" section.
console.log(`[3/3] Packaging: ${command}`);
execSync(command, { cwd: electronDir, stdio: 'inherit' });

console.log('Done. Output in electron/release/');
