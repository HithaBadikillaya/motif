import type { GitDiffFile } from '../../types/git.js';
import { parseUnifiedDiff } from '../../parsers/git-diff-parser.js';
import { runGit } from './command.js';

export class GitDiffService {
  /** Diff working tree against HEAD (or a custom range like "HEAD~1..HEAD"). */
  async diff(cwd: string, range?: string): Promise<GitDiffFile[]> {
    const args = range ? ['diff', range] : ['diff', 'HEAD'];
    const result = await runGit(args, { cwd, allowFailure: true });
    return parseUnifiedDiff(result.stdout);
  }

  /** Diff between two branches or commits. */
  async branchDiff(cwd: string, base: string, head: string): Promise<GitDiffFile[]> {
    const result = await runGit(['diff', `${base}...${head}`], { cwd, allowFailure: true });
    return parseUnifiedDiff(result.stdout);
  }

  /** Diff a single file at a given range. */
  async fileDiff(cwd: string, range: string, file: string): Promise<GitDiffFile[]> {
    const result = await runGit(['diff', range, '--', file], { cwd, allowFailure: true });
    return parseUnifiedDiff(result.stdout);
  }

  /** Per-file line stats for a specific commit. */
  async commitStats(
    cwd: string,
    sha: string,
  ): Promise<Array<{ file: string; additions: number; deletions: number }>> {
    const result = await runGit(['show', '--numstat', '--format=', sha], {
      cwd,
      allowFailure: true,
    });
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [additions = '0', deletions = '0', ...paths] = line.split('\t');
        return {
          file: paths.at(-1) ?? 'unknown',
          additions: additions === '-' ? 0 : Number(additions),
          deletions: deletions === '-' ? 0 : Number(deletions),
        };
      });
  }
}
