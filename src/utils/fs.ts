import { access, readFile } from 'node:fs/promises';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonIfExists(path: string): Promise<unknown | undefined> {
  if (!(await fileExists(path))) return undefined;
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}
