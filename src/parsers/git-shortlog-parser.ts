import type { ContributorStats } from '../types/git.js';

export function parseGitShortlog(
  raw: string,
): Array<Pick<ContributorStats, 'name' | 'email' | 'commits'>> {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tabIdx = line.indexOf('\t');
      const countStr = line.slice(0, tabIdx).trim();
      const rest = line.slice(tabIdx + 1).trim(); // "Alice <alice@example.com>"

      const emailMatch = /<([^>]+)>/.exec(rest);
      const email = emailMatch?.[1] ?? '';
      const name = rest.replace(/<[^>]+>/, '').trim();

      return {
        name,
        email,
        commits: Number(countStr) || 0,
      };
    });
}
