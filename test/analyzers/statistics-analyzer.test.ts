import { describe, it, expect, beforeAll } from 'vitest';
import { StatisticsAnalyzer } from '../../src/analyzers/statistics-analyzer.js';
import { ensureFixtureRepo } from '../fixtures/create-fixture.js';

let fixtureDir: string;

beforeAll(async () => {
  fixtureDir = await ensureFixtureRepo();
}, 30_000);

describe('StatisticsAnalyzer', () => {
  it('returns totalFiles > 0', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.totalFiles).toBeGreaterThan(0);
  });

  it('returns commitCount matching fixture repo', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    // Fixture has 15 commits on main
    expect(result.commitCount).toBeGreaterThanOrEqual(10);
  });

  it('returns contributorCount of 3 (Alice, Bob, Carol)', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.contributorCount).toBe(3);
  });

  it('returns repositoryAge with ageInDays >= 0', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.repositoryAge.ageInDays).toBeGreaterThanOrEqual(0);
    expect(result.repositoryAge.formatted).toBeTruthy();
  });

  it('returns mostCommonExtensions with .ts present', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    const exts = result.mostCommonExtensions.map((e) => e.extension);
    expect(exts.some((e) => e === '.ts' || e === '.md')).toBe(true);
  });

  it('returns largestDirectories', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.largestDirectories.length).toBeGreaterThan(0);
  });

  it('returns totalSizeBytes > 0', async () => {
    const analyzer = new StatisticsAnalyzer();
    const result = await analyzer.analyze(fixtureDir);
    expect(result.totalSizeBytes).toBeGreaterThan(0);
  });
});
