export interface GitRepositoryInfo {
  root: string;
  gitDir: string;
  isRepo: boolean;
  isBare: boolean;
  currentBranch?: string | undefined;
}

export interface GitCommit {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
  parents: string[];
}

export interface GitHistoryQuery {
  author?: string | undefined;
  since?: string | undefined;
  file?: string | undefined;
  limit?: number | undefined;
  skip?: number | undefined;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
  upstream?: string | undefined;
  ahead?: number | undefined;
  behind?: number | undefined;
}

export interface GitTag {
  name: string;
  sha?: string | undefined;
}

export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: string[];
}

export interface GitDiffFile {
  path: string;
  oldPath?: string | undefined;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unknown';
  additions: number;
  deletions: number;
  hunks: GitDiffHunk[];
}

export interface GitStatusFile {
  path: string;
  index: string;
  workingTree: string;
}

export interface GitStatus {
  staged: GitStatusFile[];
  unstaged: GitStatusFile[];
  untracked: string[];
  clean: boolean;
}

export interface GitIgnoreRules {
  path?: string | undefined;
  patterns: string[];
}

export interface GitSubmodule {
  name: string;
  path: string;
  url: string;
}

export interface GitRepositoryMetadata {
  remotes: GitRemote[];
  defaultBranch?: string | undefined;
  gitignore: GitIgnoreRules;
  submodules: GitSubmodule[];
}

export interface GitBlameLine {
  sha: string;
  authorName: string;
  authorEmail: string;
  lineNumber: number;
  content: string;
}

export interface GitOwnership {
  file: string;
  contributors: Array<{
    name: string;
    email: string;
    lines: number;
  }>;
}

export interface FileChurn {
  file: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface CoChangePattern {
  files: [string, string];
  commits: number;
}

export interface CommitMessagePattern {
  conventionalType?: string | undefined;
  prefix?: string | undefined;
  count: number;
}

export interface ContributorStats {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface RepositoryAnalysis {
  repository: GitRepositoryInfo;
  commitCount: number;
  contributors: ContributorStats[];
  churnHotspots: FileChurn[];
  coChangePatterns: CoChangePattern[];
  messagePatterns: CommitMessagePattern[];
  branches: GitBranch[];
  tags: GitTag[];
  metadata: GitRepositoryMetadata;
  status: GitStatus;
}

export interface RepositoryStats {
  commitCount: number;
  contributors: ContributorStats[];
  commitsByDay: Array<{ day: string; commits: number }>;
  locByExtension: Array<{ extension: string; files: number; lines: number }>;
  churnHotspots: FileChurn[];
}

export interface GitRepositoryHealth {
  isRepo: boolean;
  headResolvable: boolean;
  hasLockFile: boolean;
  objectsIntact: boolean;
  healthy: boolean;
  issues: string[];
}

export interface ConventionalCommit {
  type: string;
  scope?: string | undefined;
  breaking: boolean;
  description: string;
  body?: string | undefined;
  footers: Array<{ token: string; value: string }>;
}

export interface GitHistoryQueryResult {
  commits: GitCommit[];
  total: number;
  hasMore: boolean;
}
