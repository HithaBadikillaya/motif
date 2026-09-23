import { beforeAll, describe, expect, it } from 'vitest';
import { GitRepositoryService } from '../../src/core/git/repository.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('GitRepositoryService', () => {
  let service: GitRepositoryService;

  beforeAll(async () => {
    await ensureFixtureRepo();
    service = new GitRepositoryService();
  });

  it('detects git repository information for valid repo', async () => {
    const info = await service.detect(fixturePath);
    expect(info.isRepo).toBe(true);
    expect(info.isBare).toBe(false);
    expect(info.currentBranch).toBe('main');
    expect(info.root).toBe(fixturePath);
  });

  it('validates healthy status for repository', async () => {
    const health = await service.isHealthy(fixturePath);
    expect(health.isRepo).toBe(true);
    expect(health.headResolvable).toBe(true);
    expect(health.hasLockFile).toBe(false);
    expect(health.healthy).toBe(true);
    expect(health.issues).toHaveLength(0);
  });

  it('returns isRepo false for non-git directory', async () => {
    const info = await service.detect('/tmp');
    expect(info.isRepo).toBe(false);
  });

  it('returns isHealthy false for non-git directory', async () => {
    const health = await service.isHealthy('/tmp');
    expect(health.isRepo).toBe(false);
    expect(health.healthy).toBe(false);
    expect(health.issues).toContain('Not a git repository');
  });

  it('finds root from cwd', async () => {
    const root = await service.rootFromCwd(fixturePath);
    expect(root).toBe(fixturePath);
  });
});
