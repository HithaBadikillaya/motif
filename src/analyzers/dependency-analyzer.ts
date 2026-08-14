import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DependencyIntelligence } from '../types/repository.js';

interface RawPackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  packageManager?: string;
}

export class DependencyAnalyzer {
  async analyze(root: string): Promise<DependencyIntelligence> {
    const pkg = await this.readPackageJson(root);

    if (!pkg) {
      return {
        hasPackageJson: false,
        prodDependenciesCount: 0,
        devDependenciesCount: 0,
        scriptsCount: 0,
        prodDependencies: {},
        devDependencies: {},
        scripts: {},
      };
    }

    const prodDependencies = pkg.dependencies ?? {};
    const devDependencies = pkg.devDependencies ?? {};
    const scripts = pkg.scripts ?? {};

    return {
      hasPackageJson: true,
      name: pkg.name,
      version: pkg.version,
      prodDependenciesCount: Object.keys(prodDependencies).length,
      devDependenciesCount: Object.keys(devDependencies).length,
      scriptsCount: Object.keys(scripts).length,
      prodDependencies,
      devDependencies,
      scripts,
    };
  }

  private async readPackageJson(root: string): Promise<RawPackageJson | null> {
    try {
      const raw = await readFile(join(root, 'package.json'), 'utf8');
      return JSON.parse(raw) as RawPackageJson;
    } catch {
      return null;
    }
  }
}
