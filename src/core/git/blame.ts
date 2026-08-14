import type { CacheStore } from '../../cache/index.js';
import { NullCache } from '../../cache/index.js';
import type { GitBlameLine, GitOwnership } from '../../types/git.js';
import { runGit } from './command.js';

export class GitBlameService {
  constructor(private readonly cache: CacheStore<GitBlameLine[]> = new NullCache()) {}

  /**
   * Run `git blame --line-porcelain` on a file, returning per-line attribution.
   * Results are cached by `<sha>:<file>` when a sha is available.
   */
  async blame(cwd: string, file: string, sha?: string): Promise<GitBlameLine[]> {
    const cacheKey = sha ? `blame:${sha}:${file}` : undefined;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const args = sha
      ? ['blame', '--line-porcelain', sha, '--', file]
      : ['blame', '--line-porcelain', '--', file];
    const result = await runGit(args, { cwd, allowFailure: true });

    const lines: GitBlameLine[] = [];
    let currentSha = '';
    let authorName = '';
    let authorEmail = '';
    let lineNumber = 0;

    for (const line of result.stdout.split('\n')) {
      const header = /^([0-9a-f]{40}) \d+ (\d+)/.exec(line);
      if (header) {
        currentSha = header[1] ?? '';
        lineNumber = Number(header[2] ?? '0');
      } else if (line.startsWith('author ')) {
        authorName = line.replace('author ', '');
      } else if (line.startsWith('author-mail ')) {
        authorEmail = line.replace('author-mail ', '').replace(/[<>]/g, '');
      } else if (line.startsWith('\t')) {
        lines.push({
          sha: currentSha,
          authorName,
          authorEmail,
          lineNumber,
          content: line.slice(1),
        });
      }
    }

    if (cacheKey && lines.length > 0) await this.cache.set(cacheKey, lines);
    return lines;
  }

  async ownership(cwd: string, files: string[]): Promise<GitOwnership[]> {
    const ownership: GitOwnership[] = [];
    for (const file of files) {
      const counts = new Map<string, { name: string; email: string; lines: number }>();
      for (const line of await this.blame(cwd, file)) {
        const key = `${line.authorName}<${line.authorEmail}>`;
        const current = counts.get(key) ?? {
          name: line.authorName,
          email: line.authorEmail,
          lines: 0,
        };
        current.lines += 1;
        counts.set(key, current);
      }
      ownership.push({
        file,
        contributors: [...counts.values()].sort((a, b) => b.lines - a.lines),
      });
    }
    return ownership;
  }
}
