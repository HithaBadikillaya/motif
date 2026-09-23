import { describe, it, expect, beforeAll } from 'vitest';
import { FrameworkDetector } from '../../src/analyzers/framework-detector.js';
import { ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  paths = await ensureScenarioFixtures();
}, 60_000);

describe('FrameworkDetector', () => {
  describe('react-app', () => {
    it('detects React and Vite', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.react);
      const names = result.frameworks.map((f) => f.name);
      expect(names).toContain('React');
      expect(names).toContain('Vite');
    });

    it('detects Vitest as testing framework', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.react);
      expect(result.testingFrameworks).toContain('Vitest');
    });

    it('detects ESLint and Prettier', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.react);
      expect(result.lintingTools).toContain('ESLint');
      expect(result.formattingTools).toContain('Prettier');
    });
  });

  describe('nextjs-app', () => {
    it('detects Next.js', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.nextjs);
      const names = result.frameworks.map((f) => f.name);
      expect(names).toContain('Next.js');
    });

    it('detects Playwright as testing framework', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.nextjs);
      expect(result.testingFrameworks).toContain('Playwright');
    });
  });

  describe('express-api', () => {
    it('detects Express as backend framework', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.express);
      const fw = result.frameworks.find((f) => f.name === 'Express');
      expect(fw).toBeDefined();
      expect(fw?.category).toBe('backend');
    });

    it('detects tsup as build tool', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.express);
      expect(result.buildTools).toContain('tsup');
    });

    it('detects Jest as testing framework', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.express);
      expect(result.testingFrameworks).toContain('Jest');
    });
  });

  describe('bun-app', () => {
    it('detects Hono and Elysia', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.bun);
      const names = result.frameworks.map((f) => f.name);
      expect(names).toContain('Hono');
      expect(names).toContain('Elysia');
    });

    it('detects Biome as linting tool', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.bun);
      expect(result.lintingTools).toContain('Biome');
    });
  });

  describe('empty-git', () => {
    it('returns empty results for repos with no package.json', async () => {
      const detector = new FrameworkDetector();
      const result = await detector.detect(paths.empty);
      expect(result.frameworks).toEqual([]);
      expect(result.testingFrameworks).toEqual([]);
      expect(result.buildTools).toEqual([]);
    });
  });
});
