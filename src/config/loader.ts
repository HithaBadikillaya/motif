import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { readJsonIfExists } from '../utils/fs.js';
import { AppError } from '../core/errors/errors.js';
import { defaultGlobalConfig, defaultLocalConfig } from './defaults.js';
import { globalConfigSchema, motifConfigSchema, type ResolvedConfig } from './schema.js';

interface LoadConfigurationOptions {
  globalPath?: string;
  localPath?: string;
}

export async function loadConfiguration(
  options: LoadConfigurationOptions = {},
): Promise<ResolvedConfig> {
  const globalPath = resolve(options.globalPath ?? `${homedir()}/.motif/config.json`);
  const localPath = resolve(options.localPath ?? 'motif.config.json');

  const globalRaw = (await readJsonIfExists(globalPath)) ?? {};
  const localRaw = (await readJsonIfExists(localPath)) ?? {};

  const globalResult = globalConfigSchema.safeParse({ ...defaultGlobalConfig, ...globalRaw });
  const localResult = motifConfigSchema.safeParse({ ...defaultLocalConfig, ...localRaw });

  if (!globalResult.success) {
    throw AppError.fromZod('Invalid global configuration', globalResult.error);
  }

  if (!localResult.success) {
    throw AppError.fromZod('Invalid local configuration', localResult.error);
  }

  return {
    global: globalResult.data,
    local: localResult.data,
    paths: {
      global: globalPath,
      local: localPath,
    },
  };
}
