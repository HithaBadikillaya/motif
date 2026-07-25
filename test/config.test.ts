import { describe, expect, it } from 'vitest';
import { motifConfigSchema } from '../src/config/schema.js';

describe('motifConfigSchema', () => {
  it('applies defaults for minimal local config', () => {
    const result = motifConfigSchema.parse({ project: 'demo' });
    expect(result.cache.enabled).toBe(true);
    expect(result.plugins.directory).toBe('.motif/plugins');
  });
});
