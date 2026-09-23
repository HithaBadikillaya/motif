import type { CacheStore } from '../../cache/index.js';
import { NullCache } from '../../cache/index.js';
import type { GitCommit, GitHistoryQuery, GitHistoryQueryResult } from '../../types/git.js';
import {
  gitLogFormat,
  gitLogFormatFull,
  parseGitLog,
  parseGitLogFull,
} from '../../parsers/git-log-parser.js';
import { runGit } from './command.js';

export class GitHistoryService {
  constructor(private readonly cache: CacheStore<GitCommit[]> = new NullCache()) {}

  async list(cwd: string, query: GitHistoryQuery = {}): Promise<GitCommit[]> {
    const args = [
      'log',
      `--format=${gitLogFormat}%x1e`,
      `--max-count=${query.limit ?? 100}`,
      `--skip=${query.skip ?? 0}`,
    ];
    if (query.author) args.push(`--author=${query.author}`);
    if (query.since) args.push(`--since=${query.since}`);
    if (query.file) args.push('--', query.file);
    const result = await runGit(args, { cwd });
    return parseGitLog(result.stdout);
  }

  /**
   * List commits with their full body, useful for conventional commit parsing.
   */
  async listFull(
    cwd: string,
    query: GitHistoryQuery = {},
  ): Promise<Array<GitCommit & { body: string }>> {
    const args = [
      'log',
      `--format=${gitLogFormatFull}%x1e`,
      `--max-count=${query.limit ?? 100}`,
      `--skip=${query.skip ?? 0}`,
    ];
    if (query.author) args.push(`--author=${query.author}`);
    if (query.since) args.push(`--since=${query.since}`);
    if (query.file) args.push('--', query.file);
    const result = await runGit(args, { cwd });
    return parseGitLogFull(result.stdout);
  }

  /**
   * Paginated query returning a `GitHistoryQueryResult` with hasMore flag.
   */
  async query(cwd: string, query: GitHistoryQuery = {}): Promise<GitHistoryQueryResult> {
    const limit = query.limit ?? 50;
    // Fetch one extra to detect whether more pages exist
    const commits = await this.list(cwd, { ...query, limit: limit + 1 });
    const hasMore = commits.length > limit;
    return {
      commits: hasMore ? commits.slice(0, limit) : commits,
      total: await this.count(cwd),
      hasMore,
    };
  }

  async count(cwd: string): Promise<number> {
    const result = await runGit(['rev-list', '--count', 'HEAD'], { cwd, allowFailure: true });
    return Number(result.stdout.trim() || '0');
  }

  /**
   * Stream commit history in pages, using the cache to skip already-parsed pages.
   * Each page is keyed by `<cwd>:page:<skip>` so repeated runs re-use cached results.
   */
  async *stream(cwd: string, pageSize = 200): AsyncGenerator<GitCommit[]> {
    let skip = 0;
    while (true) {
      const cacheKey = `history:${cwd}:${pageSize}:${skip}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        yield cached;
        if (cached.length < pageSize) return;
        skip += cached.length;
        continue;
      }

      const page = await this.list(cwd, { limit: pageSize, skip });
      if (page.length === 0) return;
      await this.cache.set(cacheKey, page);
      yield page;
      if (page.length < pageSize) return;
      skip += page.length;
    }
  }

  /**
   * Build a map of day → commit count for the last `days` days.
   */
  async commitsByDay(cwd: string, days = 90): Promise<Array<{ day: string; commits: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const result = await runGit(['log', `--since=${since.toISOString()}`, '--format=%aI'], {
      cwd,
      allowFailure: true,
    });
    const counts = new Map<string, number>();
    for (const line of result.stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const day = trimmed.slice(0, 10); // YYYY-MM-DD
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, commits]) => ({ day, commits }));
  }
}
