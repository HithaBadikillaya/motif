import { stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { runGit } from '../core/git/command.js';
import type { LanguageBreakdown } from '../types/repository.js';

const EXT_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.mts': 'TypeScript',
  '.cts': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.go': 'Go',
  '.rs': 'Rust',
  '.py': 'Python',
  '.pyw': 'Python',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',
  '.cs': 'C#',
  '.fs': 'F#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.c': 'C',
  '.h': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.hpp': 'C++',
  '.zig': 'Zig',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.erl': 'Erlang',
  '.hrl': 'Erlang',
  '.hs': 'Haskell',
  '.lhs': 'Haskell',
  '.scala': 'Scala',
  '.clj': 'Clojure',
  '.cljs': 'Clojure',
  '.dart': 'Dart',
  '.lua': 'Lua',
  '.r': 'R',
  '.R': 'R',
  '.jl': 'Julia',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.fish': 'Shell',
  '.ps1': 'PowerShell',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.astro': 'Astro',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SCSS',
  '.less': 'Less',
  '.sql': 'SQL',
  '.graphql': 'GraphQL',
  '.gql': 'GraphQL',
  '.md': 'Markdown',
  '.mdx': 'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.toml': 'TOML',
  '.xml': 'XML',
  '.proto': 'Protobuf',
};

/** Extensions that are considered source code (non-config, non-doc) */
const SOURCE_EXTENSIONS = new Set([
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
  '.kts',
  '.cs',
  '.fs',
  '.rb',
  '.php',
  '.swift',
  '.c',
  '.h',
  '.cpp',
  '.cc',
  '.cxx',
  '.hpp',
  '.zig',
  '.ex',
  '.exs',
  '.erl',
  '.hrl',
  '.hs',
  '.lhs',
  '.scala',
  '.clj',
  '.cljs',
  '.dart',
  '.lua',
  '.r',
  '.R',
  '.jl',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.ps1',
  '.html',
  '.htm',
  '.vue',
  '.svelte',
  '.astro',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.sql',
  '.graphql',
  '.gql',
]);

export interface LanguageDetectorResult {
  primaryLanguage: string;
  languageBreakdown: LanguageBreakdown[];
  totalSourceFiles: number;
}

export class LanguageDetector {
  async detect(root: string): Promise<LanguageDetectorResult> {
    const files = await this.getTrackedFiles(root);

    // acumulate stats per language
    const langStats = new Map<string, { fileCount: number; byteSize: number }>();
    let totalSourceFiles = 0;
    let totalBytes = 0;

    await Promise.all(
      files.map(async (file) => {
        const ext = extname(file).toLowerCase();
        if (!SOURCE_EXTENSIONS.has(ext)) return;
        const lang = EXT_TO_LANGUAGE[ext] ?? ext;
        let byteSize = 0;
        try {
          const s = await stat(join(root, file));
          byteSize = s.size;
        } catch {}
        const existing = langStats.get(lang) ?? { fileCount: 0, byteSize: 0 };
        langStats.set(lang, {
          fileCount: existing.fileCount + 1,
          byteSize: existing.byteSize + byteSize,
        });
        totalSourceFiles++;
        totalBytes += byteSize;
      }),
    );

    const breakdown: LanguageBreakdown[] = [...langStats.entries()]
      .map(([language, { fileCount, byteSize }]) => ({
        language,
        fileCount,
        byteSize,
        percentage: totalBytes > 0 ? Math.round((byteSize / totalBytes) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.byteSize - a.byteSize);

    const primaryLanguage = breakdown[0]?.language ?? 'Unknown';

    return { primaryLanguage, languageBreakdown: breakdown, totalSourceFiles };
  }

  private async getTrackedFiles(root: string): Promise<string[]> {
    const result = await runGit(['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      allowFailure: true,
    });
    return result.stdout.split('\n').filter(Boolean);
  }
}
