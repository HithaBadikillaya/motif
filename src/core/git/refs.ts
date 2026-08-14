import type { GitBranch, GitTag } from '../../types/git.js';
import { runGit } from './command.js';

export class GitRefsService {
  async branches(cwd: string): Promise<GitBranch[]> {
    const result = await runGit(
      [
        'for-each-ref',
        '--format=%(refname:short)%09%(upstream:short)%09%(upstream:track)',
        'refs/heads',
        'refs/remotes',
      ],
      { cwd, allowFailure: true },
    );
    const current = await this.currentBranch(cwd);

    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', upstream = '', track = ''] = line.split('\t');
        const ahead = Number(/\[ahead (\d+)/.exec(track)?.[1] ?? '0');
        const behind = Number(/behind (\d+)/.exec(track)?.[1] ?? '0');
        return {
          name,
          current: name === current,
          remote: name.includes('/'),
          upstream: upstream || undefined,
          ahead,
          behind,
        };
      });
  }

  async tags(cwd: string): Promise<GitTag[]> {
    const result = await runGit(['show-ref', '--tags', '-d'], { cwd, allowFailure: true });
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, ref = ''] = line.split(' ');
        return { sha, name: ref.replace('refs/tags/', '').replace(/\^{}$/, '') };
      });
  }

  /** Return the name of the current branch, or undefined if in detached HEAD state. */
  async currentBranch(cwd: string): Promise<string | undefined> {
    const result = await runGit(['branch', '--show-current'], { cwd, allowFailure: true });
    return result.stdout.trim() || undefined;
  }
}
