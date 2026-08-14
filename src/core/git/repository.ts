import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { GitRepositoryHealth, GitRepositoryInfo } from '../../types/git.js';
import { runGit } from './command.js';

export class GitRepositoryService {
  async detect(cwd = process.cwd()): Promise<GitRepositoryInfo> {
    const rootResult = await runGit(['rev-parse', '--show-toplevel'], {
      cwd,
      allowFailure: true,
    });
    const bareResult = await runGit(['rev-parse', '--is-bare-repository'], {
      cwd,
      allowFailure: true,
    });

    const isBare = bareResult.stdout.trim() === 'true';
    const root = rootResult.stdout.trim();
    const gitDirResult = await runGit(['rev-parse', '--git-dir'], {
      cwd,
      allowFailure: true,
    });

    const branchResult = await runGit(['branch', '--show-current'], {
      cwd,
      allowFailure: true,
    });

    return {
      root: root || resolve(cwd),
      gitDir: gitDirResult.stdout.trim(),
      isRepo: Boolean(root || isBare),
      isBare,
      currentBranch: branchResult.stdout.trim() || undefined,
    };
  }

  async validate(cwd = process.cwd()): Promise<GitRepositoryInfo> {
    return this.detect(cwd);
  }

  /**
   * Return the root of the nearest git repository, searching upward from `cwd`.
   * Returns undefined if no git repo is found.
   */
  async rootFromCwd(cwd = process.cwd()): Promise<string | undefined> {
    const result = await runGit(['rev-parse', '--show-toplevel'], {
      cwd,
      allowFailure: true,
    });
    return result.stdout.trim() || undefined;
  }

  /**
   * Run a structured health check on the repository at `cwd`.
   */
  async isHealthy(cwd = process.cwd()): Promise<GitRepositoryHealth> {
    const info = await this.detect(cwd);
    const issues: string[] = [];

    if (!info.isRepo) {
      return {
        isRepo: false,
        headResolvable: false,
        hasLockFile: false,
        objectsIntact: false,
        healthy: false,
        issues: ['Not a git repository'],
      };
    }

    // Check HEAD resolves
    const headResult = await runGit(['rev-parse', '--verify', 'HEAD'], { cwd, allowFailure: true });
    const headResolvable = Boolean(headResult.stdout.trim());
    if (!headResolvable) issues.push('HEAD does not resolve to a commit (empty repo or corrupt)');

    // Check for index.lock (stale lock file)
    const gitDir = info.gitDir || join(info.root, '.git');
    const lockPath = join(gitDir.startsWith('/') ? gitDir : join(info.root, gitDir), 'index.lock');
    let hasLockFile = false;
    try {
      await access(lockPath);
      hasLockFile = true;
      issues.push('index.lock exists — another git process may be running');
    } catch {
      // No lock file — good
    }

    // Quick objects integrity check via rev-parse on HEAD tree
    const treeResult = await runGit(['rev-parse', '--verify', 'HEAD^{tree}'], {
      cwd,
      allowFailure: true,
    });
    const objectsIntact = Boolean(treeResult.stdout.trim());
    if (!objectsIntact && headResolvable) issues.push('HEAD tree object is not readable');

    return {
      isRepo: true,
      headResolvable,
      hasLockFile,
      objectsIntact,
      healthy: issues.length === 0,
      issues,
    };
  }
}
