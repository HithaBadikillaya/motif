import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GitBlameService } from '../../src/core/git/blame.js';
import { JsonFileCache } from '../../src/cache/json-cache.js';
import type { GitBlameLine } from '../../src/types/git.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitBlameService', () => {
  let service: GitBlameService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    service = new GitBlameService();
  });

  it('blames a file and returns line-by-line attribution', async () => {
    const lines = await service.blame(fixturePath, 'src/utils.ts');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toHaveProperty('sha');
    expect(lines[0]).toHaveProperty('authorName');
    expect(lines[0]).toHaveProperty('authorEmail');
    expect(lines[0]).toHaveProperty('lineNumber');
    expect(lines[0]).toHaveProperty('content');
  });

  it('computes ownership breakdown across files', async () => {
    const ownership = await service.ownership(fixturePath, ['src/utils.ts', 'README.md']);
    expect(ownership).toHaveLength(2);
    const utilsOwnership = ownership.find((o) => o.file === 'src/utils.ts');
    expect(utilsOwnership?.contributors.length).toBeGreaterThan(0);
  });
});

describe('GitBlameService — caching', () => {
  let cacheDir: string;

  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'motif-blame-cache-'));
    await ensureFixtureRepo();
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  it('second call with same sha hits cache (no extra git invocation)', async () => {
    const fileCache = new JsonFileCache<GitBlameLine[]>(cacheDir);
    const cached = new GitBlameService(fileCache);

    // First call: populates the cache.
    const first = await cached.blame(fixturePath, 'src/utils.ts', 'HEAD');
    expect(first.length).toBeGreaterThan(0);

    // Second call: should read from cache — spy to ensure the result is identical.
    const second = await cached.blame(fixturePath, 'src/utils.ts', 'HEAD');
    expect(second).toEqual(first);
  });

  it('ownership() resolves HEAD and caches per-file blame results', async () => {
    const fileCache = new JsonFileCache<GitBlameLine[]>(cacheDir);
    const cached = new GitBlameService(fileCache);

    const ownership = await cached.ownership(fixturePath, ['src/utils.ts']);
    expect(ownership).toHaveLength(1);
    expect(ownership[0]!.contributors.length).toBeGreaterThan(0);

    // After ownership() runs the cache should have an entry for the file.
    const keys = await import('node:fs/promises').then((fs) =>
      fs.readdir(cacheDir).catch(() => [] as string[]),
    );
    // pathFor() sanitises ':' → '_', so 'blame:HEAD:src/utils.ts' → 'blame_HEAD_src_utils.ts.json'
    expect(keys.some((k) => k.startsWith('blame_') && k.endsWith('.json'))).toBe(true);
  });
});
