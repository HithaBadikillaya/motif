import type { RepositoryAnalysis } from '../types/git.js';
import { GitBlameService } from '../core/git/blame.js';
import { GitHistoryService } from '../core/git/history.js';
import { GitMetadataService } from '../core/git/metadata.js';
import { GitRefsService } from '../core/git/refs.js';
import { GitRepositoryService } from '../core/git/repository.js';
import { GitStatusService } from '../core/git/status.js';
import { ChurnAnalyzer } from './churn.js';
import { CommitPatternAnalyzer } from './commit-patterns.js';
import { ContributorStatsAnalyzer } from './contributor-stats.js';

export interface RepositoryAnalyzerOptions {
  blameTopN?: number;
  churnLimit?: number;
}

export class RepositoryAnalyzer {
  private readonly repo = new GitRepositoryService();
  private readonly history = new GitHistoryService();
  private readonly refs = new GitRefsService();
  private readonly metadata = new GitMetadataService();
  private readonly status = new GitStatusService();
  private readonly blame = new GitBlameService();
  private readonly churn = new ChurnAnalyzer();
  private readonly patterns = new CommitPatternAnalyzer();
  private readonly contributors = new ContributorStatsAnalyzer();

  async analyze(cwd: string, options: RepositoryAnalyzerOptions = {}): Promise<RepositoryAnalysis> {
    const { blameTopN = 5, churnLimit } = options;

    // Parallel: things that don't depend on each other
    const [repository, commitCount, contributors, branches, tags, metadata, status, churnResult] =
      await Promise.all([
        this.repo.detect(cwd),
        this.history.count(cwd),
        this.contributors.analyze({ cwd }),
        this.refs.branches(cwd),
        this.refs.tags(cwd),
        this.metadata.metadata(cwd),
        this.status.status(cwd),
        this.churn.analyze({ cwd, limit: churnLimit }),
      ]);

    // Commit message patterns from recent history (up to 500 commits)
    const recentCommits = await this.history.list(cwd, { limit: 500 });
    const messagePatterns = this.patterns.analyze(recentCommits);

    if (blameTopN > 0 && churnResult.hotspots.length > 0) {
      const topFiles = churnResult.hotspots.slice(0, blameTopN).map((f) => f.file);
      await this.blame.ownership(cwd, topFiles);
      // ownership is returned for future use; not yet part of RepositoryAnalysis type
    }

    return {
      repository,
      commitCount,
      contributors,
      churnHotspots: churnResult.hotspots.slice(0, 20),
      coChangePatterns: churnResult.coChangePatterns,
      messagePatterns,
      branches,
      tags,
      metadata,
      status,
    };
  }
}
