import { describe, it, expect, beforeAll } from 'vitest';
import { WorkspaceAnalyzer } from '../../src/analyzers/workspace-analyzer.js';
import { ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  paths = await ensureScenarioFixtures();
}, 60_000);

describe('WorkspaceAnalyzer', () => {
  it('detects pnpm monorepo', async () => {
    const analyzer = new WorkspaceAnalyzer();
    const result = await analyzer.analyze(paths.monorepo);
    expect(result.isMonorepo).toBe(true);
    expect(['pnpm', 'turbo']).toContain(result.monorepoType);
    expect(result.packageCount).toBeGreaterThan(0);
  });

  it('enumerates monorepo packages', async () => {
    const analyzer = new WorkspaceAnalyzer();
    const result = await analyzer.analyze(paths.monorepo);
    const names = result.packages.map((p) => p.name);
    // Packages: @repo/ui, @repo/utils, @repo/web
    expect(names.length).toBeGreaterThanOrEqual(3);
  });

  it('returns isMonorepo=false for single-package repos', async () => {
    const analyzer = new WorkspaceAnalyzer();
    const result = await analyzer.analyze(paths.react);
    expect(result.isMonorepo).toBe(false);
    expect(result.monorepoType).toBe('none');
  });

  it('returns isMonorepo=false for plain git repos with no package.json', async () => {
    const analyzer = new WorkspaceAnalyzer();
    const result = await analyzer.analyze(paths.empty);
    expect(result.isMonorepo).toBe(false);
  });

  it('each package has path, relativePath, and name', async () => {
    const analyzer = new WorkspaceAnalyzer();
    const result = await analyzer.analyze(paths.monorepo);
    for (const pkg of result.packages) {
      expect(pkg.name).toBeTruthy();
      expect(pkg.path).toBeTruthy();
      expect(pkg.relativePath).toBeTruthy();
    }
  });
});
