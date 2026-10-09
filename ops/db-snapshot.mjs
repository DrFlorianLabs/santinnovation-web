import { DatabaseSync, backup } from 'node:sqlite';
import { assertAbsent, isMain, OpsError, reportFailure } from './common.mjs';
export async function snapshotDatabase(source, destination, { rate = 100 } = {}) {
  await assertAbsent(destination);
  const db = new DatabaseSync(source, { readOnly: true });
  try { db.exec('PRAGMA busy_timeout = 5000'); await backup(db, destination, { rate }); }
  finally { db.close(); }
}
export function inspectDatabase(filename) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    const checks = db.prepare('PRAGMA integrity_check').all();
    if (checks.length !== 1 || checks[0].integrity_check !== 'ok') throw new OpsError('SQLITE_INTEGRITY_FAILED', 'La vérification d’intégrité SQLite a échoué.');
    const media = db.prepare('SELECT filename FROM medias WHERE filename IS NOT NULL ORDER BY filename').all().map(row => row.filename);
    return [...new Set(media)];
  } finally { db.close(); }
}
if (isMain(import.meta)) {
  const [source, destination] = process.argv.slice(2);
  if (!source || !destination) reportFailure(new OpsError('ARGUMENT_INVALID', 'Deux chemins sont requis.'));
  else snapshotDatabase(source, destination).catch(reportFailure);
}
