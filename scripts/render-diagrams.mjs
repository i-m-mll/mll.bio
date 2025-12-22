#!/usr/bin/env node
/**
 * Wrapper script to render probability theory diagrams.
 * Runs the Python render.py script from the diagrams submodule.
 *
 * Usage:
 *   node scripts/render-diagrams.mjs         # Render light mode
 *   node scripts/render-diagrams.mjs --dark  # Render dark mode
 *   node scripts/render-diagrams.mjs --all   # Render both light and dark
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const diagramsDir = join(projectRoot, 'content/series/probability-theory/diagrams');

// Check if diagrams directory exists
if (!existsSync(diagramsDir)) {
  console.log('Diagrams directory not found. Skipping diagram rendering.');
  process.exit(0);
}

// Check if render.py exists
const renderScript = join(diagramsDir, 'render.py');
if (!existsSync(renderScript)) {
  console.log('render.py not found. Skipping diagram rendering.');
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const renderDark = args.includes('--dark');
const renderAll = args.includes('--all');

/**
 * Run the Python render script with optional dark mode flag.
 * @param {boolean} dark - Whether to render in dark mode
 * @returns {Promise<void>}
 */
function runRender(dark = false) {
  return new Promise((resolve, reject) => {
    const renderArgs = ['run', 'python', 'render.py'];
    if (dark) {
      renderArgs.push('--dark');
    }

    console.log(`\nRendering diagrams${dark ? ' (dark mode)' : ' (light mode)'}...`);

    const proc = spawn('uv', renderArgs, {
      cwd: diagramsDir,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`Diagram rendering${dark ? ' (dark)' : ' (light)'} complete.`);
        resolve();
      } else {
        reject(new Error(`Render process exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    if (renderAll) {
      // Render both light and dark modes
      await runRender(false);
      await runRender(true);
    } else if (renderDark) {
      // Render dark mode only
      await runRender(true);
    } else {
      // Render light mode only (default)
      await runRender(false);
    }
  } catch (err) {
    console.error('Error rendering diagrams:', err.message);
    process.exit(1);
  }
}

main();
