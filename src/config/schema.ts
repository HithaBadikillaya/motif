import { z } from 'zod';

export const logLevelSchema = z.enum(['silent', 'error', 'warn', 'info', 'debug']);

export const motifConfigSchema = z.object({
  project: z.string().min(1).default('motif-project'),
  version: z.literal(1).default(1),
  logging: z
    .object({
      level: logLevelSchema.default('info'),
      file: z.string().optional(),
    })
    .default({ level: 'info' }),
  cache: z
    .object({
      enabled: z.boolean().default(true),
      directory: z.string().default('.motif/cache'),
    })
    .default({ enabled: true, directory: '.motif/cache' }),
  plugins: z
    .object({
      enabled: z.boolean().default(true),
      directory: z.string().default('.motif/plugins'),
    })
    .default({ enabled: true, directory: '.motif/plugins' }),
});

export type MotifConfig = z.infer<typeof motifConfigSchema>;

export const globalConfigSchema = z.object({
  version: z.literal(1).default(1),
  telemetry: z.boolean().default(false),
  updateChecks: z.boolean().default(true),
  logging: z
    .object({
      level: logLevelSchema.default('info'),
    })
    .default({ level: 'info' }),
});

export type GlobalConfig = z.infer<typeof globalConfigSchema>;

export interface ResolvedConfig {
  global: GlobalConfig;
  local: MotifConfig;
  paths: {
    global?: string;
    local?: string;
  };
}
