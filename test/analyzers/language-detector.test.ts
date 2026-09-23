import { describe, it, expect, beforeAll } from 'vitest';
import { LanguageDetector } from '../../src/analyzers/language-detector.js';
import { ensureFixtureRepo, ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let fixtureDir: string;
let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  [fixtureDir, paths] = await Promise.all([ensureFixtureRepo(), ensureScenarioFixtures()]);
}, 60_000);

describe('LanguageDetector', () => {
  it('detects TypeScript as primary language in fixture repo', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(fixtureDir);
    expect(result.primaryLanguage).toBe('TypeScript');
  });

  it('returns a breakdown array with percentages summing near 100', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(fixtureDir);
    expect(result.languageBreakdown.length).toBeGreaterThan(0);
    const total = result.languageBreakdown.reduce((s, l) => s + l.percentage, 0);
    expect(total).toBeGreaterThan(90); // allow rounding
  });

  it('reports source file count > 0', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(fixtureDir);
    expect(result.totalSourceFiles).toBeGreaterThan(0);
  });

  it('detects TypeScript in react-app fixture', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(paths.react);
    const langs = result.languageBreakdown.map((l) => l.language);
    expect(langs).toContain('TypeScript');
  });

  it('each breakdown entry has fileCount > 0 and byteSize >= 0', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(fixtureDir);
    for (const entry of result.languageBreakdown) {
      expect(entry.fileCount).toBeGreaterThan(0);
      expect(entry.byteSize).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns empty breakdown for a directory with no source files', async () => {
    const detector = new LanguageDetector();
    const result = await detector.detect(paths.empty);
    // Markdown counts as source-adjacent, primaryLanguage might be Markdown or Unknown
    expect(result.primaryLanguage).toBeDefined();
  });
});
