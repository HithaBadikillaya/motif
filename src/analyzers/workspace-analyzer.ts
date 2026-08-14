import { access, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { MonorepoType, WorkspaceIntelligence, WorkspacePackage } from '../types/repository.js';

interface RawPackageJson {
  name?: string;
  workspaces?: string[] | { packages: string[] };
}

export class WorkspaceAnalyzer {
  async analyze(root: string): Promise<WorkspaceIntelligence> {
    const checks = await Promise.all([
      this.checkPnpmWorkspace(root),
      this.checkTurbo(root),
      this.checkNx(root),
      this.checkLerna(root),
      this.checkNpmYarnBunWorkspace(root),
      this.checkCargoWorkspace(root),
    ]);

    for (const result of checks) {
      if (result.isMonorepo) return result;
    }

    return {
      isMonorepo: false,
      monorepoType: 'none',
      packageCount: 0,
      packages: [],
    };
  }

  private async checkPnpmWorkspace(root: string): Promise<WorkspaceIntelligence> {
    const wsFile = join(root, 'pnpm-workspace.yaml');
    if (!(await this.fileExists(wsFile))) {
      return this.none();
    }

    const packages = await this.resolveGlobs(root, await this.parsePnpmWorkspace(wsFile));
    return {
      isMonorepo: packages.length > 0,
      monorepoType: 'pnpm',
      packageCount: packages.length,
      packages,
    };
  }

  private async checkTurbo(root: string): Promise<WorkspaceIntelligence> {
    if (!(await this.fileExists(join(root, 'turbo.json')))) return this.none();
    const pkgPackages = await this.packagesFromPackageJson(root);
    return {
      isMonorepo: pkgPackages.length > 0,
      monorepoType: 'turbo',
      packageCount: pkgPackages.length,
      packages: pkgPackages,
    };
  }

  private async checkNx(root: string): Promise<WorkspaceIntelligence> {
    if (!(await this.fileExists(join(root, 'nx.json')))) return this.none();
    const pkgPackages = await this.packagesFromPackageJson(root);
    return {
      isMonorepo: true,
      monorepoType: 'nx',
      packageCount: pkgPackages.length,
      packages: pkgPackages,
    };
  }

  private async checkLerna(root: string): Promise<WorkspaceIntelligence> {
    const lernaFile = join(root, 'lerna.json');
    if (!(await this.fileExists(lernaFile))) return this.none();
    try {
      const raw = JSON.parse(await readFile(lernaFile, 'utf8')) as {
        packages?: string[];
      };
      const globs = raw.packages ?? ['packages/*'];
      const packages = await this.resolveGlobs(root, globs);
      return {
        isMonorepo: true,
        monorepoType: 'lerna',
        packageCount: packages.length,
        packages,
      };
    } catch {
      return this.none();
    }
  }

  private async checkNpmYarnBunWorkspace(root: string): Promise<WorkspaceIntelligence> {
    const pkgFile = join(root, 'package.json');
    if (!(await this.fileExists(pkgFile))) return this.none();
    try {
      const raw = JSON.parse(await readFile(pkgFile, 'utf8')) as RawPackageJson;
      if (!raw.workspaces) return this.none();

      const globs = Array.isArray(raw.workspaces) ? raw.workspaces : raw.workspaces.packages;
      const packages = await this.resolveGlobs(root, globs);

      const monorepoType = await this.detectSubtype(root);

      return {
        isMonorepo: packages.length > 0,
        monorepoType,
        packageCount: packages.length,
        packages,
      };
    } catch {
      return this.none();
    }
  }

  private async checkCargoWorkspace(root: string): Promise<WorkspaceIntelligence> {
    const cargoFile = join(root, 'Cargo.toml');
    if (!(await this.fileExists(cargoFile))) return this.none();
    try {
      const content = await readFile(cargoFile, 'utf8');
      if (!content.includes('[workspace]')) return this.none();
      // Basic TOML member extraction
      const membersMatch = /members\s*=\s*\[([^\]]+)\]/.exec(content);
      if (!membersMatch) return this.none();
      const rawMembers = membersMatch[1];
      if (!rawMembers) return this.none();
      const members = rawMembers
        .split(',')
        .map((m) => m.trim().replace(/"/g, '').replace(/'/g, ''))
        .filter(Boolean);
      const packages = await this.resolveGlobs(root, members);
      return {
        isMonorepo: packages.length > 0,
        monorepoType: 'cargo',
        packageCount: packages.length,
        packages,
      };
    } catch {
      return this.none();
    }
  }

  private async packagesFromPackageJson(root: string): Promise<WorkspacePackage[]> {
    try {
      const raw = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as RawPackageJson;
      if (!raw.workspaces) return [];
      const globs = Array.isArray(raw.workspaces) ? raw.workspaces : raw.workspaces.packages;
      return this.resolveGlobs(root, globs);
    } catch {
      return [];
    }
  }

  private async resolveGlobs(root: string, globs: string[]): Promise<WorkspacePackage[]> {
    const results: WorkspacePackage[] = [];
    for (const pattern of globs) {
      if (pattern.endsWith('/*')) {
        const dirPath = join(root, pattern.slice(0, -2));
        try {
          const { readdir } = await import('node:fs/promises');
          const entries = await readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const absPath = join(dirPath, entry.name);
            const pkgJsonPath = join(absPath, 'package.json');
            let name = entry.name;
            try {
              const pkg = JSON.parse(await readFile(pkgJsonPath, 'utf8')) as { name?: string };
              if (pkg.name) name = pkg.name;
            } catch {
              // no package.json — still add
            }
            results.push({
              name,
              path: absPath,
              relativePath: relative(root, absPath),
            });
          }
        } catch {
          // directory not found
        }
      } else {
        // Exact path
        const absPath = join(root, pattern);
        if (await this.fileExists(absPath)) {
          let name = pattern;
          try {
            const pkg = JSON.parse(await readFile(join(absPath, 'package.json'), 'utf8')) as {
              name?: string;
            };
            if (pkg.name) name = pkg.name;
          } catch {
            // ignore
          }
          results.push({ name, path: absPath, relativePath: pattern });
        }
      }
    }
    return results;
  }

  private async parsePnpmWorkspace(filePath: string): Promise<string[]> {
    try {
      const content = await readFile(filePath, 'utf8');
      const matches = [...content.matchAll(/^\s*-\s+['"]?([^'"#\n]+)['"]?/gm)];
      return matches.map((m) => (m[1] ?? '').trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  private async detectSubtype(root: string): Promise<MonorepoType> {
    if (await this.fileExists(join(root, 'bun.lock'))) return 'bun';
    if (await this.fileExists(join(root, 'bun.lockb'))) return 'bun';
    if (await this.fileExists(join(root, 'pnpm-lock.yaml'))) return 'pnpm';
    if (await this.fileExists(join(root, 'yarn.lock'))) return 'yarn';
    return 'npm';
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private none(): WorkspaceIntelligence {
    return { isMonorepo: false, monorepoType: 'none', packageCount: 0, packages: [] };
  }
}
