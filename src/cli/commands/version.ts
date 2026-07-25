import { Command } from 'commander';
import { getPackageMetadata } from '../../utils/package.js';

export function createVersionCommand(): Command {
  return new Command('version')
    .alias('v')
    .description('Print the Motif version.')
    .action(() => {
      console.log(getPackageMetadata().version);
    });
}
