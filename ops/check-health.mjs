import fs from 'node:fs/promises';
import path from 'node:path';
import { readArgs, onlyArgs, positiveInt, option, isMain, reportFailure } from './common.mjs';
export function evaluateStatus(status, { now = Date.now(), maximumAgeMs = 300_000, kind = 'publication' } = {}) {
  const timestamp = kind === 'backup' ? status?.createdAt : status?.checkedAt;
  const checked = Date.parse(timestamp);
  if (!Number.isFinite(checked)) return { healthy: false, code: 'STATUS_MISSING', kind };
  if (checked > now + 60_000) return { healthy: false, code: 'CLOCK_IN_FUTURE', kind };
  if (now - checked > maximumAgeMs) return { healthy: false, code: 'STALE', kind };
  const good = kind === 'backup' ? ['ready'] : ['ready', 'unchanged', 'rolledBack', 'building'];
  if (!good.includes(status.state)) return { healthy: false, code: 'SERVICE_FAILED', kind };
  return { healthy: true, code: 'OK', kind, ageMs: Math.max(0, now - checked) };
}
export async function checkHealth({ dataDir, backupDir, now = Date.now(), publicationMaximumAgeMs = 300_000, backupMaximumAgeMs = 26 * 60 * 60 * 1000 }) {
  const results = [];
  for (const [kind, directory, filename, maximumAgeMs] of [['publication', dataDir, 'publication-status.json', publicationMaximumAgeMs], ['backup', backupDir, 'backup-status.json', backupMaximumAgeMs]]) {
    if (!directory) continue;
    let status; try { status = JSON.parse(await fs.readFile(path.join(directory, filename), 'utf8')); } catch {}
    results.push(evaluateStatus(status, { now, kind, maximumAgeMs }));
  }
  return { healthy: results.length > 0 && results.every(r => r.healthy), results };
}
if (isMain(import.meta)) {
  try {
    const args = readArgs(); onlyArgs(args, ["data-dir", "backup-dir"]);
    const result = await checkHealth({ dataDir: option(args, 'data-dir', process.env.CMS_DATA_DIR), backupDir: args.get('backup-dir') || process.env.BACKUP_DIR, publicationMaximumAgeMs: positiveInt(process.env.PUBLICATION_STALE_MS, 300_000), backupMaximumAgeMs: positiveInt(process.env.BACKUP_STALE_MS, 26 * 60 * 60 * 1000) });
    console.log(JSON.stringify(result)); if (!result.healthy) process.exitCode = 1;
  } catch (error) { reportFailure(error); }
}
