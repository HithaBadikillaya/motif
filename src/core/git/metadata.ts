import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { GitRepositoryMetadata, GitRemote, GitSubmodule } from '../../types/git.js';
import { fileExists } from '../../utils/fs.js';
import { runGit } from './command.js';

export class GitMetadataService {
  async metadata(cwd: string): Promise<GitRepositoryMetadata> {
    const [remotes, defaultBranch, gitignore, submodules] = await Promise.all([
      this.remotes(cwd),
      this.defaultBranch(cwd),
      this.gitignore(cwd),
      this.submodules(cwd),
    ]);
    return { remotes, defaultBranch, gitignore, submodules };
  }

  async remotes(cwd: string): Promise<GitRemote[]> {
    const result = await runGit(['remote', '-v'], { cwd, allowFailure: true });
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', url = '', typeRaw = '(fetch)'] = line.split(/\s+/);
        return {
          name,
          url,
          type: typeRaw.includes('push') ? 'push' : 'fetch',
        };
      });
  }

  async defaultBranch(cwd: string): Promise<string | undefined> {
    const symbolic = await runGit(['symbolic-ref', 'refs/remotes/origin/HEAD'], {
      cwd,
      allowFailure: true,
    });
    if (symbolic.stdout.trim()) return symbolic.stdout.trim().replace('refs/remotes/origin/', '');
    const branch = await runGit(['branch', '--show-current'], { cwd, allowFailure: true });
    return branch.stdout.trim() || undefined;
  }

  async gitignore(cwd: string): Promise<{ path?: string; patterns: string[] }> {
    const path = join(cwd, '.gitignore');
    if (!(await fileExists(path))) return { patterns: [] };
    return {
      path,
      patterns: (await readFile(path, 'utf8'))
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#')),
    };
  }

  async submodules(cwd: string): Promise<GitSubmodule[]> {
    const path = join(cwd, '.gitmodules');
    if (!(await fileExists(path))) return [];
    const content = await readFile(path, 'utf8');
    const modules: GitSubmodule[] = [];
    let currentName = '';
    let currentPath = '';
    let currentUrl = '';

    for (const line of content.split('\n')) {
      const section = /\[submodule "(.+)"\]/.exec(line);
      if (section) {
        if (currentName && currentPath && currentUrl) {
          modules.push({ name: currentName, path: currentPath, url: currentUrl });
        }
        currentName = section[1] ?? '';
        currentPath = '';
        currentUrl = '';
      }
      const pathMatch = /^\s*path = (.+)$/.exec(line);
      if (pathMatch && pathMatch[1]) currentPath = pathMatch[1];
      const urlMatch = /^\s*url = (.+)$/.exec(line);
      if (urlMatch && urlMatch[1]) currentUrl = urlMatch[1];
    }
    if (currentName && currentPath && currentUrl) {
      modules.push({ name: currentName, path: currentPath, url: currentUrl });
    }
    return modules;
  }
}
