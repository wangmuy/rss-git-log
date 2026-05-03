#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let repo = '';
let subfolder = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-r' || args[i] === '--repo') {
    repo = args[i + 1];
    i++;
  } else if (args[i] === '-s' || args[i] === '--subfolder') {
    subfolder = args[i + 1];
    i++;
  }
}

if (!repo) {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  const match = pkg.repository?.url?.match(/github\.com[/:]([^/]+\/[^.]+)/)?.[1];
  repo = match || 'owner/repo';
}

const subfolderPath = subfolder ? `/${subfolder}/` : '/';
console.log(`Deploying to: ${repo} (base: ${subfolderPath})`);

const env = { ...process.env, VITE_BASE: subfolderPath };
execSync('npx gh-pages -d dist', { stdio: 'inherit', env });
console.log('Done!');