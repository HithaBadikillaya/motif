import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { Analyzer } from './index.js';
import type { RepositoryStats } from '../types/git.js';
import { runGit } from '../core/git/command.js';

export class LocAnalyzer implements Analyzer<{ cwd: string }, RepositoryStats['locByExtension']> {
  async analyze(input: { cwd: string }): Promise<RepositoryStats['locByExtension']> {
    const { cwd } = input;

    // Get the list of tracked files in a single git call.
    const lsResult = await runGit(['ls-files'], { cwd, allowFailure: true });
    const files = lsResult.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const extStats = new Map<string, { files: number; lines: number }>();

    // Read all files in parallel — avoids O(N) subprocess spawns from `git show HEAD:<file>`.
    await Promise.all(
      files.map(async (file) => {
        const ext = extname(file) || '(no ext)';
        let content: string;
        try {
          content = await readFile(join(cwd, file), 'utf8');
        } catch {
          return; // binary or missing file — skip
        }
        // Count newlines; add 1 unless the file is empty, to match wc -l semantics.
        const lines = content.length === 0 ? 0 : content.split('\n').length;

        const existing = extStats.get(ext) ?? { files: 0, lines: 0 };
        existing.files += 1;
        existing.lines += lines;
        extStats.set(ext, existing);
      }),
    );

    return [...extStats.entries()]
      .map(([extension, { files, lines }]) => ({ extension, files, lines }))
      .sort((a, b) => b.lines - a.lines);
  }
}
