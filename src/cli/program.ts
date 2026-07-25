import { Command } from 'commander';
import { createCompletionCommand } from './commands/completion.js';
import { createDoctorCommand } from './commands/doctor.js';
import { createInitCommand } from './commands/init.js';
import { createVersionCommand } from './commands/version.js';
import { createRuntimeContext } from './runtime/context.js';
import { createOutput } from './ui/output.js';
import { getPackageMetadata } from '../utils/package.js';

export async function createCli(): Promise<Command> {
  const metadata = getPackageMetadata();
  const program = new Command();

  program
    .name('motif')
    .description('A polished CLI foundation for extensible developer workflows.')
    .version(metadata.version, '-v, --version', 'Print the Motif version.')
    .helpOption('-h, --help', 'Show command help.')
    .showHelpAfterError()
    .showSuggestionAfterError()
    .option('--config <path>', 'Use a custom local configuration file.')
    .option('--global-config <path>', 'Use a custom global configuration file.')
    .option('--verbose', 'Enable verbose logging.')
    .option('--debug', 'Enable debug diagnostics.')
    .hook('preAction', async (thisCommand) => {
      const options = thisCommand.optsWithGlobals();
      thisCommand.setOptionValue('runtime', await createRuntimeContext(options));
    });

  program.addCommand(createVersionCommand(), { hidden: true });
  program.addCommand(createDoctorCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createCompletionCommand());
  program
    .command('__complete', { hidden: true })
    .allowUnknownOption()
    .action(() => {
      console.log(['init', 'doctor', 'completion', 'version', 'help'].join('\n'));
    });

  program
    .command('help [command]')
    .description('Display help for Motif or a command.')
    .action((commandName?: string) => {
      if (!commandName) {
        program.help();
        return;
      }
      const command = program.commands.find((item) => item.name() === commandName);
      if (!command) {
        createOutput().error(`Unknown command: ${commandName}`);
        process.exitCode = 1;
        return;
      }
      command.help();
    });

  return program;
}
