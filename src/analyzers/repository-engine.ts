import { resolve } from 'node:path';
import { GitAnalyzer } from './git-analyzer.js';
import { PackageManagerDetector } from './package-manager-detector.js';
import { FrameworkDetector } from './framework-detector.js';
import { LanguageDetector } from './language-detector.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { StatisticsAnalyzer } from './statistics-analyzer.js';
import { WorkspaceAnalyzer } from './workspace-analyzer.js';
import type { RepositoryModel, ProjectIntelligence } from '../types/repository.js';

export interface RepositoryEngineOptions {
  cwd?: string;
}

export class RepositoryEngine {
  private readonly gitAnalyzer = new GitAnalyzer();
  private readonly pkgManagerDetector = new PackageManagerDetector();
  private readonly frameworkDetector = new FrameworkDetector();
  private readonly languageDetector = new LanguageDetector();
  private readonly dependencyAnalyzer = new DependencyAnalyzer();
  private readonly statisticsAnalyzer = new StatisticsAnalyzer();
  private readonly workspaceAnalyzer = new WorkspaceAnalyzer();

  async analyze(options: RepositoryEngineOptions = {}): Promise<RepositoryModel> {
    const cwd = resolve(options.cwd ?? process.cwd());

    const git = await this.gitAnalyzer.analyze(cwd);
    const root = git.isRepo ? git.root : cwd;

    const [pkgManager, frameworkResult, languageResult, dependencies, stats, workspace] =
      await Promise.all([
        this.pkgManagerDetector.detect(root),
        this.frameworkDetector.detect(root),
        this.languageDetector.detect(root),
        this.dependencyAnalyzer.analyze(root),
        this.statisticsAnalyzer.analyze(root),
        this.workspaceAnalyzer.analyze(root),
      ]);

    const project: ProjectIntelligence = {
      packageManager: pkgManager,
      primaryLanguage: languageResult.primaryLanguage,
      languageBreakdown: languageResult.languageBreakdown,
      frameworks: frameworkResult.frameworks,
      primaryFramework: frameworkResult.frameworks[0]?.name,
      testingFrameworks: frameworkResult.testingFrameworks,
      buildTools: frameworkResult.buildTools,
      lintingTools: frameworkResult.lintingTools,
      formattingTools: frameworkResult.formattingTools,
    };

    return {
      path: root,
      git,
      project,
      stats: {
        ...stats,
        totalSourceFiles: languageResult.totalSourceFiles,
      },
      dependencies,
      workspace,
      analyzedAt: new Date().toISOString(),
    };
  }
}
