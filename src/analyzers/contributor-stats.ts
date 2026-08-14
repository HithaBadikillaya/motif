import type { Analyzer } from './index.js';
import type { ContributorStats } from '../types/git.js';
import { parseGitShortlog } from '../parsers/git-shortlog-parser.js';
import { runGit } from '../core/git/command.js';

export class ContributorStatsAnalyzer implements Analyzer<{ cwd: string }, ContributorStats[]> {
  async analyze(input: { cwd: string }): Promise<ContributorStats[]> {
    const { cwd } = input;

    const shortlogResult = await runGit(['shortlog', '-sne', 'HEAD'], { cwd, allowFailure: true });
    const base = parseGitShortlog(shortlogResult.stdout);

    if (base.length === 0) return [];

    const lineStats = await this.buildLineStats(cwd);

    return base
      .map(({ name, email, commits }) => ({
        name,
        email,
        commits,
        additions: lineStats.get(email)?.additions ?? 0,
        deletions: lineStats.get(email)?.deletions ?? 0,
      }))
      .sort((a, b) => b.commits - a.commits);
  }

  private async buildLineStats(
    cwd: string,
  ): Promise<Map<string, { additions: number; deletions: number }>> {
    const result = await runGit(['log', '--no-merges', '--numstat', '--format=AUTHOR:%ae'], {
      cwd,
      allowFailure: true,
    });

    const stats = new Map<string, { additions: number; deletions: number }>();
    let currentEmail = '';

    for (const line of result.stdout.split('\n')) {
      if (line.startsWith('AUTHOR:')) {
        currentEmail = line.slice(7).trim();
        continue;
      }
      if (!line.trim() || !currentEmail) continue;

      const parts = line.split('\t');
      if (parts.length < 2) continue;
      const [addStr = '0', delStr = '0'] = parts;
      const additions = addStr === '-' ? 0 : Number(addStr);
      const deletions = delStr === '-' ? 0 : Number(delStr);

      const existing = stats.get(currentEmail) ?? { additions: 0, deletions: 0 };
      existing.additions += additions;
      existing.deletions += deletions;
      stats.set(currentEmail, existing);
    }

    return stats;
  }
}
