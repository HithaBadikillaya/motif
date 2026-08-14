import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DetectedFramework, FrameworkCategory } from '../types/repository.js';

interface FrameworkSignature {
  name: string;
  category: FrameworkCategory;
  deps?: string[];
  configFiles?: string[];
}

const FRAMEWORK_SIGNATURES: FrameworkSignature[] = [
  // Frontend
  {
    name: 'Next.js',
    category: 'fullstack',
    deps: ['next'],
    configFiles: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
  },
  {
    name: 'Nuxt',
    category: 'fullstack',
    deps: ['nuxt', 'nuxt3'],
    configFiles: ['nuxt.config.ts', 'nuxt.config.js'],
  },
  { name: 'Remix', category: 'fullstack', deps: ['@remix-run/node', '@remix-run/react'] },
  {
    name: 'Gatsby',
    category: 'frontend',
    deps: ['gatsby'],
    configFiles: ['gatsby-config.js', 'gatsby-config.ts'],
  },
  {
    name: 'Astro',
    category: 'fullstack',
    deps: ['astro'],
    configFiles: ['astro.config.mjs', 'astro.config.ts', 'astro.config.js'],
  },
  {
    name: 'SvelteKit',
    category: 'fullstack',
    deps: ['@sveltejs/kit'],
    configFiles: ['svelte.config.js'],
  },
  { name: 'Svelte', category: 'frontend', deps: ['svelte'] },
  { name: 'Vue', category: 'frontend', deps: ['vue'] },
  { name: 'Angular', category: 'frontend', deps: ['@angular/core'], configFiles: ['angular.json'] },
  { name: 'React', category: 'frontend', deps: ['react', 'react-dom'] },
  { name: 'Solid', category: 'frontend', deps: ['solid-js'] },
  { name: 'Qwik', category: 'frontend', deps: ['@builder.io/qwik'] },
  { name: 'Preact', category: 'frontend', deps: ['preact'] },
  // Backend
  { name: 'NestJS', category: 'backend', deps: ['@nestjs/core', '@nestjs/common'] },
  { name: 'Express', category: 'backend', deps: ['express'] },
  { name: 'Fastify', category: 'backend', deps: ['fastify'] },
  { name: 'Hono', category: 'backend', deps: ['hono'] },
  { name: 'Koa', category: 'backend', deps: ['koa'] },
  { name: 'Elysia', category: 'backend', deps: ['elysia'] },
  { name: 'tRPC', category: 'backend', deps: ['@trpc/server'] },
  // Build tooling with UI
  {
    name: 'Vite',
    category: 'frontend',
    deps: ['vite'],
    configFiles: ['vite.config.ts', 'vite.config.js'],
  },
  { name: 'Electron', category: 'fullstack', deps: ['electron'] },
  { name: 'Tauri', category: 'fullstack', configFiles: ['src-tauri/tauri.conf.json'] },
];

const TESTING_FRAMEWORKS: Array<{ name: string; deps: string[] }> = [
  { name: 'Vitest', deps: ['vitest'] },
  { name: 'Jest', deps: ['jest', '@jest/core'] },
  { name: 'Mocha', deps: ['mocha'] },
  { name: 'Jasmine', deps: ['jasmine'] },
  { name: 'Playwright', deps: ['@playwright/test', 'playwright'] },
  { name: 'Cypress', deps: ['cypress'] },
  { name: 'Puppeteer', deps: ['puppeteer'] },
  {
    name: 'Testing Library',
    deps: ['@testing-library/react', '@testing-library/vue', '@testing-library/svelte'],
  },
  { name: 'AVA', deps: ['ava'] },
  { name: 'Bun Test', deps: [] },
];

const BUILD_TOOLS: Array<{ name: string; deps: string[]; configFiles?: string[] }> = [
  { name: 'tsup', deps: ['tsup'], configFiles: ['tsup.config.ts', 'tsup.config.js'] },
  { name: 'Turbopack', deps: ['turbopack'] },
  { name: 'Turborepo', deps: ['turbo'] },
  { name: 'Vite', deps: ['vite'] },
  { name: 'Rollup', deps: ['rollup'], configFiles: ['rollup.config.js', 'rollup.config.ts'] },
  { name: 'Webpack', deps: ['webpack'], configFiles: ['webpack.config.js', 'webpack.config.ts'] },
  { name: 'esbuild', deps: ['esbuild'] },
  { name: 'SWC', deps: ['@swc/core', '@swc/cli'] },
  { name: 'Parcel', deps: ['parcel'] },
  {
    name: 'Babel',
    deps: ['@babel/core'],
    configFiles: ['.babelrc', 'babel.config.js', 'babel.config.json'],
  },
  { name: 'tsc', deps: ['typescript'], configFiles: ['tsconfig.json'] },
];

const LINTING_TOOLS: Array<{ name: string; deps: string[]; configFiles?: string[] }> = [
  {
    name: 'ESLint',
    deps: ['eslint'],
    configFiles: [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yaml',
      'eslint.config.js',
      'eslint.config.ts',
    ],
  },
  { name: 'Biome', deps: ['@biomejs/biome'], configFiles: ['biome.json'] },
  { name: 'Oxlint', deps: ['oxlint'] },
  { name: 'TSLint', deps: ['tslint'] },
  { name: 'Rome', deps: ['rome'] },
];

const FORMATTING_TOOLS: Array<{ name: string; deps: string[]; configFiles?: string[] }> = [
  {
    name: 'Prettier',
    deps: ['prettier'],
    configFiles: [
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.json',
      '.prettierrc.yaml',
      'prettier.config.js',
    ],
  },
  { name: 'Biome', deps: ['@biomejs/biome'] },
  { name: 'dprint', deps: ['dprint'], configFiles: ['dprint.json'] },
];

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export class FrameworkDetector {
  async detect(root: string): Promise<{
    frameworks: DetectedFramework[];
    testingFrameworks: string[];
    buildTools: string[];
    lintingTools: string[];
    formattingTools: string[];
  }> {
    const pkg = await this.readPackageJson(root);
    const allDeps = this.allDeps(pkg);
    const scripts = pkg?.scripts ?? {};

    const frameworks = await this.detectFrameworks(root, allDeps);
    const testingFrameworks = await this.detectList(root, allDeps, scripts, TESTING_FRAMEWORKS);
    const buildTools = await this.detectList(root, allDeps, scripts, BUILD_TOOLS);
    const lintingTools = await this.detectList(root, allDeps, scripts, LINTING_TOOLS);
    const formattingTools = await this.detectList(root, allDeps, scripts, FORMATTING_TOOLS);

    // Bun test is used if scripts reference "bun test"
    if (
      !testingFrameworks.includes('Bun Test') &&
      Object.values(scripts).some((s) => s.includes('bun test'))
    ) {
      testingFrameworks.push('Bun Test');
    }

    return {
      frameworks,
      testingFrameworks: [...new Set(testingFrameworks)],
      buildTools: [...new Set(buildTools)],
      lintingTools: [...new Set(lintingTools)],
      formattingTools: [...new Set(formattingTools)],
    };
  }

  private async detectFrameworks(root: string, allDeps: Set<string>): Promise<DetectedFramework[]> {
    const results: DetectedFramework[] = [];
    for (const sig of FRAMEWORK_SIGNATURES) {
      const hasDep = sig.deps?.some((d) => allDeps.has(d));
      const hasConfig = sig.configFiles ? await this.anyFileExists(root, sig.configFiles) : false;
      if (hasDep || hasConfig) {
        const version = sig.deps ? this.getVersion(allDeps, sig.deps) : undefined;
        results.push({ name: sig.name, category: sig.category, version });
      }
    }
    return results;
  }

  private async detectList(
    root: string,
    allDeps: Set<string>,
    _scripts: Record<string, string>,
    signatures: Array<{ name: string; deps: string[]; configFiles?: string[] }>,
  ): Promise<string[]> {
    const results: string[] = [];
    for (const sig of signatures) {
      const hasDep = sig.deps.some((d) => allDeps.has(d));
      const hasConfig = sig.configFiles ? await this.anyFileExists(root, sig.configFiles) : false;
      if (hasDep || hasConfig) results.push(sig.name);
    }
    return results;
  }

  private allDeps(pkg: PackageJson | null): Set<string> {
    if (!pkg) return new Set();
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
  }

  private getVersion(allDeps: Set<string>, deps: string[]): string | undefined {
    void allDeps;
    void deps;
    // Could be extended to read version from package.json values
    return undefined;
  }

  private async readPackageJson(root: string): Promise<PackageJson | null> {
    try {
      const raw = await readFile(join(root, 'package.json'), 'utf8');
      return JSON.parse(raw) as PackageJson;
    } catch {
      return null;
    }
  }

  private async anyFileExists(root: string, files: string[]): Promise<boolean> {
    for (const file of files) {
      try {
        await access(join(root, file));
        return true;
      } catch {
        // continue
      }
    }
    return false;
  }
}
