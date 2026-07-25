import { Command } from 'commander';

const completionScript = `# Motif shell completion
_motif_completion() {
  local words cword
  words=("\${COMP_WORDS[@]}")
  cword=$COMP_CWORD
  COMPREPLY=($(COMP_CWORD="$cword" COMP_LINE="$COMP_LINE" motif __complete "\${words[@]}" 2>/dev/null))
}
complete -F _motif_completion motif
`;

export function createCompletionCommand(): Command {
  const command = new Command('completion')
    .description('Print shell completion setup.')
    .argument('[shell]', 'Target shell: bash, zsh, or fish.', 'bash')
    .action((shell: string) => {
      if (shell === 'bash' || shell === 'zsh') {
        console.log(completionScript);
        return;
      }
      if (shell === 'fish') {
        console.log('complete -c motif -f -a "init doctor completion version help"');
        return;
      }
      console.error(`Unsupported shell: ${shell}`);
      process.exitCode = 1;
    });

  return command;
}
