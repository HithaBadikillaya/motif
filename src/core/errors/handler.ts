import { createOutput } from '../../cli/ui/output.js';
import { formatError, toCliError } from './errors.js';

export function handleFatalError(error: unknown): void {
  const cliError = toCliError(error);
  createOutput({ debug: process.argv.includes('--debug') }).error(formatError(cliError));
  process.exitCode = cliError.exitCode;
}
