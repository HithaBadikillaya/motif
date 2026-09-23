import { describe, expect, it } from 'vitest';
import { CommitPatternAnalyzer } from '../../src/analyzers/commit-patterns.js';
import type { GitCommit } from '../../src/types/git.js';

describe('CommitPatternAnalyzer', () => {
  const analyzer = new CommitPatternAnalyzer();

  const mockCommits: GitCommit[] = [
    {
      sha: '1',
      authorName: 'A',
      authorEmail: 'a@e.com',
      date: '',
      parents: [],
      message: 'feat(core): add parser',
    },
    {
      sha: '2',
      authorName: 'A',
      authorEmail: 'a@e.com',
      date: '',
      parents: [],
      message: 'feat: add status view',
    },
    {
      sha: '3',
      authorName: 'B',
      authorEmail: 'b@e.com',
      date: '',
      parents: [],
      message: 'fix: resolve null pointer',
    },
    {
      sha: '4',
      authorName: 'B',
      authorEmail: 'b@e.com',
      date: '',
      parents: [],
      message: 'WIP: temporary commit',
    },
    {
      sha: '5',
      authorName: 'C',
      authorEmail: 'c@e.com',
      date: '',
      parents: [],
      message: 'random message',
    },
  ];

  it('classifies conventional and prefix patterns correctly', () => {
    const patterns = analyzer.analyze(mockCommits);
    expect(patterns.find((p) => p.conventionalType === 'feat')?.count).toBe(2);
    expect(patterns.find((p) => p.conventionalType === 'fix')?.count).toBe(1);
    expect(patterns.find((p) => p.prefix === 'WIP')?.count).toBe(1);
    expect(patterns.find((p) => !p.conventionalType && !p.prefix)?.count).toBe(1);
  });
});
