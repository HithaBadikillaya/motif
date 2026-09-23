import { describe, it, expect, beforeAll } from 'vitest';
import { DependencyAnalyzer } from '../../src/analyzers/dependency-analyzer.js';
import { ensureFixtureRepo, ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let fixtureDir: string;
let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  [fixtureDir, paths] = await Promise.all([ensureFixtureRepo(), ensureScenarioFixtures()]);
}, 60_000);

describe('DependencyAnalyzer', () => {
  it('returns hasPackageJson=false for empty-git fixture', async () => {
    const analyzer = new DependencyAnalyzer();
    const result = await analyzer.analyze(paths.empty);
    expect(result.hasPackageJson).toBe(false);
    expect(result.prodDependenciesCount).toBe(0);
  });

  it('reads basic fixture repo package.json', async () => {
    const analyzer = new DependencyAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.hasPackageJson).toBe(true);
    expect(result.name).toBe('fixture');
  });

  it('counts production and dev dependencies correctly for react-app', async () => {
    const analyzer = new DependencyAnalyzer();
    const result = await analyzer.analyze(paths.react);
    expect(result.hasPackageJson).toBe(true);
    expect(result.prodDependenciesCount).toBe(2); // react + react-dom
    expect(result.devDependenciesCount).toBeGreaterThan(0);
  });

  it('returns scripts from package.json', async () => {
    const analyzer = new DependencyAnalyzer();
    const result = await analyzer.analyze(paths.react);
    expect(result.scriptsCount).toBeGreaterThan(0);
    expect(result.scripts).toHaveProperty('dev');
  });

  it('returns typed dependency maps', async () => {
    const analyzer = new DependencyAnalyzer();
    const result = await analyzer.analyze(paths.nextjs);
    expect(result.prodDependencies).toHaveProperty('next');
    expect(result.devDependencies).toHaveProperty('typescript');
  });
});
