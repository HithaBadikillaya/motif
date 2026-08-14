import { execFile } from 'node:child_process';
import type { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { AppError } from '../errors/errors.js';

const execFileAsync = promisify(execFile);

export interface GitCommandOptions {
  cwd: string;
  allowFailure?: boolean;
}

export interface GitCommandResult {
  stdout: string;
  stderr: string;
}

export async function runGit(
  args: string[],
  options: GitCommandOptions,
): Promise<GitCommandResult> {
  try {
    const result = await execFileAsync('git', args, {
      cwd: options.cwd,
      // 100 MB — supports very large diffs/blames
      maxBuffer: 1024 * 1024 * 100,
      env: {
        ...process.env,
        GIT_OPTIONAL_LOCKS: '0',
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'safe.directory',
        GIT_CONFIG_VALUE_0: '*',
      },
    });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    if (options.allowFailure && isExecError(error)) {
      return { stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
    }
    throw new AppError(`Git command failed: git ${args.join(' ')}`, {
      code: 'GIT_COMMAND_FAILED',
      exitCode: 2,
      hint: isExecError(error) ? error.stderr || error.message : undefined,
      cause: error,
    });
  }
}

/**
 * Spawn a git process and return its stdout as a Node.js Readable stream.
 * Useful for very large outputs that should not be buffered in memory.
 */
export function streamGit(args: string[], cwd: string): Readable {
  const child = execFile('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_OPTIONAL_LOCKS: '0',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'safe.directory',
      GIT_CONFIG_VALUE_0: '*',
    },
  });
  // Return the stdout stream; callers handle 'data'/'end'/'error'
  return child.stdout as Readable;
}

export async function isGitAvailable(cwd = process.cwd()): Promise<boolean> {
  try {
    await runGit(['--version'], { cwd });
    return true;
  } catch {
    return false;
  }
}

function isExecError(error: unknown): error is Error & { stdout?: string; stderr?: string } {
  return error instanceof Error;
}
