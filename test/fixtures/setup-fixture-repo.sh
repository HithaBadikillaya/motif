#!/usr/bin/env bash
# Creates a deterministic git repository under test/fixtures/repo/
# for use in Vitest unit tests.
# Safe to run multiple times — skips creation if repo already exists.

set -euo pipefail

# Unset parent git environment variables if running inside git hook/subshell
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES

# Bypass dubious ownership checks for fixture creation on shared mounts
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0="*"

FIXTURE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/repo"

if [ -d "$FIXTURE_DIR/.git" ]; then
  echo "Fixture repo already exists at $FIXTURE_DIR — skipping."
  exit 0
fi

echo "Creating fixture repo at $FIXTURE_DIR…"
rm -rf "$FIXTURE_DIR"
mkdir -p "$FIXTURE_DIR"

cd "$FIXTURE_DIR"

git init -b main

# ── Commit 1: initial structure ──────────────────────────────────────────────
mkdir -p src docs
cat > src/index.ts << 'EOF'
export function hello(): string {
  return 'hello';
}
EOF

cat > README.md << 'EOF'
# Fixture Repo
A small repo used for deterministic testing.
EOF

cat > package.json << 'EOF'
{
  "name": "fixture",
  "version": "0.1.0"
}
EOF

git add .
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "feat: initial project structure"

# ── Commit 2 (Bob): add utils ─────────────────────────────────────────────────
cat > src/utils.ts << 'EOF'
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
EOF

git add src/utils.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "feat(utils): add arithmetic helpers"

# ── Commit 3 (Alice): fix hello ───────────────────────────────────────────────
cat > src/index.ts << 'EOF'
export function hello(name = 'world'): string {
  return `Hello, ${name}!`;
}
EOF

git add src/index.ts
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "fix: accept optional name parameter in hello"

# ── Commit 4 (Carol): docs ───────────────────────────────────────────────────
cat > docs/api.md << 'EOF'
# API Reference
## hello(name?)
Returns a greeting string.
## add(a, b)
Returns the sum of two numbers.
EOF

git add docs/api.md
git -c user.name="Carol" -c user.email="carol@example.com" commit -m "docs: add API reference"

# ── Commit 5 (Bob): churn src/utils.ts ────────────────────────────────────────
cat >> src/utils.ts << 'EOF'

export function multiply(a: number, b: number): number {
  return a * b;
}
EOF

git add src/utils.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "feat(utils): add multiply"

# ── Commit 6 (Alice): chore config ───────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
EOF

git add .gitignore
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "chore: add .gitignore"

# ── Commit 7 (Bob): churn utils again ─────────────────────────────────────────
cat >> src/utils.ts << 'EOF'

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
EOF

git add src/utils.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "feat(utils): add divide with error guard"

# ── Commit 8 (Alice): refactor index ─────────────────────────────────────────
cat > src/index.ts << 'EOF'
import { add } from './utils.js';

export function hello(name = 'world'): string {
  return `Hello, ${name}! 1+1=${add(1,1)}`;
}
EOF

git add src/index.ts
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "refactor: import add in hello"

# ── Commit 9 (Carol): update package.json ─────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "fixture",
  "version": "0.2.0",
  "type": "module"
}
EOF

git add package.json
git -c user.name="Carol" -c user.email="carol@example.com" commit -m "chore(release): bump to 0.2.0"

# ── Tag v0.1.0 at commit 1 ────────────────────────────────────────────────────
git tag v0.1.0 HEAD~7

# ── Commit 10 (Alice): WIP prefix (non-conventional) ─────────────────────────
echo "// TODO" >> src/index.ts
git add src/index.ts
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "WIP: placeholder for future feature"

# ── Commit 11 (Bob): test file ────────────────────────────────────────────────
cat > src/utils.test.ts << 'EOF'
import { add, subtract } from './utils.js';

console.assert(add(1, 2) === 3);
console.assert(subtract(5, 3) === 2);
EOF

git add src/utils.test.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "test: basic assertions for utils"

# ── Commit 12 (Alice): perf ───────────────────────────────────────────────────
cat >> src/utils.ts << 'EOF'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
EOF

git add src/utils.ts
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "perf(utils): add clamp helper"

# ── Branch: feature/auth ──────────────────────────────────────────────────────
git checkout -b feature/auth

cat > src/auth.ts << 'EOF'
export function authenticate(token: string): boolean {
  return token.length > 8;
}
EOF

git add src/auth.ts
git -c user.name="Carol" -c user.email="carol@example.com" commit -m "feat(auth): basic token authentication"

cat >> src/auth.ts << 'EOF'

export function generateToken(): string {
  return Math.random().toString(36).slice(2);
}
EOF

git add src/auth.ts
git -c user.name="Carol" -c user.email="carol@example.com" commit -m "feat(auth): token generation"

# ── Branch: fix/typo (off main) ───────────────────────────────────────────────
git checkout main
git checkout -b fix/typo

node -e "const fs = require('fs'); fs.writeFileSync('src/index.ts', fs.readFileSync('src/index.ts', 'utf8').replace('// TODO', '// TODO: upcoming feature'));"
git add src/index.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "fix: correct typo in WIP comment"

# Return to main
git checkout main

# ── Commit 13 (Alice): rename docs/api.md → docs/reference.md ─────────────────
git mv docs/api.md docs/reference.md
git -c user.name="Alice" -c user.email="alice@example.com" commit -m "docs: rename api.md to reference.md"

# ── Commit 14 (Carol): delete test file ──────────────────────────────────────
git rm src/utils.test.ts
git -c user.name="Carol" -c user.email="carol@example.com" commit -m "chore: remove inline test assertions"

# ── Commit 15 (Bob): final churn on utils ────────────────────────────────────
cat >> src/utils.ts << 'EOF'

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => start + i);
}
EOF

git add src/utils.ts
git -c user.name="Bob" -c user.email="bob@example.com" commit -m "feat(utils): add range helper"

echo "Fixture repo created successfully at $FIXTURE_DIR"
echo "Branches: $(git branch | tr '\n' ' ')"
echo "Tags: $(git tag | tr '\n' ' ')"
echo "Commits on main: $(git rev-list --count HEAD)"
