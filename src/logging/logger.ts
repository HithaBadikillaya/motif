import pino from 'pino';

interface LoggerOptions {
  verbose?: boolean;
  debug?: boolean;
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const level = options.debug ? 'debug' : options.verbose ? 'info' : 'silent';
  return pino({
    level,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
