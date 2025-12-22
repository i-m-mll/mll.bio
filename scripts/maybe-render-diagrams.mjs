#!/usr/bin/env node
/**
 * Conditionally render diagrams based on AUTO_RENDER_DIAGRAMS environment variable.
 *
 * This script is called during prebuild and checks if diagram rendering should run.
 * Set AUTO_RENDER_DIAGRAMS=true to enable automatic rendering (useful for CI/CD).
 *
 * Usage:
 *   AUTO_RENDER_DIAGRAMS=true node scripts/maybe-render-diagrams.mjs
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if auto-rendering is enabled
const autoRender = process.env.AUTO_RENDER_DIAGRAMS === 'true';

if (!autoRender) {
  console.log('AUTO_RENDER_DIAGRAMS not set. Skipping automatic diagram rendering.');
  console.log('To render diagrams manually, run: npm run render-diagrams');
  process.exit(0);
}

console.log('AUTO_RENDER_DIAGRAMS=true. Running diagram rendering...');

// Run the render-diagrams script with --all to generate both light and dark variants
const proc = spawn('node', [join(__dirname, 'render-diagrams.mjs'), '--all'], {
  stdio: 'inherit',
  shell: true,
});

proc.on('close', (code) => {
  process.exit(code);
});

proc.on('error', (err) => {
  console.error('Error running render-diagrams:', err.message);
  process.exit(1);
});
