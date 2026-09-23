import { describe, it, expect, beforeAll } from 'vitest';
import { RepositoryEngine } from '../../src/analyzers/repository-engine.js';
import { ensureFixtureRepo, ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let fixtureDir: string;
let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  [fixtureDir, paths] = await Promise.all([ensureFixtureRepo(), ensureScenarioFixtures()]);
}, 90_000);

describe('RepositoryEngine', () => {
  it('produces a complete RepositoryModel for the fixture repo', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: fixtureDir });

    expect(model.git.isRepo).toBe(true);
    expect(model.git.currentBranch).toBe('main');
    expect(model.project.primaryLanguage).toBe('TypeScript');
    expect(model.stats.commitCount).toBeGreaterThanOrEqual(10);
    expect(model.stats.contributorCount).toBe(3);
    expect(model.analyzedAt).toBeTruthy();
  });

  it('model.path equals the repository root', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: fixtureDir });
    expect(model.path).toBe(fixtureDir);
  });

  it('detects Next.js in nextjs-app scenario', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: paths.nextjs });
    const names = model.project.frameworks.map((f) => f.name);
    expect(names).toContain('Next.js');
    expect(model.project.primaryFramework).toBe('Next.js');
    expect(model.project.packageManager.name).toBe('pnpm');
  });

  it('detects monorepo in monorepo scenario', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: paths.monorepo });
    expect(model.workspace.isMonorepo).toBe(true);
    expect(model.workspace.packageCount).toBeGreaterThan(0);
  });

  it('handles non-git directory gracefully', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: '/tmp' });
    expect(model.git.isRepo).toBe(false);
  });

  it('model has correct shape (all top-level keys present)', async () => {
    const engine = new RepositoryEngine();
    const model = await engine.analyze({ cwd: fixtureDir });
    expect(model).toHaveProperty('git');
    expect(model).toHaveProperty('project');
    expect(model).toHaveProperty('stats');
    expect(model).toHaveProperty('dependencies');
    expect(model).toHaveProperty('workspace');
    expect(model).toHaveProperty('analyzedAt');
  });

  it('completes analysis within 10 seconds', async () => {
    const engine = new RepositoryEngine();
    const start = Date.now();
    await engine.analyze({ cwd: fixtureDir });
    expect(Date.now() - start).toBeLessThan(10_000);
  });
});
