import type { GitRemote, GitSubmodule } from './git.js';

export type PackageManagerName =
  'bun' | 'npm' | 'pnpm' | 'yarn' | 'cargo' | 'go' | 'pip' | 'poetry' | 'deno' | 'unknown';

export interface PackageManagerInfo {
  name: PackageManagerName;
  version?: string | undefined;
  lockfile?: string | undefined;
}

export type FrameworkCategory = 'frontend' | 'backend' | 'fullstack';

export interface DetectedFramework {
  name: string;
  category: FrameworkCategory;
  version?: string | undefined;
}

export interface LanguageBreakdown {
  language: string;
  fileCount: number;
  byteSize: number;
  percentage: number;
}

export interface ProjectIntelligence {
  packageManager: PackageManagerInfo;
  primaryLanguage: string;
  languageBreakdown: LanguageBreakdown[];
  frameworks: DetectedFramework[];
  primaryFramework?: string | undefined;
  testingFrameworks: string[];
  buildTools: string[];
  lintingTools: string[];
  formattingTools: string[];
}

export interface GitIntelligence {
  isRepo: boolean;
  root: string;
  gitDir: string;
  currentBranch?: string | undefined;
  defaultBranch?: string | undefined;
  remotes: GitRemote[];
  isClean: boolean;
  stagedCount: number;
  unstagedCount: number;
  untrackedCount: number;
  isMergeConflict: boolean;
  isDetachedHead: boolean;
  submodules: GitSubmodule[];
  headSha?: string | undefined;
}

export interface DirectorySummary {
  path: string;
  fileCount: number;
  byteSize: number;
}

export interface ExtensionStat {
  extension: string;
  count: number;
  percentage: number;
}

export interface FileStat {
  path: string;
  lineCount: number;
  byteSize: number;
}

export interface RepositoryAge {
  startDate?: string | undefined;
  ageInDays: number;
  formatted: string;
}

export interface RepositoryStatistics {
  totalFiles: number;
  totalSourceFiles: number;
  totalSizeBytes: number;
  directorySummary: DirectorySummary[];
  largestDirectories: DirectorySummary[];
  repositoryAge: RepositoryAge;
  commitCount: number;
  contributorCount: number;
  mostCommonExtensions: ExtensionStat[];
  largestSourceFiles: FileStat[];
}

export interface DependencyIntelligence {
  hasPackageJson: boolean;
  name?: string | undefined;
  version?: string | undefined;
  prodDependenciesCount: number;
  devDependenciesCount: number;
  scriptsCount: number;
  prodDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export type MonorepoType =
  'pnpm' | 'yarn' | 'npm' | 'bun' | 'turbo' | 'nx' | 'lerna' | 'cargo' | 'none';

export interface WorkspacePackage {
  name: string;
  path: string;
  relativePath: string;
}

export interface WorkspaceIntelligence {
  isMonorepo: boolean;
  monorepoType: MonorepoType;
  packageCount: number;
  packages: WorkspacePackage[];
}

export interface RepositoryModel {
  path: string;
  git: GitIntelligence;
  project: ProjectIntelligence;
  stats: RepositoryStatistics;
  dependencies: DependencyIntelligence;
  workspace: WorkspaceIntelligence;
  analyzedAt: string;
}
