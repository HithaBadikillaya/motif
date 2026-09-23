import { describe, expect, it } from 'vitest';
import {
  extractConventionalType,
  extractMessagePrefix,
  parseConventionalCommit,
} from '../../src/parsers/conventional-commit-parser.js';

describe('conventional-commit-parser', () => {
  it('parses standard conventional feat commit', () => {
    const result = parseConventionalCommit('feat(core): add parser support');
    expect(result).toEqual({
      type: 'feat',
      scope: 'core',
      breaking: false,
      description: 'add parser support',
      body: undefined,
      footers: [],
    });
  });

  it('parses breaking change indicator in subject (!)', () => {
    const result = parseConventionalCommit('fix(api)!: breaking change in parameters');
    expect(result?.breaking).toBe(true);
    expect(result?.type).toBe('fix');
    expect(result?.scope).toBe('api');
  });

  it('parses BREAKING CHANGE footer', () => {
    const msg = `refactor: simplify engine

BREAKING CHANGE: removed deprecated v1 API`;
    const result = parseConventionalCommit(msg);
    expect(result?.breaking).toBe(true);
    expect(result?.footers).toContainEqual({
      token: 'BREAKING CHANGE',
      value: 'removed deprecated v1 API',
    });
  });

  it('returns undefined for non-conventional commit messages', () => {
    expect(parseConventionalCommit('Random commit title')).toBeUndefined();
  });

  it('extracts conventional type', () => {
    expect(extractConventionalType('chore: update deps')).toBe('chore');
    expect(extractConventionalType('unknown message')).toBeUndefined();
  });

  it('extracts non-conventional uppercase prefix', () => {
    expect(extractMessagePrefix('WIP: draft work')).toBe('WIP');
    expect(extractMessagePrefix('normal commit')).toBeUndefined();
  });
});
