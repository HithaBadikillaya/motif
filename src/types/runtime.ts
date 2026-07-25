import type { ResolvedConfig } from '../config/schema.js';
import type { Output } from '../cli/ui/output.js';
import type pino from 'pino';

export interface RuntimeOptions {
  config?: string;
  globalConfig?: string;
  verbose?: boolean;
  debug?: boolean;
}

export interface RuntimeContext {
  config: ResolvedConfig;
  logger: pino.Logger;
  output: Output;
  verbose: boolean;
  debug: boolean;
}
