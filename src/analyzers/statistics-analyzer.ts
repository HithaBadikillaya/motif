import { stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { runGit } from '../core/git/command.js';
import type {
  DirectorySummary,
  ExtensionStat,
  FileStat,
  RepositoryAge,
  RepositoryStatistics,
} from '../types/repository.js';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  'target',
  'vendor',
  '.turbo',
  'coverage',
  '.nyc_output',
]);

export class StatisticsAnalyzer {
  async analyze(root: string): Promise<RepositoryStatistics> {
    const [files, commitInfo, contributorCount] = await Promise.all([
      this.listFiles(root),
      this.getCommitInfo(root),
      this.getContributorCount(root),
    ]);

    const totalFiles = files.length;

    // Compute per-file stats, directory sizes, and extension counts
    const dirMap = new Map<string, DirectorySummary>();
    const extMap = new Map<string, number>();
    let totalSizeBytes = 0;
    let totalSourceFiles = 0;

    const fileStats: FileStat[] = [];

    await Promise.all(
      files.map(async (file) => {
        const absPath = join(root, file);
        let fileSize = 0;
        try {
          const s = await stat(absPath);
          fileSize = s.size;
        } catch {
          return;
        }

        totalSizeBytes += fileSize;

        // Extension tracking
        const ext = extname(file).toLowerCase();
        if (ext) {
          extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
        }

        // Directory tracking : aggregate up to depth 3
        const parts = file.split('/');
        const depth = Math.min(parts.length - 1, 3);
        for (let d = 1; d <= depth; d++) {
          const dirPath = parts.slice(0, d).join('/');
          if (IGNORED_DIRS.has(parts[0] ?? '')) break;
          const existing = dirMap.get(dirPath) ?? { path: dirPath, fileCount: 0, byteSize: 0 };
          dirMap.set(dirPath, {
            ...existing,
            fileCount: existing.fileCount + 1,
            byteSize: existing.byteSize + fileSize,
          });
        }

        // Source file tracking
        const sourceExts = new Set([
          '.ts',
          '.tsx',
          '.mts',
          '.cts',
          '.js',
          '.jsx',
          '.mjs',
          '.cjs',
          '.go',
          '.rs',
          '.py',
          '.pyw',
          '.java',
          '.kt',
          '.cs',
          '.rb',
          '.php',
          '.swift',
          '.c',
          '.h',
          '.cpp',
          '.zig',
          '.dart',
          '.html',
          '.vue',
          '.svelte',
          '.astro',
          '.css',
          '.scss',
        ]);
        if (sourceExts.has(ext)) {
          totalSourceFiles++;
          fileStats.push({ path: file, lineCount: 0, byteSize: fileSize });
        }
      }),
    );

    // Sort for largest files and directories
    const largestSourceFiles = fileStats.sort((a, b) => b.byteSize - a.byteSize).slice(0, 10);

    const allDirectories = [...dirMap.values()].sort((a, b) => b.fileCount - a.fileCount);
    const largestDirectories = allDirectories.slice(0, 8);
    const directorySummary = allDirectories.slice(0, 20);

    // Extension stats
    const totalExtFiles = [...extMap.values()].reduce((a, b) => a + b, 0);
    const mostCommonExtensions: ExtensionStat[] = [...extMap.entries()]
      .map(([extension, count]) => ({
        extension,
        count,
        percentage: totalExtFiles > 0 ? Math.round((count / totalExtFiles) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFiles,
      totalSourceFiles,
      totalSizeBytes,
      directorySummary,
      largestDirectories,
      repositoryAge: commitInfo.age,
      commitCount: commitInfo.commitCount,
      contributorCount,
      mostCommonExtensions,
      largestSourceFiles,
    };
  }

  private async listFiles(root: string): Promise<string[]> {
    const result = await runGit(['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      allowFailure: true,
    });
    return result.stdout
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
      .filter((f) => {
        const topDir = f.split('/')[0] ?? '';
        return !IGNORED_DIRS.has(topDir);
      });
  }

  private async getCommitInfo(root: string): Promise<{ age: RepositoryAge; commitCount: number }> {
    const [countResult, firstResult] = await Promise.all([
      runGit(['rev-list', '--count', 'HEAD'], { cwd: root, allowFailure: true }),
      runGit(['log', '--reverse', '--format=%aI', '--max-parents=0', 'HEAD'], {
        cwd: root,
        allowFailure: true,
      }),
    ]);

    const commitCount = parseInt(countResult.stdout.trim() || '0', 10);
    const startDateStr = firstResult.stdout.trim().split('\n')[0];
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const now = new Date();
    const ageInDays = startDate
      ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      commitCount,
      age: {
        startDate: startDateStr || undefined,
        ageInDays,
        formatted: this.formatAge(ageInDays),
      },
    };
  }

  private async getContributorCount(root: string): Promise<number> {
    const result = await runGit(['log', '--format=%ae', 'HEAD'], { cwd: root, allowFailure: true });
    if (!result.stdout.trim()) return 0;
    const unique = new Set(
      result.stdout
        .split('\n')
        .map((e) => e.trim())
        .filter(Boolean),
    );
    return unique.size;
  }

  private formatAge(days: number): string {
    if (days === 0) return 'today';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`;
  }
}
