export interface Analyzer<TInput, TResult> {
  analyze(input: TInput): Promise<TResult> | TResult;
}

// Phase 1 analyzers
export { ChurnAnalyzer } from './churn.js';
export { CommitPatternAnalyzer } from './commit-patterns.js';
export { ContributorStatsAnalyzer } from './contributor-stats.js';
export { LocAnalyzer } from './loc.js';
export { RepositoryAnalyzer } from './repository-analysis.js';

// Phase 2 — Repository Intelligence Engine
export { GitAnalyzer } from './git-analyzer.js';
export { PackageManagerDetector } from './package-manager-detector.js';
export { FrameworkDetector } from './framework-detector.js';
export { LanguageDetector } from './language-detector.js';
export { DependencyAnalyzer } from './dependency-analyzer.js';
export { StatisticsAnalyzer } from './statistics-analyzer.js';
export { WorkspaceAnalyzer } from './workspace-analyzer.js';
export { RepositoryEngine } from './repository-engine.js';
