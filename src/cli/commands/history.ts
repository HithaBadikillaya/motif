import { Command } from 'commander';
import { GitHistoryService } from '../../core/git/history.js';
import { GitRepositoryService } from '../../core/git/repository.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

interface HistoryOptions {
  author?: string;
  since?: string;
  file?: string;
  limit: string;
  format: string;
  cwd: string;
}

export function createHistoryCommand(): Command {
  return new Command('history')
    .description('Query commit history with optional filters.')
    .option('--author <name>', 'Filter by author name or email.')
    .option('--since <date>', 'Show commits more recent than a date (e.g. "2024-01-01").')
    .option('--file <path>', 'Show commits that touched a specific file.')
    .option('--limit <n>', 'Maximum number of commits to return.', '50')
    .option('--format <fmt>', 'Output format: table or json.', 'table')
    .option('--cwd <path>', 'Repository path (defaults to current directory).', process.cwd())
    .action(
      withErrorHandling(async (options: HistoryOptions, ...args: unknown[]) => {
        const runtime = getRuntimeContext([options, ...args]);
        const { output } = runtime;
        const repoService = new GitRepositoryService();
        const historyService = new GitHistoryService();

        const cwd = options.cwd;
        const info = await repoService.detect(cwd);
        if (!info.isRepo) {
          output.error('Not a git repository.');
          process.exitCode = 1;
          return;
        }

        const result = await historyService.query(cwd, {
          author: options.author,
          since: options.since,
          file: options.file,
          limit: Number(options.limit),
        });

        if (options.format === 'json') {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        output.info(
          `Showing ${result.commits.length} of ${result.total.toLocaleString()} commits${result.hasMore ? ' (more available)' : ''}.\n`,
        );

        for (const commit of result.commits) {
          const date = commit.date ? new Date(commit.date).toLocaleDateString() : '?';
          const sha = commit.sha.slice(0, 8);
          const msg =
            commit.message.length > 72 ? `${commit.message.slice(0, 69)}…` : commit.message;
          output.info(`  ${sha}  ${date}  ${commit.authorName.padEnd(20)}  ${msg}`);
        }

        if (result.hasMore) {
          output.info(`\n  Use --limit ${Number(options.limit) * 2} to load more.`);
        }
      }),
    );
}
