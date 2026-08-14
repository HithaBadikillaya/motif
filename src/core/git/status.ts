import type { GitStatus, GitStatusFile } from '../../types/git.js';
import { runGit } from './command.js';

export class GitStatusService {
  async status(cwd: string): Promise<GitStatus> {
    const result = await runGit(['status', '--porcelain=v1'], { cwd, allowFailure: true });
    const staged: GitStatusFile[] = [];
    const unstaged: GitStatusFile[] = [];
    const untracked: string[] = [];

    for (const line of result.stdout.split('\n')) {
      if (!line.trim()) continue;
      const index = line[0] ?? ' ';
      const workingTree = line[1] ?? ' ';
      const path = line.slice(3);
      if (index === '?' && workingTree === '?') {
        untracked.push(path);
        continue;
      }
      const file = { path, index, workingTree };
      if (index !== ' ') staged.push(file);
      if (workingTree !== ' ') unstaged.push(file);
    }

    return {
      staged,
      unstaged,
      untracked,
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
    };
  }
}
