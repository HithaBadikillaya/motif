import { beforeAll, describe, expect, it } from 'vitest';
import { LocAnalyzer } from '../../src/analyzers/loc.js';
import { ensureFixtureRepo, fixturePath } from '../fixtures/create-fixture.js';

describe('LocAnalyzer', () => {
  beforeAll(async () => {
    await ensureFixtureRepo();
  }, 30_000);

  it('returns at least one extension entry for the fixture repo', async () => {
    const analyzer = new LocAnalyzer();
    const result = await analyzer.analyze({ cwd: fixturePath });
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes TypeScript (.ts) in results', async () => {
    const analyzer = new LocAnalyzer();
    const result = await analyzer.analyze({ cwd: fixturePath });
    const ts = result.find((r) => r.extension === '.ts');
    expect(ts).toBeDefined();
    expect(ts!.files).toBeGreaterThan(0);
    expect(ts!.lines).toBeGreaterThan(0);
  });

  it('sorts results by line count descending', async () => {
    const analyzer = new LocAnalyzer();
    const result = await analyzer.analyze({ cwd: fixturePath });
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.lines).toBeLessThanOrEqual(result[i - 1]!.lines);
    }
  });

  it('each entry has extension, files, and lines properties', async () => {
    const analyzer = new LocAnalyzer();
    const result = await analyzer.analyze({ cwd: fixturePath });
    for (const entry of result) {
      expect(entry).toHaveProperty('extension');
      expect(entry).toHaveProperty('files');
      expect(entry).toHaveProperty('lines');
      expect(typeof entry.files).toBe('number');
      expect(typeof entry.lines).toBe('number');
      expect(entry.files).toBeGreaterThan(0);
      expect(entry.lines).toBeGreaterThanOrEqual(0);
    }
  });

  it('completes within 5 seconds (parallel reads, not serial git show)', async () => {
    const analyzer = new LocAnalyzer();
    const start = Date.now();
    await analyzer.analyze({ cwd: fixturePath });
    expect(Date.now() - start).toBeLessThan(5_000);
  });
});
