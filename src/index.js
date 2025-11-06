#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Supported file extensions
const SUPPORTED_EXTENSIONS = {
  prettier: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.md', '.html', '.yml', '.yaml'],
  eslint: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
};

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

function detectTool(toolName) {
  const projectRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  const nodeModulesPath = path.join(projectRoot, 'node_modules', toolName);
  
  if (fs.existsSync(nodeModulesPath)) {
    if (toolName === 'prettier') {
      const possiblePaths = [
        path.join(nodeModulesPath, 'bin', 'prettier.cjs'),
        path.join(nodeModulesPath, 'bin', 'prettier.js'),
        path.join(nodeModulesPath, 'bin-prettier.js'),
        path.join(nodeModulesPath, 'index.js')
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
    }
    
    if (toolName === 'eslint') {
      const possiblePaths = [
        path.join(nodeModulesPath, 'bin', 'eslint.js'),
        path.join(nodeModulesPath, 'lib', 'cli.js')
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
    }
  }
  
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${which} ${toolName}`, { encoding: 'utf8', stdio: 'pipe' });
    return toolName;
  } catch {
    return null;
  }
}

function filterFilesByExtension(files, extensions) {
  return files.filter(file => {
    const ext = path.extname(file);
    return extensions.includes(ext) && fs.existsSync(file);
  });
}

function runESLint(files) {
  if (files.length === 0) return { success: true, errors: [] };
  
  const eslintPath = detectTool('eslint');
  if (!eslintPath) {
    console.log('ℹ️  ESLint not found, skipping linting');
    return { success: true, errors: [] };
  }
  
  console.log('🔍 Linting staged files...');
  
  const result = spawnSync('node', [eslintPath, '--format', 'json', ...files], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  try {
    const output = JSON.parse(result.stdout || '[]');
    const errors = [];
    
    output.forEach(file => {
      if (file.errorCount > 0) {
        file.messages.forEach(msg => {
          if (msg.severity === 2) { // Only errors, not warnings
            errors.push({
              file: file.filePath,
              line: msg.line,
              column: msg.column,
              message: msg.message,
              rule: msg.ruleId
            });
          }
        });
      }
    });
    
    return { success: errors.length === 0, errors };
  } catch (error) {
    console.warn('⚠️  Could not parse ESLint output, proceeding anyway');
    return { success: true, errors: [] };
  }
}

function runPrettier(files) {
  if (files.length === 0) return;
  
  const prettierPath = detectTool('prettier');
  if (!prettierPath) {
    console.log('ℹ️  Prettier not found, skipping formatting');
    return;
  }
  
  console.log('✨ Formatting staged files...');
  
  let command, args;
  
  if (prettierPath === 'prettier') {
    command = 'npx';
    args = ['prettier', '--write', '--ignore-unknown', ...files];
  } else {
    command = 'npx';
    args = ['prettier', '--write', '--ignore-unknown', ...files];
  }
  
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status === 0) {
    files.forEach(file => {
      try {
        execSync(`git add "${file}"`, { stdio: 'pipe' });
      } catch (error) {
      }
    });
  }
}

function printErrors(errors) {
  console.error('\n❌ Linting errors found:\n');
  
  errors.forEach(err => {
    const relativePath = path.relative(process.cwd(), err.file);
    console.error(`  ${relativePath}:${err.line}:${err.column}`);
    console.error(`    ${err.message} ${err.rule ? `(${err.rule})` : ''}`);
  });
  
  console.error(`\n${errors.length} error(s) found. Fix them before committing.\n`);
}

function main() {
  const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
  if (fs.existsSync(path.join(gitDir, 'rebase-merge')) || 
      fs.existsSync(path.join(gitDir, 'MERGE_HEAD'))) {
    console.log('ℹ️  Rebase/merge in progress, skipping hooks');
    process.exit(0);
  }
  
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged files to process');
    process.exit(0);
  }
  
  const lintFiles = filterFilesByExtension(stagedFiles, SUPPORTED_EXTENSIONS.eslint);
  const formatFiles = filterFilesByExtension(stagedFiles, SUPPORTED_EXTENSIONS.prettier);
  
  if (lintFiles.length > 0) {
    const lintResult = runESLint(lintFiles);
    
    if (!lintResult.success) {
      printErrors(lintResult.errors);
      process.exit(1);
    }
    
    console.log('✅ Linting passed');
  }
  
  if (formatFiles.length > 0) {
    runPrettier(formatFiles);
    console.log('✅ Formatting complete');
  }
  
  console.log('🎉 Ready to commit!\n');
  process.exit(0);
}

main();