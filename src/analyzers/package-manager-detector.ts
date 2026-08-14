import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageManagerInfo, PackageManagerName } from '../types/repository.js';

interface LockfileCandidate {
  file: string;
  manager: PackageManagerName;
}

const LOCKFILES: LockfileCandidate[] = [
  { file: 'bun.lock', manager: 'bun' },
  { file: 'bun.lockb', manager: 'bun' },
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock', manager: 'yarn' },
  { file: 'package-lock.json', manager: 'npm' },
  { file: 'Cargo.lock', manager: 'cargo' },
  { file: 'go.sum', manager: 'go' },
  { file: 'poetry.lock', manager: 'poetry' },
  { file: 'Pipfile.lock', manager: 'pip' },
  { file: 'deno.lock', manager: 'deno' },
];

export class PackageManagerDetector {
  async detect(root: string): Promise<PackageManagerInfo> {
    // 1. Check packageManager field in package.json (most authoritative)
    const fromManifest = await this.fromPackageJson(root);
    if (fromManifest) return fromManifest;

    // 2. Detect from lockfiles
    for (const { file, manager } of LOCKFILES) {
      if (await this.fileExists(join(root, file))) {
        return { name: manager, lockfile: file };
      }
    }

    // 3. Check for package.json presence → default to npm
    if (await this.fileExists(join(root, 'package.json'))) {
      return { name: 'npm' };
    }

    return { name: 'unknown' };
  }

  private async fromPackageJson(root: string): Promise<PackageManagerInfo | null> {
    try {
      const raw = await Bun.file(join(root, 'package.json')).text();
      const pkg = JSON.parse(raw) as { packageManager?: string };
      if (!pkg.packageManager) return null;

      const [spec = ''] = pkg.packageManager.split('+');
      const [name = '', version = ''] = spec.split('@');
      const managerName = name.trim().toLowerCase();

      const known: PackageManagerName[] = [
        'bun',
        'npm',
        'pnpm',
        'yarn',
        'cargo',
        'go',
        'pip',
        'poetry',
        'deno',
      ];

      if (known.includes(managerName as PackageManagerName)) {
        return {
          name: managerName as PackageManagerName,
          version: version || undefined,
        };
      }
    } catch {
      // not parseable
    }
    return null;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
