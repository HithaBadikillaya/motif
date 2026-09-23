import { Command } from 'commander';
import ora from 'ora';
import { ContributorStatsAnalyzer } from '../../analyzers/contributor-stats.js';
import { LocAnalyzer } from '../../analyzers/loc.js';
import { GitHistoryService } from '../../core/git/history.js';
import { GitRepositoryService } from '../../core/git/repository.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

interface StatsOptions {
  cwd: string;
  format: string;
}

export function createStatsCommand(): Command {
  return new Command('stats')
    .description(
      'Display repository-level statistics: LOC, commit frequency, and top contributors.',
    )
    .option('--cwd <path>', 'Repository path (defaults to current directory).', process.cwd())
    .option('--format <fmt>', 'Output format: table or json.', 'table')
    .action(
      withErrorHandling(async (options: StatsOptions, ...args: unknown[]) => {
        const runtime = getRuntimeContext([options, ...args]);
        const { output } = runtime;

        const cwd = options.cwd;
        const repoService = new GitRepositoryService();
        const info = await repoService.detect(cwd);
        if (!info.isRepo) {
          output.error('Not a git repository.');
          process.exitCode = 1;
          return;
        }

        const spinner = ora('Gathering statistics…').start();
        const [contributors, locByExtension, commitsByDay, commitCount] = await Promise.all([
          new ContributorStatsAnalyzer().analyze({ cwd }),
          new LocAnalyzer().analyze({ cwd }),
          new GitHistoryService().commitsByDay(cwd, 90),
          new GitHistoryService().count(cwd),
        ]);
        spinner.stop();

        const stats = {
          commitCount,
          contributors,
          commitsByDay,
          locByExtension,
        };

        if (options.format === 'json') {
          console.log(JSON.stringify(stats, null, 2));
          return;
        }

        output.info('');
        output.info('── Summary ──────────────────────────────────────');
        output.info(`  Total commits:      ${commitCount.toLocaleString()}`);
        output.info(`  Contributors:       ${contributors.length}`);
        output.info(`  File extensions:    ${locByExtension.length}`);
        output.info('');

        output.info('── Lines of Code by Extension ───────────────────');
        for (const row of locByExtension.slice(0, 15)) {
          output.info(
            `  ${row.extension.padEnd(15)} ${String(row.files).padStart(5)} files  ${row.lines.toLocaleString().padStart(10)} lines`,
          );
        }
        output.info('');

        output.info('── Top Contributors ─────────────────────────────');
        for (const c of contributors.slice(0, 10)) {
          output.info(
            `  ${c.name.padEnd(30)} ${String(c.commits).padStart(5)} commits  +${c.additions} -${c.deletions}`,
          );
        }
        output.info('');

        output.info('── Commit Activity (last 90 days) ───────────────');
        // Aggregate by week for a compact view
        const weekly = new Map<string, number>();
        for (const { day, commits } of commitsByDay) {
          const date = new Date(day);
          const week = `${date.getFullYear()}-W${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`;
          weekly.set(week, (weekly.get(week) ?? 0) + commits);
        }
        const sorted = [...weekly.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
        for (const [week, count] of sorted) {
          const bar = '█'.repeat(Math.min(count, 40));
          output.info(`  ${week}  ${bar} ${count}`);
        }
        output.info('');
      }),
    );
}
