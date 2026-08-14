# Motif

Motif is a cross-platform CLI foundation built with Bun and TypeScript.

## Features

- **Git Repository Engine**: Native git parsing for history, branches, tags, diffs, blame, churn, and conventional commits
- **Performance & Caching**: Streaming/incremental log parsing with JSON file caching keyed by commit SHA
- **Commander.js Command Routing**: Clean command architecture with options, validation, and structured output
- **Environment Diagnostics**: Extended `doctor` command validating Node/Bun runtimes, configuration, git CLI availability, and repo health
- **Global & Local Configuration**: Zod-validated configuration loading (`~/.motif/config.json` and `motif.config.json`)
- **Strict Developer Standards**: TypeScript, Vitest, ESLint, Prettier, tsup, TypeDoc, Changesets, Husky, and lint-staged

## Engine Design & Rationale

### Subprocess `git` Engine vs `isomorphic-git` / `simple-git`

Motif chooses system `git` subprocess execution via Node's `execFile` / `Readable` streams over JS reimplementations (`isomorphic-git`) or wrapper libraries (`simple-git`):

- **Performance**: Native C git handles large history traversals and packfile decompression orders of magnitude faster than pure JS engines.
- **Zero Native Binary Overhead**: Shells directly to installed `git` binaries — no native node-gyp bindings or binary downloads required.
- **Safety**: Runs with `GIT_OPTIONAL_LOCKS=0` to prevent background index locking and safe directory configuration overrides.
- **Streaming & Pagination**: Built-in `stream()` async generator and paginated queries prevent loading full repository logs into memory.

## Install

```bash
bun install
bun run build
```

## Usage

```bash
bun run dev -- --help
bun run dev -- analyze
bun run dev -- history --author "Alice" --limit 10
bun run dev -- stats
bun run dev -- doctor
```

After building:

```bash
./dist/index.js analyze
```

## Commands

| Command      | Alias   | Description                                                             |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `analyze`    |         | Run full repository analysis (commits, churn hotspots, branch health)   |
| `history`    |         | Query commit history with `--author`, `--since`, `--file` filters       |
| `stats`      |         | Repository statistics (LOC by extension, commit frequency, top authors) |
| `doctor`     | `check` | Validate runtime environment, config, git availability, & repo health   |
| `init`       | `i`     | Create `motif.config.json`                                              |
| `version`    | `v`     | Print the Motif version                                                 |
| `completion` |         | Print shell completion setup                                            |
| `help`       |         | Show CLI or command help                                                |

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
  analyzers/     Repository analyzers (churn, conventional commit patterns, LOC, contributors)
  cache/         Cache abstractions & JSON file cache store
  cli/           Commander commands (analyze, history, stats, doctor, init, completion)
  config/        Config schemas, defaults, and loading
  core/
    errors/      Error definitions & formatting
    git/         Git services (repository, history, diff, refs, blame, metadata, status)
  logging/       Pino logger factory
  parsers/       Parsers (git log, unified diff, shortlog, conventional commits)
  types/         Shared strict TypeScript interfaces (git, runtime, config)
  utils/         File system and package helpers
```

## Release Workflow

Use Changesets for versioning:

```bash
bunx changeset
```

CI runs type checking, linting, formatting checks, tests, and builds.
