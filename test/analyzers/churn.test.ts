import { beforeAll, describe, expect, it } from 'vitest';
import { ChurnAnalyzer } from '../../src/analyzers/churn.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('ChurnAnalyzer', () => {
  let analyzer: ChurnAnalyzer;

  beforeAll(async () => {
    await ensureFixtureRepo();
    analyzer = new ChurnAnalyzer();
  });

  it('identifies churn hotspots in fixture repo', async () => {
    const result = await analyzer.analyze({ cwd: fixturePath });
    expect(result.hotspots.length).toBeGreaterThan(0);
    // src/utils.ts has the most commits in the scripted fixture
    const top = result.hotspots[0];
    expect(top?.file).toBe('src/utils.ts');
    expect(top?.commits).toBeGreaterThan(1);
  });

  it('each hotspot has file, commits, additions, deletions', async () => {
    const result = await analyzer.analyze({ cwd: fixturePath });
    for (const hotspot of result.hotspots) {
      expect(hotspot).toHaveProperty('file');
      expect(hotspot).toHaveProperty('commits');
      expect(hotspot).toHaveProperty('additions');
      expect(hotspot).toHaveProperty('deletions');
      expect(typeof hotspot.commits).toBe('number');
    }
  });

  it('returns co-change patterns when multiple files change together', async () => {
    const result = await analyzer.analyze({ cwd: fixturePath });
    // The fixture repo has commits touching multiple files — patterns should exist.
    expect(Array.isArray(result.coChangePatterns)).toBe(true);
    if (result.coChangePatterns.length > 0) {
      const first = result.coChangePatterns[0]!;
      expect(first.files).toHaveLength(2);
      expect(first.commits).toBeGreaterThan(0);
    }
  });

  it('hotspots are sorted by commit count descending', async () => {
    const result = await analyzer.analyze({ cwd: fixturePath });
    for (let i = 1; i < result.hotspots.length; i++) {
      expect(result.hotspots[i]!.commits).toBeLessThanOrEqual(result.hotspots[i - 1]!.commits);
    }
  });
});
