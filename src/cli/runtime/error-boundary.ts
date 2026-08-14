import type { RuntimeContext } from '../../types/runtime.js';
import { formatError, toCliError } from '../../core/errors/errors.js';

export type CommanderAction = (...args: unknown[]) => Promise<void> | void;

export function getRuntimeContext(args: unknown[]): RuntimeContext {
  for (let i = args.length - 1; i >= 0; i--) {
    const item = args[i] as
      | { optsWithGlobals?: () => { runtime?: RuntimeContext }; runtime?: RuntimeContext }
      | undefined;
    if (item?.runtime) return item.runtime;
    const runtime = item?.optsWithGlobals?.().runtime;
    if (runtime) return runtime;
  }
  throw new Error('Runtime context was not initialized.');
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
