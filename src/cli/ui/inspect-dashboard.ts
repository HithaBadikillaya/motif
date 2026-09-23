import chalk, { type ChalkInstance } from 'chalk';
import type { RepositoryModel } from '../../types/repository.js';
import type { GitRemote } from '../../types/git.js';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  heading: chalk.bold.hex('#A78BFA'), // violet
  label: chalk.hex('#94A3B8'), // slate-400
  value: chalk.hex('#F1F5F9'), // slate-100
  dim: chalk.hex('#475569'), // slate-600
  green: chalk.hex('#4ADE80'), // green-400
  yellow: chalk.hex('#FBBF24'), // amber-400
  red: chalk.hex('#F87171'), // red-400
  blue: chalk.hex('#60A5FA'), // blue-400
  cyan: chalk.hex('#22D3EE'), // cyan-400
  purple: chalk.hex('#C084FC'), // purple-400
  orange: chalk.hex('#FB923C'), // orange-400
  brand: chalk.bold.hex('#7C3AED'), // violet-600
  separator: chalk.hex('#1E293B'), // slate-900
  border: chalk.hex('#334155'), // slate-700
  tag: chalk.bgHex('#1E1B4B').hex('#A78BFA'), // indigo bg, violet text
};

const WIDTH = 72;

// ─── Primitives ───────────────────────────────────────────────────────────────

function line(content = ''): string {
  return `  ${content}`;
}

function rule(): string {
  return C.border(`  ${'─'.repeat(WIDTH - 2)}`);
}

function sectionHeader(title: string): string {
  const bar = C.brand('▌');
  return `\n${bar} ${C.heading(title)}\n${rule()}`;
}

function kv(label: string, value: string, labelW = 22): string {
  const paddedLabel = (label + ':').padEnd(labelW);
  return line(`${C.label(paddedLabel)} ${value}`);
}

function badge(text: string, color: ChalkInstance = C.tag): string {
  return color(` ${text} `);
}

function barChart(label: string, value: number, max: number, total: number, width = 20): string {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const bar = C.purple('█'.repeat(filled)) + C.border('░'.repeat(width - filled));
  const pct = total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
  return line(`  ${C.label(label.padEnd(14))} ${bar} ${C.dim(pct.padStart(6))}`);
}

function cleanStatus(m: RepositoryModel): string {
  if (m.git.isMergeConflict) return C.red('✖ merge conflict');
  if (!m.git.isClean) {
    const parts: string[] = [];
    if (m.git.stagedCount > 0) parts.push(C.green(`+${m.git.stagedCount} staged`));
    if (m.git.unstagedCount > 0) parts.push(C.yellow(`~${m.git.unstagedCount} modified`));
    if (m.git.untrackedCount > 0) parts.push(C.dim(`?${m.git.untrackedCount} untracked`));
    return parts.join(C.dim('  '));
  }
  return C.green('✔ clean');
}

function remoteDisplay(remotes: GitRemote[]): string {
  const fetches = remotes.filter((r) => r.type === 'fetch');
  if (fetches.length === 0) return C.dim('none');
  const first = fetches[0]!;
  const pretty = first.url.replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '');
  return C.blue(pretty) + (fetches.length > 1 ? C.dim(` +${fetches.length - 1} more`) : '');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function renderGit(m: RepositoryModel): string {
  const lines: string[] = [sectionHeader('Repository')];

  const repoName = m.path.split('/').pop() ?? m.path;
  lines.push(kv('Name', C.value(repoName)));
  lines.push(kv('Path', C.dim(m.path)));

  const branch = m.git.isDetachedHead
    ? C.red('(detached HEAD)')
    : m.git.currentBranch
      ? C.cyan(m.git.currentBranch)
      : C.dim('unknown');
  lines.push(kv('Branch', branch));

  if (m.git.defaultBranch && m.git.defaultBranch !== m.git.currentBranch) {
    lines.push(kv('Default Branch', C.dim(m.git.defaultBranch)));
  }

  lines.push(kv('Remote', remoteDisplay(m.git.remotes)));
  lines.push(kv('HEAD', m.git.headSha ? C.dim(m.git.headSha.slice(0, 10)) : C.dim('none')));
  lines.push(kv('Working Tree', cleanStatus(m)));

  if (m.git.submodules.length > 0) {
    lines.push(kv('Submodules', C.value(String(m.git.submodules.length))));
  }

  return lines.join('\n');
}

function renderActivity(m: RepositoryModel): string {
  const lines: string[] = [sectionHeader('Activity')];
  lines.push(kv('Age', C.value(m.stats.repositoryAge.formatted)));
  lines.push(
    kv(
      'First Commit',
      m.stats.repositoryAge.startDate
        ? C.dim(m.stats.repositoryAge.startDate.slice(0, 10))
        : C.dim('—'),
    ),
  );
  lines.push(kv('Commits', C.value(m.stats.commitCount.toLocaleString())));
  lines.push(kv('Contributors', C.value(m.stats.contributorCount.toLocaleString())));
  return lines.join('\n');
}

function renderProject(m: RepositoryModel): string {
  const lines: string[] = [sectionHeader('Tech Stack')];

  lines.push(kv('Primary Language', C.value(m.project.primaryLanguage)));

  // Language bar chart (top 6)
  if (m.project.languageBreakdown.length > 0) {
    lines.push('');
    const top = m.project.languageBreakdown.slice(0, 6);
    const maxBytes = top[0]?.byteSize ?? 1;
    const totalBytes = m.project.languageBreakdown.reduce((s, l) => s + l.byteSize, 0);
    for (const lang of top) {
      lines.push(barChart(lang.language, lang.byteSize, maxBytes, totalBytes));
    }
    lines.push('');
  }

  if (m.project.frameworks.length > 0) {
    const fw = m.project.frameworks.map((f) => badge(f.name)).join(' ');
    lines.push(kv('Frameworks', fw));
  }

  lines.push(kv('Package Manager', C.orange(m.project.packageManager.name)));

  if (m.project.buildTools.length > 0) {
    lines.push(kv('Build Tool', C.value(m.project.buildTools.join(', '))));
  }
  if (m.project.testingFrameworks.length > 0) {
    lines.push(kv('Testing', C.value(m.project.testingFrameworks.join(', '))));
  }
  if (m.project.lintingTools.length > 0) {
    lines.push(kv('Linting', C.dim(m.project.lintingTools.join(', '))));
  }
  if (m.project.formattingTools.length > 0) {
    lines.push(kv('Formatting', C.dim(m.project.formattingTools.join(', '))));
  }

  return lines.join('\n');
}

function renderDependencies(m: RepositoryModel): string {
  if (!m.dependencies.hasPackageJson) return '';
  const lines: string[] = [sectionHeader('Dependencies')];

  if (m.dependencies.name) {
    lines.push(
      kv(
        'Package',
        C.value(m.dependencies.name + (m.dependencies.version ? `@${m.dependencies.version}` : '')),
      ),
    );
  }
  lines.push(kv('Production', C.green(String(m.dependencies.prodDependenciesCount))));
  lines.push(kv('Development', C.dim(String(m.dependencies.devDependenciesCount))));
  lines.push(kv('Scripts', C.dim(String(m.dependencies.scriptsCount))));
  return lines.join('\n');
}

function renderWorkspace(m: RepositoryModel): string {
  if (!m.workspace.isMonorepo) return '';
  const lines: string[] = [sectionHeader('Workspace')];
  lines.push(kv('Type', badge(m.workspace.monorepoType.toUpperCase())));
  lines.push(kv('Packages', C.value(String(m.workspace.packageCount))));

  const toShow = m.workspace.packages.slice(0, 8);
  for (const pkg of toShow) {
    lines.push(line(`  ${C.dim('∟')} ${C.value(pkg.name)}  ${C.dim(pkg.relativePath)}`));
  }
  if (m.workspace.packages.length > 8) {
    lines.push(line(C.dim(`  … and ${m.workspace.packages.length - 8} more`)));
  }
  return lines.join('\n');
}

function renderFilesystem(m: RepositoryModel): string {
  const lines: string[] = [sectionHeader('Files & Size')];
  lines.push(kv('Total Files', C.value(m.stats.totalFiles.toLocaleString())));
  lines.push(kv('Source Files', C.value(m.stats.totalSourceFiles.toLocaleString())));
  lines.push(kv('Repository Size', C.value(formatBytes(m.stats.totalSizeBytes))));

  if (m.stats.largestDirectories.length > 0) {
    lines.push('');
    lines.push(line(C.label('Largest Directories:')));
    const maxCount = m.stats.largestDirectories[0]?.fileCount ?? 1;
    for (const dir of m.stats.largestDirectories.slice(0, 6)) {
      const bar = '█'.repeat(Math.round((dir.fileCount / maxCount) * 12)).padEnd(12, '░');
      lines.push(
        line(
          `  ${C.purple(bar)}  ${C.dim((dir.fileCount + ' files').padStart(9))}  ${C.value(dir.path)}`,
        ),
      );
    }
  }

  if (m.stats.mostCommonExtensions.length > 0) {
    lines.push('');
    lines.push(line(C.label('File Extensions:')));
    const extLine = m.stats.mostCommonExtensions
      .slice(0, 8)
      .map((e) => `${C.cyan(e.extension)}${C.dim(`(${e.count})`)}`)
      .join(C.dim('  '));
    lines.push(line(`  ${extLine}`));
  }

  return lines.join('\n');
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export function renderInspectDashboard(model: RepositoryModel): string {
  if (!model.git.isRepo) {
    return ['', C.red('  ✖ Not a Git repository'), C.dim(`  Path: ${model.path}`), ''].join('\n');
  }

  const header = [
    '',
    C.brand('  ▲ motif inspect') + C.dim('  — Repository Intelligence'),
    C.border('  ' + '─'.repeat(WIDTH - 2)),
    '',
  ].join('\n');

  const footer = [
    '',
    rule(),
    line(C.dim(`Analyzed at ${new Date(model.analyzedAt).toLocaleString()}`)),
    '',
  ].join('\n');

  const sections = [
    renderGit(model),
    renderActivity(model),
    renderProject(model),
    renderDependencies(model),
    renderWorkspace(model),
    renderFilesystem(model),
  ]
    .filter(Boolean)
    .join('\n');

  return [header, sections, footer].join('\n');
}
