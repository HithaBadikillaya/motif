import { beforeAll, describe, expect, it } from 'vitest';
import { GitHistoryService } from '../../src/core/git/history.js';
import type { GitCommit } from '../../src/types/git.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitHistoryService', () => {
  let service: GitHistoryService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    service = new GitHistoryService();
  });

  it('lists all commits on main branch', async () => {
    const commits = await service.list(fixturePath, { limit: 100 });
    expect(commits.length).toBe(15);
    expect(commits[0]?.message).toContain('feat(utils): add range helper');
  });

  it('filters commits by author', async () => {
    const commits = await service.list(fixturePath, { author: 'Alice' });
    expect(commits.length).toBeGreaterThan(0);
    expect(commits.every((c) => c.authorName === 'Alice')).toBe(true);
  });

  it('filters commits by file path', async () => {
    const commits = await service.list(fixturePath, { file: 'src/utils.ts' });
    expect(commits.length).toBeGreaterThan(0);
  });

  it('counts total commits', async () => {
    const count = await service.count(fixturePath);
    expect(count).toBe(15);
  });

  it('queries with pagination support', async () => {
    const page1 = await service.query(fixturePath, { limit: 5 });
    expect(page1.commits).toHaveLength(5);
    expect(page1.hasMore).toBe(true);
    expect(page1.total).toBe(15);
  });

  it('streams commit pages', async () => {
    const pages: GitCommit[][] = [];
    for await (const page of service.stream(fixturePath, 5)) {
      pages.push(page);
    }
    const totalStreamed = pages.reduce((sum, p) => sum + p.length, 0);
    expect(totalStreamed).toBe(15);
  });

  it('aggregates commits by day', async () => {
    const days = await service.commitsByDay(fixturePath, 365);
    expect(days.length).toBeGreaterThan(0);
    expect(days[0]).toHaveProperty('day');
    expect(days[0]).toHaveProperty('commits');
  });
});
