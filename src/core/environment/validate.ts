import type { ResolvedConfig } from '../../config/schema.js';

export interface EnvironmentCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message: string;
}

export interface EnvironmentReport {
  ok: boolean;
  checks: EnvironmentCheck[];
}

export async function validateEnvironment(config: ResolvedConfig): Promise<EnvironmentReport> {
  const checks: EnvironmentCheck[] = [
    {
      name: 'runtime',
      status: typeof Bun !== 'undefined' ? 'ok' : 'warn',
      message:
        typeof Bun !== 'undefined'
          ? `Bun runtime detected (${Bun.version}).`
          : 'Bun runtime was not detected; compiled Node execution is supported for basic commands.',
    },
    {
      name: 'local-config',
      status: config.paths.local ? 'ok' : 'warn',
      message: `Local config path: ${config.paths.local ?? 'not configured'}.`,
    },
    {
      name: 'global-config',
      status: 'ok',
      message: `Global config path: ${config.paths.global ?? 'not configured'}.`,
    },
  ];

  return {
    ok: checks.every((check) => check.status !== 'fail'),
    checks,
  };
}
