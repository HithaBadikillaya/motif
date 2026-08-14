import type { Analyzer } from './index.js';
import type { CoChangePattern, FileChurn } from '../types/git.js';
import { runGit } from '../core/git/command.js';

interface ChurnInput {
  cwd: string;
  limit?: number | undefined;
}

interface ChurnResult {
  hotspots: FileChurn[];
  coChangePatterns: CoChangePattern[];
}

export class ChurnAnalyzer implements Analyzer<ChurnInput, ChurnResult> {
  async analyze(input: ChurnInput): Promise<ChurnResult> {
    const { cwd, limit } = input;

    const args = ['log', '--numstat', '--format=COMMIT:%H', '--no-merges'];
    if (limit) args.push(`--max-count=${limit}`);

    const result = await runGit(args, { cwd, allowFailure: true });

    const fileCounts = new Map<string, FileChurn>();
    const coChangeCounts = new Map<string, number>();

    let filesInCommit: string[] = [];

    const flush = () => {
      if (filesInCommit.length >= 2) {
        for (let i = 0; i < filesInCommit.length; i++) {
          for (let j = i + 1; j < filesInCommit.length; j++) {
            const a = filesInCommit[i]!;
            const b = filesInCommit[j]!;
            const key = [a, b].sort().join('\x00');
            coChangeCounts.set(key, (coChangeCounts.get(key) ?? 0) + 1);
          }
        }
      }
      filesInCommit = [];
    };

    for (const line of result.stdout.split('\n')) {
      if (line.startsWith('COMMIT:')) {
        flush();
        continue;
      }
      if (!line.trim()) continue;

      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const [addStr = '0', delStr = '0, ...pathParts'] = parts;
      const file = parts.slice(2).join('\t');
      if (!file) continue;

      const additions = addStr === '-' ? 0 : Number(addStr);
      const deletions = delStr === '-' ? 0 : Number(delStr);

      const existing = fileCounts.get(file) ?? { file, commits: 0, additions: 0, deletions: 0 };
      existing.commits += 1;
      existing.additions += additions;
      existing.deletions += deletions;
      fileCounts.set(file, existing);
      filesInCommit.push(file);
    }
    flush();

    const hotspots = [...fileCounts.values()].sort((a, b) => b.commits - a.commits);

    const coChangePatterns: CoChangePattern[] = [...coChangeCounts.entries()]
      .map(([key, commits]) => {
        const [a = '', b = ''] = key.split('\x00');
        return { files: [a, b] as [string, string], commits };
      })
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 20);

    return { hotspots, coChangePatterns };
  }
}
