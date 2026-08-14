import type { ConventionalCommit } from '../types/git.js';

/**
 * Conventional Commits v1.0.0 regex.
 * Matches: type(scope)!: description
 */
const CONVENTIONAL_PATTERN =
  /^(?<type>feat|fix|chore|docs|style|refactor|perf|test|ci|build|revert)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)/i;

const FOOTER_PATTERN = /^(?<token>[\w-]+|BREAKING CHANGE)(?:: | #)(?<value>.+)/;

/**
 * Parse a commit message into a ConventionalCommit object.
 * Returns `undefined` if the message does not match the conventional format.
 */
export function parseConventionalCommit(message: string): ConventionalCommit | undefined {
  const lines = message.split('\n');
  const subject = lines[0]?.trim() ?? '';
  const match = CONVENTIONAL_PATTERN.exec(subject);
  if (!match?.groups) return undefined;

  const { type, scope, breaking, description } = match.groups;

  const bodyLines: string[] = [];
  const footers: Array<{ token: string; value: string }> = [];
  let inFooter = false;
  let blankSeen = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (!blankSeen && line.trim() === '') {
      blankSeen = true;
      continue;
    }
    if (blankSeen) {
      const footerMatch = FOOTER_PATTERN.exec(line);
      if (footerMatch?.groups) {
        inFooter = true;
        footers.push({
          token: footerMatch.groups['token'] ?? '',
          value: footerMatch.groups['value'] ?? '',
        });
      } else if (!inFooter) {
        bodyLines.push(line);
      }
    }
  }

  const isBreaking = Boolean(breaking) || footers.some((f) => f.token === 'BREAKING CHANGE');

  return {
    type: type?.toLowerCase() ?? '',
    scope: scope || undefined,
    breaking: isBreaking,
    description: description ?? '',
    body: bodyLines.join('\n').trim() || undefined,
    footers,
  };
}

/**
 * Extract the conventional type from a message, or return undefined.
 */
export function extractConventionalType(message: string): string | undefined {
  return parseConventionalCommit(message)?.type;
}

export function extractMessagePrefix(message: string): string | undefined {
  const subject = message.split('\n')[0]?.trim() ?? '';
  const prefixMatch = /^([A-Z][A-Z0-9_-]+):/.exec(subject);
  return prefixMatch?.[1];
}
