import packageJson from '../../package.json' with { type: 'json' };

export function getPackageMetadata(): { name: string; version: string; description?: string } {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  };
}
