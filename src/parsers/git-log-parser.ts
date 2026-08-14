import type { GitCommit } from '../types/git.js';

const fieldSeparator = '\x1f';
const recordSeparator = '\x1e';

export const gitLogFormat = ['%H', '%an', '%ae', '%aI', '%P', '%s'].join(fieldSeparator);

export const gitLogFormatFull = ['%H', '%an', '%ae', '%aI', '%P', '%s', '%b'].join(fieldSeparator);

export function parseGitLog(raw: string): GitCommit[] {
  return raw
    .split(recordSeparator)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha = '', authorName = '', authorEmail = '', date = '', parents = '', message = ''] =
        record.split(fieldSeparator);
      return {
        sha,
        authorName,
        authorEmail,
        date,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        message,
      };
    });
}

export function parseGitLogFull(raw: string): Array<GitCommit & { body: string }> {
  return raw
    .split(recordSeparator)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [
        sha = '',
        authorName = '',
        authorEmail = '',
        date = '',
        parents = '',
        message = '',
        body = '',
      ] = record.split(fieldSeparator);
      return {
        sha,
        authorName,
        authorEmail,
        date,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        message,
        body: body.trim(),
      };
    });
}
