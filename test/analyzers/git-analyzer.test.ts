import { describe, it, expect, beforeAll } from 'vitest';
import { GitAnalyzer } from '../../src/analyzers/git-analyzer.js';
import { ensureFixtureRepo } from '../fixtures/create-fixture.js';

let fixtureDir: string;

beforeAll(async () => {
  fixtureDir = await ensureFixtureRepo();
}, 30_000);

describe('GitAnalyzer', () => {
  it('detects a valid git repository', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    expect(result.isRepo).toBe(true);
    expect(result.root).toBe(fixtureDir);
    expect(result.gitDir).toBeTruthy();
  });

  it('detects current branch', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    expect(result.currentBranch).toBe('main');
    expect(result.isDetachedHead).toBe(false);
  });

  it('detects clean working tree', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    expect(result.isClean).toBe(true);
    expect(result.stagedCount).toBe(0);
    expect(result.unstagedCount).toBe(0);
    expect(result.isMergeConflict).toBe(false);
  });

  it('returns headSha as 40-char hex', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    expect(result.headSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('returns structured remotes array', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    // Fixture repo has no remotes — should be empty array, not throw
    expect(Array.isArray(result.remotes)).toBe(true);
  });

  it('returns empty submodules for plain repo', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze(fixtureDir);

    expect(result.submodules).toEqual([]);
  });

  it('returns isRepo=false for a non-git directory', async () => {
    const analyzer = new GitAnalyzer();
    const result = await analyzer.analyze('/tmp');

    expect(result.isRepo).toBe(false);
    expect(result.stagedCount).toBe(0);
  });
});
