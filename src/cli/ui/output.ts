import chalk from 'chalk';

export interface Output {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  table(rows: Array<Record<string, string>>): void;
}

interface OutputOptions {
  debug?: boolean;
}

export function createOutput(options: OutputOptions = {}): Output {
  return {
    info: (message) => console.log(message),
    success: (message) => console.log(chalk.green(`✓ ${message}`)),
    warn: (message) => console.warn(chalk.yellow(`! ${message}`)),
    error: (message) => console.error(chalk.red(`✕ ${message}`)),
    debug: (message) => {
      if (options.debug) console.error(chalk.gray(`[debug] ${message}`));
    },
    table: (rows) => console.table(rows),
  };
}
