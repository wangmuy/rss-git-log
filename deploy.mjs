#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let repo = '';
let subfolder = '';
let token = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-r' || args[i] === '--repo') {
    repo = args[i + 1];
    i++;
  } else if (args[i] === '-s' || args[i] === '--subfolder') {
    subfolder = args[i + 1];
    i++;
  } else if (args[i] === '-t' || args[i] === '--token') {
    token = args[i + 1];
    i++;
  }
}

if (!repo && !token) {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[/:]([^/]+\/[^.]+)/)?.[1];
    repo = match || '';
  } catch (e) {
    repo = '';
  }
}

const subfolderPath = subfolder ? `/${subfolder}/` : '/';
console.log(`Deploying to: ${repo} (base: ${subfolderPath})`);

const distIndex = resolve(__dirname, 'dist', 'index.html');
if (existsSync(distIndex)) {
  const html = readFileSync(distIndex, 'utf-8');
  const srcMatch = html.match(/src="\/([^"]+)\/assets\//);
  if (srcMatch) {
    const currentBase = srcMatch[1];
    const targetBase = subfolder.replace(/\/$/, '');
    if (currentBase !== targetBase) {
      console.log(`Current build base ("/${currentBase}") differs from target ("/${targetBase}"), rebuilding...`);
      const buildEnv = { ...process.env, VITE_BASE: subfolderPath };
      execSync('npm run build', { stdio: 'inherit', env: buildEnv });
    } else {
      console.log(`Build base ("/${currentBase}") matches target, using existing dist.`);
    }
  } else if (subfolder) {
    console.log('No subfolder detected in current build, rebuilding...');
    const buildEnv = { ...process.env, VITE_BASE: subfolderPath };
    execSync('npm run build', { stdio: 'inherit', env: buildEnv });
  }
} else {
  console.log('No dist folder found, building...');
  const buildEnv = { ...process.env, VITE_BASE: subfolderPath };
  execSync('npm run build', { stdio: 'inherit', env: buildEnv });
}

const env = { ...process.env, VITE_BASE: subfolderPath };

let ghPagesCmd = 'npx gh-pages -d dist';
if (repo && token) {
  ghPagesCmd += ` -r https://x-access-token:${token}@github.com/${repo}.git`;
} else if (repo && !token) {
  ghPagesCmd += ` -r git@github.com:${repo}.git`;
}

execSync(ghPagesCmd, { stdio: 'inherit', env });
console.log('Done!');