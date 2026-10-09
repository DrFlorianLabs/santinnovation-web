import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function editorialSettings<T>(name: string, fallback: T): T {
  const dir = process.env.CMS_CONTENT_DIR;
  if (!dir) return fallback;
  // Missing snapshots fail closed: never silently put the historical data back.
  return JSON.parse(readFileSync(resolve(dir, `${name}.json`), 'utf8')) as T;
}
