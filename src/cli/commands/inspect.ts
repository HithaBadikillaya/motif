import { Command } from 'commander';
import { resolve } from 'node:path';
import { RepositoryEngine } from '../../analyzers/repository-engine.js';
import { renderInspectDashboard } from '../ui/inspect-dashboard.js';

export function createInspectCommand(): Command {
  return new Command('inspect')
    .description('Display a comprehensive intelligence dashboard for the current Git repository.')
    .option('-p, --path <dir>', 'Path to the repository to inspect.', process.cwd())
    .option('--json', 'Output raw JSON instead of the terminal dashboard.')
    .action(async (opts: { path: string; json?: boolean }) => {
      const cwd = resolve(opts.path);
      const engine = new RepositoryEngine();

      try {
        const model = await engine.analyze({ cwd });

        if (opts.json) {
          console.log(JSON.stringify(model, null, 2));
          return;
        }

        console.log(renderInspectDashboard(model));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n  ✖ motif inspect failed: ${message}\n`);
        process.exitCode = 1;
      }
    });
}
