import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { runGit } from '../core/git/command.js';
import { GitMetadataService } from '../core/git/metadata.js';
import { GitRepositoryService } from '../core/git/repository.js';
import { GitStatusService } from '../core/git/status.js';
import type { GitIntelligence } from '../types/repository.js';

export class GitAnalyzer {
  private readonly repoService = new GitRepositoryService();
  private readonly metadataService = new GitMetadataService();
  private readonly statusService = new GitStatusService();

  async analyze(cwd = process.cwd()): Promise<GitIntelligence> {
    const repoInfo = await this.repoService.detect(cwd);

    if (!repoInfo.isRepo) {
      return {
        isRepo: false,
        root: cwd,
        gitDir: '',
        remotes: [],
        isClean: true,
        stagedCount: 0,
        unstagedCount: 0,
        untrackedCount: 0,
        isMergeConflict: false,
        isDetachedHead: false,
        submodules: [],
      };
    }

    const root = repoInfo.root;

    // Run parallel git metadata checks
    const [metadata, status, detachedRes, headShaRes, mergeHeadExists] = await Promise.all([
      this.metadataService.metadata(root),
      this.statusService.status(root),
      runGit(['symbolic-ref', '-q', 'HEAD'], { cwd: root, allowFailure: true }),
      runGit(['rev-parse', 'HEAD'], { cwd: root, allowFailure: true }),
      this.checkFileExists(join(repoInfo.gitDir || join(root, '.git'), 'MERGE_HEAD')),
    ]);

    const isDetachedHead = !detachedRes.stdout.trim() && Boolean(headShaRes.stdout.trim());

    // Check for merge conflicts in status entries or MERGE_HEAD
    const hasConflictInStatus =
      status.staged.some(
        (f) =>
          f.index === 'U' ||
          f.workingTree === 'U' ||
          (f.index === 'A' && f.workingTree === 'A') ||
          (f.index === 'D' && f.workingTree === 'D'),
      ) ||
      status.unstaged.some(
        (f) =>
          f.index === 'U' ||
          f.workingTree === 'U' ||
          (f.index === 'A' && f.workingTree === 'A') ||
          (f.index === 'D' && f.workingTree === 'D'),
      );

    const isMergeConflict = mergeHeadExists || hasConflictInStatus;

    return {
      isRepo: true,
      root: repoInfo.root,
      gitDir: repoInfo.gitDir,
      currentBranch: isDetachedHead ? undefined : repoInfo.currentBranch,
      defaultBranch: metadata.defaultBranch,
      remotes: metadata.remotes,
      isClean: status.clean,
      stagedCount: status.staged.length,
      unstagedCount: status.unstaged.length,
      untrackedCount: status.untracked.length,
      isMergeConflict,
      isDetachedHead,
      submodules: metadata.submodules,
      headSha: headShaRes.stdout.trim() || undefined,
    };
  }

  private async checkFileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
