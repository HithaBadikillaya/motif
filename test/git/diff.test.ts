import { beforeAll, describe, expect, it } from 'vitest';
import { GitDiffService } from '../../src/core/git/diff.js';
import { GitHistoryService } from '../../src/core/git/history.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitDiffService', () => {
  let diffService: GitDiffService;
  let historyService: GitHistoryService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    diffService = new GitDiffService();
    historyService = new GitHistoryService();
  });

  it('parses commit stats for a specific SHA', async () => {
    const commits = await historyService.list(fixturePath, { limit: 1 });
    const latestSha = commits[0]?.sha ?? '';
    const stats = await diffService.commitStats(fixturePath, latestSha);
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0]).toHaveProperty('file');
    expect(stats[0]).toHaveProperty('additions');
    expect(stats[0]).toHaveProperty('deletions');
  });

  it('parses diff between branches', async () => {
    const diffs = await diffService.branchDiff(fixturePath, 'main', 'feature/auth');
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs.some((d) => d.path === 'src/auth.ts')).toBe(true);
  });
});
