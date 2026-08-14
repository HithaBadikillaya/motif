import type { ZodError } from 'zod';

interface AppErrorOptions {
  code?: string | undefined;
  exitCode?: number | undefined;
  hint?: string | undefined;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly exitCode: number;
  readonly hint?: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code ?? 'APP_ERROR';
    this.exitCode = options.exitCode ?? 1;
    if (options.hint) this.hint = options.hint;
  }

  static fromZod(message: string, error: ZodError): AppError {
    return new AppError(message, {
      code: 'VALIDATION_ERROR',
      exitCode: 2,
      hint: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      cause: error,
    });
  }
}

export function toCliError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, { code: 'UNEXPECTED_ERROR', cause: error });
  }
  return new AppError('An unexpected error occurred.', { code: 'UNEXPECTED_ERROR', cause: error });
}

export function formatError(error: AppError, debug = false): string {
  const lines = [`${error.message} (${error.code})`];
  if (error.hint) lines.push(error.hint);
  if (debug && error.stack) lines.push(error.stack);
  return lines.join('\n');
}
