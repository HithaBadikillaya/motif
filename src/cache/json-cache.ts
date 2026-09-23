import { access, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { CacheStore } from './index.js';

export class JsonFileCache<T> implements CacheStore<T> {
  constructor(private readonly directory: string) {}

  async get(key: string): Promise<T | undefined> {
    try {
      return JSON.parse(await readFile(this.pathFor(key), 'utf8')) as T;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: T): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(value)}\n`);
  }

  async has(key: string): Promise<boolean> {
    try {
      await access(this.pathFor(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.pathFor(key));
    } catch {}
  }

  async clear(): Promise<void> {
    try {
      const entries = await readdir(this.directory);
      await Promise.all(
        entries
          .filter((name) => name.endsWith('.json'))
          .map((name) => unlink(join(this.directory, name)).catch(() => {})),
      );
    } catch {
      // Directory may not exist yet — nothing to clear.
    }
  }

  private pathFor(key: string): string {
    return join(this.directory, `${key.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`);
  }
}
