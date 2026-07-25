import type { RuntimeContext } from '../../types/runtime.js';
import { formatError, toCliError } from '../../core/errors/errors.js';

export type CommanderAction = (...args: unknown[]) => Promise<void> | void;

export function getRuntimeContext(args: unknown[]): RuntimeContext {
  const command = args.at(-1) as
    { optsWithGlobals?: () => { runtime?: RuntimeContext } } | undefined;
  const runtime = command?.optsWithGlobals?.().runtime;
  if (!runtime) {
    throw new Error('Runtime context was not initialized.');
  }
  return runtime;
}

export function withErrorHandling(action: CommanderAction): CommanderAction {
  return async (...args: unknown[]) => {
    try {
      await action(...args);
    } catch (error) {
      const runtime = getRuntimeContext(args);
      const cliError = toCliError(error);
      runtime.logger.error({ error: cliError }, cliError.message);
      runtime.output.error(formatError(cliError, runtime.debug));
      process.exitCode = cliError.exitCode;
    }
  };
}
