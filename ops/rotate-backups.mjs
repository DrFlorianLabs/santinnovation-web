import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { MAGIC, decryptArchive, inspectPlainManifest } from './archive.mjs';
import { STORE_MARKER } from './backup.mjs';
import { requireKey, readArgs, onlyArgs, option, positiveInt, OpsError, isMain, reportFailure } from './common.mjs';

export async function rotateBackups({ directory, keep = 10, apply = false, confirmed = false, key: keyValue = process.env.BACKUP_KEY_HEX }) {
  const key = requireKey(keyValue);
  directory = path.resolve(directory); keep = positiveInt(keep, 10);
  if (apply && !confirmed) throw new OpsError('CONFIRMATION_REQUIRED', 'La suppression exige --apply et --confirm-rotate. Le mode par défaut reste une simulation.');
  const marker = JSON.parse(await fs.readFile(path.join(directory, STORE_MARKER), 'utf8'));
  if (marker.format !== 'santinnovation-backup-store-v1') throw new OpsError('STORE_INVALID', 'Répertoire de sauvegarde non reconnu.');
  const archives = []; const untouched = [];
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), "santinnovation-rotation-")); await fs.chmod(stage, 0o700);
  try {
  for (const name of await fs.readdir(directory)) {
    if (!/^msp-backup-\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d-\d{3}Z-[a-f0-9-]{36}\.santbackup$/.test(name)) continue;
    const filename = path.join(directory, name); const stat = await fs.lstat(filename);
    if (!stat.isFile()) continue;
    const file = await fs.open(filename, 'r');
    try { const header = Buffer.alloc(MAGIC.length); await file.read(header, 0, header.length, 0); if (!header.equals(MAGIC)) continue; }
    finally { await file.close(); }
    const plain = path.join(stage, 'authenticated-container');
    try {
      await decryptArchive(filename, plain, key);
      const manifest = await inspectPlainManifest(plain);
      if (manifest.storeId !== marker.id) { untouched.push({ archive: name, code: 'FOREIGN_STORE' }); continue; }
      archives.push(name);
    } catch (error) { untouched.push({ archive: name, code: error instanceof OpsError ? error.code : 'ARCHIVE_INVALID' }); }
    finally { await fs.rm(plain, { force: true }); }
  }
  archives.sort().reverse();
  const candidates = archives.slice(keep);
  if (apply) for (const name of candidates) await fs.unlink(path.join(directory, name));
  return { mode: apply ? 'apply' : 'dry-run', keep, retained: archives.slice(0, keep), candidates, deleted: apply ? candidates : [], untouched };
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
}
if (isMain(import.meta)) {
  try {
    const args = readArgs(); onlyArgs(args, ["backup-dir", "keep", "dry-run", "apply", "confirm-rotate"]);
    if (args.has('dry-run') && args.has('apply')) throw new OpsError('ARGUMENT_INVALID', 'Choisir soit --dry-run, soit --apply.');
    console.log(JSON.stringify(await rotateBackups({ directory: option(args, 'backup-dir', process.env.BACKUP_DIR), keep: positiveInt(args.get('keep'), 10), apply: args.has('apply'), confirmed: args.has('confirm-rotate') })));
  } catch (error) { reportFailure(error); }
}
