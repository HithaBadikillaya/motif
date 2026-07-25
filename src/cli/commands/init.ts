import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import enquirer from 'enquirer';
import ora from 'ora';
import { defaultLocalConfig, stringifyConfig } from '../../config/defaults.js';
import { AppError } from '../../core/errors/errors.js';
import { fileExists } from '../../utils/fs.js';
import { getRuntimeContext, withErrorHandling } from '../runtime/error-boundary.js';

const { prompt } = enquirer;

interface InitAnswers {
  name: string;
  force: boolean;
}

export function createInitCommand(): Command {
  return new Command('init')
    .alias('i')
    .description('Create a local Motif project configuration.')
    .option('-f, --force', 'Overwrite an existing motif.config.json.')
    .action(
      withErrorHandling(async (...args: unknown[]) => {
        const command = args.at(-1) as Command;
        const runtime = getRuntimeContext(args);
        const options = command.opts<{ force?: boolean }>();
        const nameAnswer = await prompt<Pick<InitAnswers, 'name'>>({
          type: 'input',
          name: 'name',
          message: 'Project name',
          initial: process.cwd().split('/').at(-1) ?? 'motif-project',
        });
        const forceAnswer = options.force
          ? { force: true }
          : await prompt<Pick<InitAnswers, 'force'>>({
              type: 'confirm',
              name: 'force',
              message: 'Overwrite existing config if present?',
              initial: false,
            });
        const answers: InitAnswers = { ...nameAnswer, ...forceAnswer };

        const target = resolve(process.cwd(), 'motif.config.json');
        if ((await fileExists(target)) && !options.force && !answers.force) {
          throw new AppError(`Configuration already exists at ${target}`, {
            code: 'CONFIG_EXISTS',
            exitCode: 2,
            hint: 'Run motif init --force to overwrite it.',
          });
        }

        const spinner = ora('Writing motif.config.json').start();
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, stringifyConfig({ ...defaultLocalConfig, project: answers.name }));
        spinner.succeed('Created motif.config.json');
        runtime.output.success('Motif is ready for this project.');
      }),
    );
}
