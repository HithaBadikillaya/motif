import { Command } from 'commander';
import ora from 'ora';
import { validateEnvironment } from '../../core/environment/validate.js';
import { isGitAvailable } from '../../core/git/command.js';
import { GitRepositoryService } from '../../core/git/repository.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .alias('check')
    .description('Inspect the local environment and Motif configuration.')
    .option(
      '--cwd <path>',
      'Repository path for git checks (defaults to current directory).',
      process.cwd(),
    )
    .action(
      withErrorHandling(async (options: { cwd: string }, ...args: unknown[]) => {
        const runtime = getRuntimeContext([options, ...args]);
        const spinner = ora('Checking environment').start();
        const report = await validateEnvironment(runtime.config);
        spinner.stop();

        for (const check of report.checks) {
          if (check.status === 'ok') runtime.output.success(check.message);
          if (check.status === 'warn') runtime.output.warn(check.message);
          if (check.status === 'fail') runtime.output.error(check.message);
        }

        // Git availability check
        const gitOk = await isGitAvailable(options.cwd);
        if (gitOk) {
          runtime.output.success('git is available on PATH.');
        } else {
          runtime.output.error('git is not available on PATH. Install git and retry.');
          process.exitCode = 1;
          return;
        }

        // Git repository health check
        const repoService = new GitRepositoryService();
        const health = await repoService.isHealthy(options.cwd);
        if (health.isRepo) {
          if (health.healthy) {
            runtime.output.success(`Git repository is healthy (root: ${options.cwd}).`);
          } else {
            for (const issue of health.issues) {
              runtime.output.warn(`Git repository issue: ${issue}`);
            }
          }
        } else {
          runtime.output.warn('Not inside a git repository — git commands will be unavailable.');
        }

        if (!report.ok) process.exitCode = 1;
      }),
    );
}
