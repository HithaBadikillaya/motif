import { describe, expect, it } from 'vitest';
import { gitLogFormat, parseGitLog } from '../../src/parsers/git-log-parser.js';

describe('git-log-parser', () => {
  it('defines valid format string', () => {
    expect(gitLogFormat).toBe('%H\x1f%an\x1f%ae\x1f%aI\x1f%P\x1f%s');
  });

  it('parses record separated git log output', () => {
    const raw = `abc1234\x1fAlice\x1falice@test.com\x1f2024-01-01T00:00:00Z\x1fparent1 parent2\x1ffeat: test commit\x1e`;
    const commits = parseGitLog(raw);
    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual({
      sha: 'abc1234',
      authorName: 'Alice',
      authorEmail: 'alice@test.com',
      date: '2024-01-01T00:00:00Z',
      parents: ['parent1', 'parent2'],
      message: 'feat: test commit',
    });
  });
});
