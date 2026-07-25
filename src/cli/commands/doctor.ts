import { Command } from 'commander';
import ora from 'ora';
import { validateEnvironment } from '../../core/environment/validate.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

export function createDoctorCommand(): Command {
  return new Command('doctor')
    .alias('check')
    .description('Inspect the local environment and Motif configuration.')
    .action(
      withErrorHandling(async (...args: unknown[]) => {
        const runtime = getRuntimeContext(args);
        const spinner = ora('Checking environment').start();
        const report = await validateEnvironment(runtime.config);
        spinner.stop();

        for (const check of report.checks) {
          if (check.status === 'ok') runtime.output.success(check.message);
          if (check.status === 'warn') runtime.output.warn(check.message);
          if (check.status === 'fail') runtime.output.error(check.message);
        }

        if (!report.ok) process.exitCode = 1;
      }),
    );
}
