# Motif

Motif is a production-grade cross-platform CLI foundation built with Bun and TypeScript.

This initial version focuses on architecture, extensibility, and developer experience. Repository intelligence and AI workflows are intentionally not implemented yet.

## Features

- Commander.js command routing with aliases and helpful errors
- Global and local configuration loading with Zod validation
- Colored output with Chalk
- Ora progress indicators
- Enquirer prompts
- Pino verbose/debug logging
- Ink-ready terminal UI components
- Shell completion preparation
- Graceful structured error handling
- Strict TypeScript, Vitest, ESLint, Prettier, tsup, TypeDoc, Changesets, Husky, and lint-staged

## Install

```bash
bun install
bun run build
```

## Usage

```bash
bun run dev -- --help
bun run dev -- version
bun run dev -- doctor
bun run dev -- init
bun run dev -- completion bash
```

After building:

```bash
./dist/index.js --help
```

## Commands

| Command      | Alias   | Description                                        |
| ------------ | ------- | -------------------------------------------------- |
| `version`    | `v`     | Print the Motif version                            |
| `doctor`     | `check` | Validate the runtime environment and configuration |
| `init`       | `i`     | Create `motif.config.json`                         |
| `completion` |         | Print shell completion setup                       |
| `help`       |         | Show CLI or command help                           |

## Configuration

Motif reads global configuration from:

```text
~/.motif/config.json
```

Motif reads local project configuration from:

```text
motif.config.json
```

Both paths can be overridden:

```bash
motif --global-config ./global.json --config ./motif.config.json doctor
```

Example local config:

```json
{
  "project": "my-project",
  "version": 1,
  "logging": {
    "level": "info"
  },
  "cache": {
    "enabled": true,
    "directory": ".motif/cache"
  },
  "plugins": {
    "enabled": true,
    "directory": ".motif/plugins"
  }
}
```

## Development

```bash
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
```

## Architecture

```text
src/
  ai/            Future AI integration contracts
  analyzers/     Future analysis contracts
  cache/         Cache abstractions
  cli/           Commander commands, runtime context, and UI
  config/        Config schemas, defaults, and loading
  core/          Environment checks, errors, and services
  git/           Git operation contracts
  logging/       Pino logger factory
  parsers/       Parser contracts
  plugins/       Plugin contracts
  providers/     Provider contracts
  types/         Shared public types
  utils/         Small platform utilities
```

## Release Workflow

Use Changesets for versioning:

```bash
bunx changeset
```

CI runs type checking, linting, formatting checks, tests, and builds.
