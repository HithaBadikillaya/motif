import { loadConfiguration } from '../../config/loader.js';
import { createLogger } from '../../logging/logger.js';
import type { RuntimeContext, RuntimeOptions } from '../../types/runtime.js';
import { createOutput } from '../ui/output.js';

export async function createRuntimeContext(options: RuntimeOptions): Promise<RuntimeContext> {
  const output = createOutput({ debug: Boolean(options.debug) });
  const logger = createLogger({
    verbose: Boolean(options.verbose),
    debug: Boolean(options.debug),
  });
  const config = await loadConfiguration(
    Object.fromEntries(
      Object.entries({
        globalPath: options.globalConfig,
        localPath: options.config,
      }).filter(([, value]) => value !== undefined),
    ),
  );

  return {
    config,
    logger,
    output,
    debug: Boolean(options.debug),
    verbose: Boolean(options.verbose),
  };
}
