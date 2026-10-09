import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { decryptArchive, extractPlain } from './archive.mjs';
import { inspectDatabase } from './db-snapshot.mjs';
import { copyImmutable, defaultProjection } from './backup.mjs';
import { assertAbsent, requireKey, canonicalJSON, sha256, readArgs, onlyArgs, option, positiveInt, OpsError, isMain, reportFailure } from './common.mjs';

export async function restoreBackup({ archive, target, key: keyValue = process.env.BACKUP_KEY_HEX, projection = defaultProjection, timeoutMs = 180_000, requireProjection = false }) {
  const key = requireKey(keyValue); target = path.resolve(target); archive = path.resolve(archive);
  await assertAbsent(target); // Existing empty directories and symlinks are also refused.
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'santinnovation-restore-')); await fs.chmod(stage, 0o700);
  let createdTarget = false;
  try {
    const plain = path.join(stage, 'authenticated-container');
    await decryptArchive(archive, plain, key); // Authentication completes BEFORE extraction.
    const extracted = path.join(stage, 'extracted'); await fs.mkdir(extracted, { mode: 0o700 });
    const manifest = await extractPlain(plain, extracted);
    inspectDatabase(path.join(extracted, 'cms.sqlite'));
    const proof = JSON.parse(await fs.readFile(path.join(extracted, 'proof/projection.json'), 'utf8'));
    const secret = (await fs.readFile(path.join(extracted, 'secret'), 'utf8')).trim();
    if (secret.length < 32) throw new OpsError('CMS_SECRET_INVALID', 'Secret de restauration invalide.');
    let projectionVerified = false;
    if (proof.status === 'verified') {
      if (proof.snapshotAt !== manifest.snapshotAt || proof.sha256 !== manifest.projection.sha256 || sha256(canonicalJSON(proof.value)) !== proof.sha256) throw new OpsError('PROJECTION_PROOF_INVALID', 'La preuve de projection archivée est incohérente.');
      // Payload may set SQLite pragmas. Its verification gets an independent copy:
      // files finally restored remain byte-for-byte those authenticated above.
      const verify = path.join(stage, 'verify'); await fs.mkdir(verify, { mode: 0o700 });
      for (const file of manifest.files.filter(f => ['cms.sqlite', 'secret'].includes(f.path) || f.path.startsWith('media/'))) await copyImmutable(path.join(extracted, file.path), path.join(verify, file.path));
      await fs.mkdir(path.join(verify, 'media'), { recursive: true, mode: 0o700 });
      const actual = await projection(verify, manifest.snapshotAt, path.join(verify, 'proof', 'restored-export.json'), timeoutMs);
      if (sha256(canonicalJSON(actual)) !== proof.sha256) throw new OpsError('PROJECTION_MISMATCH', 'La projection restaurée diffère. Vérifier la version du code et des dépendances ; aucune activation n’a eu lieu.');
      projectionVerified = true;
    } else if (requireProjection) throw new OpsError('PROJECTION_UNAVAILABLE', 'Cette archive conserve les données mais ne dispose pas d’une preuve de projection.');
    await fs.mkdir(target, { mode: 0o700 }); createdTarget = true;
    for (const file of manifest.files) await copyImmutable(path.join(extracted, file.path), path.join(target, file.path));
    await fs.mkdir(path.join(target, 'media'), { recursive: true, mode: 0o700 });
    await fs.writeFile(path.join(target, 'backup-manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
    inspectDatabase(path.join(target, 'cms.sqlite'));
    return { state: projectionVerified ? 'verified' : 'warning', target, filesVerified: manifest.files.length, projectionVerified, snapshotAt: manifest.snapshotAt, siteRestored: manifest.site?.included === true, siteDirectory: manifest.site?.included ? path.join(target, 'site') : null, activated: false };
  } catch (error) {
    // This path was created exclusively by this call, never an existing dataset.
    if (createdTarget) await fs.rm(target, { recursive: true, force: true });
    throw error;
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
}
if (isMain(import.meta)) {
  try {
    const args = readArgs(); onlyArgs(args, ["archive", "target", "require-projection"]);
    const result = await restoreBackup({ archive: option(args, 'archive'), target: option(args, 'target'), timeoutMs: positiveInt(process.env.BACKUP_TIMEOUT_MS, 180_000), requireProjection: args.has('require-projection') });
    console.log(JSON.stringify(result)); if (!result.projectionVerified) process.exitCode = 2;
  } catch (error) { reportFailure(error); }
}
