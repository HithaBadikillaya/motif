import { execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

export const fixturePath = join(__dirname, 'repo');

/** All Phase 2 scenario fixture paths */
export const scenarioPaths = {
  react: join(__dirname, 'scenarios', 'react-app'),
  nextjs: join(__dirname, 'scenarios', 'nextjs-app'),
  express: join(__dirname, 'scenarios', 'express-api'),
  bun: join(__dirname, 'scenarios', 'bun-app'),
  monorepo: join(__dirname, 'scenarios', 'monorepo'),
  empty: join(__dirname, 'scenarios', 'empty-git'),
} as const;

export type ScenarioName = keyof typeof scenarioPaths;

/**
 * Ensure the original fixture git repository is created.
 * Idempotent — skips creation if `.git` already exists.
 */
export async function ensureFixtureRepo(): Promise<string> {
  const gitDir = join(fixturePath, '.git');
  try {
    await access(gitDir);
    return fixturePath;
  } catch {
    // Need to create
  }

  const scriptPath = join(__dirname, 'setup-fixture-repo.sh');
  await execFileAsync('bash', [scriptPath], {
    cwd: __dirname,
    env: { ...process.env, HOME: process.env['HOME'] ?? '/tmp' },
  });
  return fixturePath;
}

/**
 * Ensure all Phase 2 scenario fixtures exist.
 * Idempotent — skips creation if each already exists.
 */
export async function ensureScenarioFixtures(): Promise<typeof scenarioPaths> {
  const anyMissing = await Promise.all(
    Object.values(scenarioPaths).map(async (p) => {
      try {
        await access(join(p, '.git'));
        return false;
      } catch {
        return true;
      }
    }),
  );

  if (anyMissing.some(Boolean)) {
    const scriptPath = join(__dirname, 'setup-scenarios.sh');
    await execFileAsync('bash', [scriptPath], {
      cwd: __dirname,
      env: { ...process.env, HOME: process.env['HOME'] ?? '/tmp' },
    });
  }

  return scenarioPaths;
}

/**
 * Ensure a single named scenario fixture exists and return its path.
 */
export async function ensureScenario(name: ScenarioName): Promise<string> {
  const paths = await ensureScenarioFixtures();
  return paths[name];
}
