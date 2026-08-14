import type { Analyzer } from './index.js';
import type { RepositoryStats } from '../types/git.js';
import { runGit } from '../core/git/command.js';
import { extname } from 'node:path';

export class LocAnalyzer implements Analyzer<{ cwd: string }, RepositoryStats['locByExtension']> {
  async analyze(input: { cwd: string }): Promise<RepositoryStats['locByExtension']> {
    const { cwd } = input;

    const lsResult = await runGit(['ls-files'], { cwd, allowFailure: true });
    const files = lsResult.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const extStats = new Map<string, { files: number; lines: number }>();

    for (const file of files) {
      const ext = extname(file) || '(no ext)';
      const result = await runGit(['show', `HEAD:${file}`], { cwd, allowFailure: true });
      if (!result.stdout) continue;
      const lines = result.stdout.split('\n').length;

      const existing = extStats.get(ext) ?? { files: 0, lines: 0 };
      existing.files += 1;
      existing.lines += lines;
      extStats.set(ext, existing);
    }

    return [...extStats.entries()]
      .map(([extension, { files, lines }]) => ({ extension, files, lines }))
      .sort((a, b) => b.lines - a.lines);
  }
}
