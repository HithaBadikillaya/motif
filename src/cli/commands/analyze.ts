import { Command } from 'commander';
import ora from 'ora';
import { RepositoryAnalyzer } from '../../analyzers/repository-analysis.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

export function createAnalyzeCommand(): Command {
  return new Command('analyze')
    .description('Run a full repository analysis and print a structured summary.')
    .option('--cwd <path>', 'Repository path (defaults to current directory).', process.cwd())
    .option('--no-blame', 'Skip blame-based ownership analysis.')
    .option('--format <fmt>', 'Output format: table or json.', 'table')
    .action(
      withErrorHandling(
        async (options: { cwd: string; blame: boolean; format: string }, ...args: unknown[]) => {
          const runtime = getRuntimeContext([options, ...args]);
          const cwd = options.cwd;
          const analyzer = new RepositoryAnalyzer();

          const spinner = ora('Analyzing repository…').start();
          const analysis = await analyzer.analyze(cwd, { blameTopN: options.blame ? 5 : 0 });
          spinner.stop();

          if (options.format === 'json') {
            console.log(JSON.stringify(analysis, null, 2));
            return;
          }

          const { output } = runtime;

          output.info('');
          output.info('── Repository ──────────────────────────────────');
          output.info(`  Root:    ${analysis.repository.root}`);
          output.info(`  Branch:  ${analysis.repository.currentBranch ?? '(detached HEAD)'}`);
          output.info(`  Commits: ${analysis.commitCount.toLocaleString()}`);
          output.info(`  Tags:    ${analysis.tags.length}`);
          output.info('');

          output.info('── Contributors ─────────────────────────────────');
          for (const c of analysis.contributors.slice(0, 10)) {
            output.info(`  ${c.name.padEnd(30)} ${String(c.commits).padStart(5)} commits`);
          }
          output.info('');

          output.info('── Churn Hotspots ───────────────────────────────');
          for (const h of analysis.churnHotspots.slice(0, 10)) {
            output.info(`  ${h.file.padEnd(45)} ${String(h.commits).padStart(4)} changes`);
          }
          output.info('');

          output.info('── Commit Message Patterns ──────────────────────');
          for (const p of analysis.messagePatterns.slice(0, 8)) {
            const label = p.conventionalType ?? p.prefix ?? 'other';
            output.info(`  ${label.padEnd(20)} ${String(p.count).padStart(5)} commits`);
          }
          output.info('');

          output.info('── Branch Health ────────────────────────────────');
          const local = analysis.branches.filter((b) => !b.remote);
          const behind = local.filter((b) => (b.behind ?? 0) > 0);
          output.info(`  Local branches: ${local.length}  (${behind.length} behind upstream)`);
          const status = analysis.status;
          if (status.clean) {
            output.success('Working tree is clean.');
          } else {
            output.warn(
              `Working tree: ${status.staged.length} staged, ${status.unstaged.length} unstaged, ${status.untracked.length} untracked`,
            );
          }
          output.info('');
        },
      ),
    );
}
