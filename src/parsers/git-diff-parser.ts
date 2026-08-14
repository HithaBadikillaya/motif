import type { GitDiffFile, GitDiffHunk } from '../types/git.js';

export function parseNameStatus(raw: string): Array<{ status: string; files: string[] }> {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status = 'unknown', ...files] = line.split('\t');
      return { status, files };
    });
}

export function parseNumstat(raw: string): Map<string, { additions: number; deletions: number }> {
  const stats = new Map<string, { additions: number; deletions: number }>();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const [additions = '0', deletions = '0', ...paths] = line.split('\t');
    const path = paths.at(-1);
    if (!path) continue;
    stats.set(path, {
      additions: additions === '-' ? 0 : Number(additions),
      deletions: deletions === '-' ? 0 : Number(deletions),
    });
  }
  return stats;
}

export function parseUnifiedDiff(raw: string): GitDiffFile[] {
  const files: GitDiffFile[] = [];
  let current: GitDiffFile | undefined;
  let currentHunk: GitDiffHunk | undefined;

  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = {
        path: line.split(' b/')[1] ?? 'unknown',
        status: 'unknown',
        additions: 0,
        deletions: 0,
        hunks: [],
      };
      files.push(current);
      currentHunk = undefined;
      continue;
    }

    if (!current) continue;
    if (line.startsWith('new file mode')) current.status = 'added';
    if (line.startsWith('deleted file mode')) current.status = 'deleted';
    if (line.startsWith('rename from ')) current.oldPath = line.replace('rename from ', '');
    if (line.startsWith('rename to ')) {
      current.path = line.replace('rename to ', '');
      current.status = 'renamed';
    }

    const hunkMatch = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/.exec(line);
    if (hunkMatch) {
      currentHunk = {
        oldStart: Number(hunkMatch[1]),
        oldLines: Number(hunkMatch[2] || '1'),
        newStart: Number(hunkMatch[3]),
        newLines: Number(hunkMatch[4] || '1'),
        header: hunkMatch[5]?.trim() ?? '',
        lines: [],
      };
      current.hunks.push(currentHunk);
      continue;
    }

    if (currentHunk) {
      currentHunk.lines.push(line);
      if (line.startsWith('+') && !line.startsWith('+++')) current.additions += 1;
      if (line.startsWith('-') && !line.startsWith('---')) current.deletions += 1;
    }
  }

  return files;
}

export function statusFromCode(code: string): GitDiffFile['status'] {
  if (code.startsWith('A')) return 'added';
  if (code.startsWith('M')) return 'modified';
  if (code.startsWith('D')) return 'deleted';
  if (code.startsWith('R')) return 'renamed';
  if (code.startsWith('C')) return 'copied';
  return 'unknown';
}

export function parseShortstat(raw: string): {
  files: number;
  additions: number;
  deletions: number;
} {
  const line = raw.trim();
  const files = Number(/(\d+) files? changed/.exec(line)?.[1] ?? '0');
  const additions = Number(/(\d+) insertions?/.exec(line)?.[1] ?? '0');
  const deletions = Number(/(\d+) deletions?/.exec(line)?.[1] ?? '0');
  return { files, additions, deletions };
}
