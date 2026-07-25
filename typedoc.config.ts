import type { TypeDocOptions } from 'typedoc';

const config: Partial<TypeDocOptions> = {
  entryPoints: ['src/index.ts'],
  out: 'docs',
  name: 'Motif',
  excludePrivate: true,
  excludeInternal: true,
};

export default config;
