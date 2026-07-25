import { createCli } from './cli/program.js';
import { handleFatalError } from './core/errors/handler.js';

async function main(): Promise<void> {
  const program = await createCli();
  await program.parseAsync(process.argv);
}

main().catch(handleFatalError);
