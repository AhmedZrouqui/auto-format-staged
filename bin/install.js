#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOK_SCRIPT = `#!/bin/sh
# auto-format-staged hook
node ./node_modules/auto-format-staged/src/index.js
`;

function findGitRoot() {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
    return gitRoot;
  } catch (error) {
    console.error('❌ Error: Not a git repository');
    process.exit(1);
  }
}

function installHook() {
  console.log('🔧 Installing auto-format-staged...\n');
  
  const gitRoot = findGitRoot();
  const hooksDir = path.join(gitRoot, '.git', 'hooks');
  const hookPath = path.join(hooksDir, 'pre-commit');
  
  if (!fs.existsSync(hooksDir)) {
    console.error('❌ Error: .git/hooks directory not found');
    process.exit(1);
  }
  
  if (fs.existsSync(hookPath)) {
    const existingHook = fs.readFileSync(hookPath, 'utf8');
    
    if (existingHook.includes('auto-format-staged')) {
      console.log('✅ Hook already installed!');
      return;
    }
    
    const backupPath = `${hookPath}.backup-${Date.now()}`;
    fs.copyFileSync(hookPath, backupPath);
    console.log(`📦 Backed up existing hook to: ${path.basename(backupPath)}`);
    
    fs.appendFileSync(hookPath, '\n' + HOOK_SCRIPT);
  } else {
    fs.writeFileSync(hookPath, HOOK_SCRIPT);
    fs.chmodSync(hookPath, '755');
  }
  
  console.log('✅ Pre-commit hook installed successfully!');
  console.log('\nNow when you commit:');
  console.log('  • Staged files will be linted (errors block commit)');
  console.log('  • Staged files will be formatted automatically');
  console.log('  • Only changed files are processed\n');
}

installHook();