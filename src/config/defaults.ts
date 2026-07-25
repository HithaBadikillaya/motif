import type { GlobalConfig, MotifConfig } from './schema.js';

export const defaultGlobalConfig: GlobalConfig = {
  version: 1,
  telemetry: false,
  updateChecks: true,
  logging: {
    level: 'info',
  },
};

export const defaultLocalConfig: MotifConfig = {
  project: 'motif-project',
  version: 1,
  logging: {
    level: 'info',
  },
  cache: {
    enabled: true,
    directory: '.motif/cache',
  },
  plugins: {
    enabled: true,
    directory: '.motif/plugins',
  },
};

export function stringifyConfig(config: MotifConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
