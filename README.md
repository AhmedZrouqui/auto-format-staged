# auto-format-staged

[![npm version](https://badge.fury.io/js/auto-format-staged.svg)](https://www.npmjs.com/package/auto-format-staged)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Zero-config pre-commit formatter and linter. Automatically detects and uses your project's Prettier and ESLint configuration.

## Features

- 🚀 **30-second setup** - One command and you're done
- 🎯 **Zero configuration** - Uses your existing `.prettierrc` and `.eslintrc`
- 🚫 **Blocks bad commits** - Linting errors prevent commits (warnings don't)
- ⚡ **Lightning fast** - Only processes staged files
- 🪶 **Tiny** - ~ 11.5KB with zero dependencies
- 🔄 **Auto-formats** - Formats code and re-stages files automatically

## Installation
```bash
npm install --save-dev auto-format-staged
npx auto-format-staged
```

Done! Now try committing some messy code:
```bash
echo "const x=1;const   y=2" > test.js
git add test.js
git commit -m "test"
# ✨ File automatically formatted before commit!
```

Every commit will:
1. Lint staged files (errors block commit, warnings don't)
2. Format staged files with Prettier
3. Re-stage formatted files

## Requirements

Your project should have at least one of:
- `prettier` (for formatting)
- `eslint` (for linting)

Both are optional - the tool works with whatever you have installed.

## How It Works

When you commit:
1. Gets list of staged files
2. Detects your project's ESLint config (if installed)
3. Runs linter - **only errors block the commit**
4. Detects your project's Prettier config (if installed)
5. Formats files and re-stages them
6. Commit proceeds

## What Gets Processed

**Linting**: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`  
**Formatting**: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, `.scss`, `.md`, `.html`, `.yml`, `.yaml`

## Uninstall
```bash
rm .git/hooks/pre-commit
npm uninstall auto-format-staged
```

## 🤝 Contributing

Issues and PRs welcome! This is a simple tool, let's keep it that way.

## License

MIT © Ahmed Zrouqui