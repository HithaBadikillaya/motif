import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JsonFileCache } from '../../src/cache/json-cache.js';

describe('JsonFileCache', () => {
  let dir: string;
  let cache: JsonFileCache<unknown>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'motif-cache-test-'));
    cache = new JsonFileCache(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns undefined for a missing key', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('stores and retrieves a value', async () => {
    await cache.set('key1', { foo: 'bar', count: 42 });
    const result = await cache.get('key1');
    expect(result).toEqual({ foo: 'bar', count: 42 });
  });

  it('has() returns false for missing key', async () => {
    expect(await cache.has('missing')).toBe(false);
  });

  it('has() returns true after set()', async () => {
    await cache.set('present', [1, 2, 3]);
    expect(await cache.has('present')).toBe(true);
  });

  it('delete() removes a key', async () => {
    await cache.set('toDelete', 'value');
    await cache.delete('toDelete');
    expect(await cache.has('toDelete')).toBe(false);
  });

  it('delete() is idempotent on missing keys', async () => {
    await expect(cache.delete('never-existed')).resolves.toBeUndefined();
  });

  it('clear() removes all entries', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.set('c', 3);
    await cache.clear();
    expect(await cache.has('a')).toBe(false);
    expect(await cache.has('b')).toBe(false);
    expect(await cache.has('c')).toBe(false);
  });

  it('clear() is safe when the directory is empty', async () => {
    await expect(cache.clear()).resolves.toBeUndefined();
  });

  it('clear() is safe when the directory does not exist yet', async () => {
    const nonExistentDir = join(dir, 'sub', 'dir');
    const c = new JsonFileCache(nonExistentDir);
    await expect(c.clear()).resolves.toBeUndefined();
  });

  it('normalises special characters in keys', async () => {
    // Keys with slashes or colons should not produce path traversal.
    await cache.set('history:repo:0:200', ['commit1', 'commit2']);
    const result = await cache.get('history:repo:0:200');
    expect(result).toEqual(['commit1', 'commit2']);
  });

  it('stores arrays and complex objects correctly', async () => {
    const payload = [{ sha: 'abc', message: 'feat: test', parents: ['def'] }];
    await cache.set('commits', payload);
    expect(await cache.get('commits')).toEqual(payload);
  });
});
