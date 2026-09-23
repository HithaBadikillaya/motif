import { beforeAll, describe, expect, it } from 'vitest';
import { GitRefsService } from '../../src/core/git/refs.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitRefsService', () => {
  let service: GitRefsService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    service = new GitRefsService();
  });

  it('enumerates local branches', async () => {
    const branches = await service.branches(fixturePath);
    const names = branches.map((b) => b.name);
    expect(names).toContain('main');
    expect(names).toContain('feature/auth');
    expect(names).toContain('fix/typo');
  });

  it('identifies the current branch', async () => {
    const current = await service.currentBranch(fixturePath);
    expect(current).toBe('main');
  });

  it('enumerates repository tags', async () => {
    const tags = await service.tags(fixturePath);
    const tagNames = tags.map((t) => t.name);
    expect(tagNames).toContain('v0.1.0');
  });
});
