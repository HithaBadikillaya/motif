import { describe, it, expect, beforeAll } from 'vitest';
import { PackageManagerDetector } from '../../src/analyzers/package-manager-detector.js';
import { ensureScenarioFixtures } from '../fixtures/create-fixture.js';

let paths: Awaited<ReturnType<typeof ensureScenarioFixtures>>;

beforeAll(async () => {
  paths = await ensureScenarioFixtures();
}, 60_000);

describe('PackageManagerDetector', () => {
  it('detects bun from packageManager field', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect(paths.bun);
    expect(result.name).toBe('bun');
  });

  it('detects pnpm from pnpm-lock.yaml', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect(paths.nextjs);
    expect(result.name).toBe('pnpm');
  });

  it('detects yarn from yarn.lock', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect(paths.react);
    expect(result.name).toBe('yarn');
  });

  it('detects npm from package-lock.json', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect(paths.express);
    expect(result.name).toBe('npm');
  });

  it('returns unknown for directory with no manifest', async () => {
    const detector = new PackageManagerDetector();
    const result = await detector.detect(paths.empty);
    expect(result.name).toBe('unknown');
  });
});
