#!/usr/bin/env bash
# Creates typed scenario fixtures for Phase 2 Repository Intelligence Engine tests.
# Idempotent — detects existence of each fixture before creating.
set -euo pipefail

unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0="*"

FIXTURES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scenarios"
mkdir -p "$FIXTURES_DIR"

git_commit() {
  git -c user.name="Test User" -c user.email="test@example.com" commit -m "$1"
}

# ── React ────────────────────────────────────────────────────────────────────
make_react() {
  local DIR="$FIXTURES_DIR/react-app"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  cat > package.json << 'EOF'
{
  "name": "react-app",
  "version": "1.0.0",
  "dependencies": { "react": "^18.0.0", "react-dom": "^18.0.0" },
  "devDependencies": { "vite": "^5.0.0", "vitest": "^1.0.0", "typescript": "^5.0.0", "eslint": "^8.0.0", "prettier": "^3.0.0" },
  "scripts": { "dev": "vite", "build": "vite build", "test": "vitest" }
}
EOF
  touch vite.config.ts .eslintrc.json .prettierrc
  mkdir -p src
  echo "export default function App() { return <h1>Hello</h1>; }" > src/App.tsx
  echo "import './App'" > src/main.tsx
  touch yarn.lock
  git add . && git_commit "feat: initial react app"
  cd "$FIXTURES_DIR"
}

# ── Next.js ──────────────────────────────────────────────────────────────────
make_nextjs() {
  local DIR="$FIXTURES_DIR/nextjs-app"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  cat > package.json << 'EOF'
{
  "name": "nextjs-app",
  "version": "1.0.0",
  "dependencies": { "next": "^14.0.0", "react": "^18.0.0", "react-dom": "^18.0.0" },
  "devDependencies": { "typescript": "^5.0.0", "eslint": "^8.0.0", "prettier": "^3.0.0", "@playwright/test": "^1.40.0" },
  "scripts": { "dev": "next dev", "build": "next build", "test": "playwright test" }
}
EOF
  touch next.config.ts tsconfig.json .eslintrc.json .prettierrc
  mkdir -p app
  echo "export default function Page() { return <h1>Home</h1>; }" > app/page.tsx
  touch pnpm-lock.yaml
  git add . && git_commit "feat: initial next.js app"
  cd "$FIXTURES_DIR"
}

# ── Express API ───────────────────────────────────────────────────────────────
make_express() {
  local DIR="$FIXTURES_DIR/express-api"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  cat > package.json << 'EOF'
{
  "name": "express-api",
  "version": "1.0.0",
  "dependencies": { "express": "^4.18.0" },
  "devDependencies": { "typescript": "^5.0.0", "jest": "^29.0.0", "@types/express": "^4.17.0", "tsup": "^8.0.0", "eslint": "^8.0.0" },
  "scripts": { "start": "node dist/index.js", "build": "tsup", "test": "jest" }
}
EOF
  touch tsconfig.json tsup.config.ts package-lock.json eslint.config.js
  mkdir -p src
  cat > src/index.ts << 'EOF'
import express from 'express';
const app = express();
app.get('/', (_, res) => res.json({ ok: true }));
app.listen(3000);
EOF
  git add . && git_commit "feat: initial express API"
  cd "$FIXTURES_DIR"
}

# ── Bun project ───────────────────────────────────────────────────────────────
make_bun() {
  local DIR="$FIXTURES_DIR/bun-app"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  cat > package.json << 'EOF'
{
  "name": "bun-app",
  "version": "1.0.0",
  "packageManager": "bun@1.1.20",
  "dependencies": { "hono": "^4.0.0", "elysia": "^1.0.0" },
  "devDependencies": { "typescript": "^5.0.0", "biome": "^1.0.0" },
  "scripts": { "dev": "bun run src/index.ts", "test": "bun test" }
}
EOF
  touch bun.lock tsconfig.json biome.json
  mkdir -p src
  echo "import { Hono } from 'hono'; const app = new Hono(); export default app;" > src/index.ts
  git add . && git_commit "feat: initial bun/hono app"
  cd "$FIXTURES_DIR"
}

# ── Monorepo (pnpm) ──────────────────────────────────────────────────────────
make_monorepo() {
  local DIR="$FIXTURES_DIR/monorepo"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  cat > package.json << 'EOF'
{
  "name": "my-monorepo",
  "version": "0.0.0",
  "private": true,
  "scripts": { "build": "turbo build", "test": "turbo test", "dev": "turbo dev" },
  "devDependencies": { "turbo": "^1.0.0", "typescript": "^5.0.0" }
}
EOF
  cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/*'
EOF
  touch turbo.json pnpm-lock.yaml
  mkdir -p packages/ui packages/utils apps/web
  cat > packages/ui/package.json << 'EOF'
{ "name": "@repo/ui", "version": "0.0.1" }
EOF
  cat > packages/utils/package.json << 'EOF'
{ "name": "@repo/utils", "version": "0.0.1" }
EOF
  cat > apps/web/package.json << 'EOF'
{ "name": "@repo/web", "version": "0.0.1", "dependencies": { "next": "^14.0.0" } }
EOF
  echo "export const Button = () => null;" > packages/ui/index.ts
  echo "export const add = (a: number, b: number) => a + b;" > packages/utils/index.ts
  git add . && git_commit "feat: initial monorepo setup"
  cd "$FIXTURES_DIR"
}

# ── Empty Git repository ──────────────────────────────────────────────────────
make_empty() {
  local DIR="$FIXTURES_DIR/empty-git"
  [ -d "$DIR/.git" ] && return 0
  rm -rf "$DIR" && mkdir -p "$DIR" && cd "$DIR"
  git init -b main
  echo "# Empty" > README.md
  git add . && git_commit "chore: initial commit"
  cd "$FIXTURES_DIR"
}

make_react
make_nextjs
make_express
make_bun
make_monorepo
make_empty

echo "All Phase 2 scenario fixtures created at $FIXTURES_DIR"
