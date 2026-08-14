import type { Analyzer } from './index.js';
import type { CommitMessagePattern, GitCommit } from '../types/git.js';
import {
  extractConventionalType,
  extractMessagePrefix,
} from '../parsers/conventional-commit-parser.js';

export class CommitPatternAnalyzer implements Analyzer<GitCommit[], CommitMessagePattern[]> {
  analyze(commits: GitCommit[]): CommitMessagePattern[] {
    const counts = new Map<string, { conventionalType?: string; prefix?: string; count: number }>();

    for (const commit of commits) {
      const conventionalType = extractConventionalType(commit.message);
      if (conventionalType) {
        const key = `conventional:${conventionalType}`;
        const existing = counts.get(key) ?? { conventionalType, count: 0 };
        existing.count += 1;
        counts.set(key, existing);
        continue;
      }

      const prefix = extractMessagePrefix(commit.message);
      if (prefix) {
        const key = `prefix:${prefix}`;
        const existing = counts.get(key) ?? { prefix, count: 0 };
        existing.count += 1;
        counts.set(key, existing);
        continue;
      }

      const key = 'other';
      const existing = counts.get(key) ?? { count: 0 };
      existing.count += 1;
      counts.set(key, existing);
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ conventionalType, prefix, count }) => ({
        conventionalType,
        prefix,
        count,
      }));
  }
}
