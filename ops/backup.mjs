import fs from 'node:fs/promises';
import { constants, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { codeIdentity } from './code-identity.mjs';
import { encryptArchive } from './archive.mjs';
import { inspectDatabase } from './db-snapshot.mjs';
import { REPO_ROOT, requireKey, sha256, canonicalJSON, hashFile, runPrivate, OpsError, readArgs, onlyArgs, option, positiveInt, isMain, reportFailure } from './common.mjs';

export const STORE_MARKER = '.santinnovation-backup-store';
export async function prepareStore(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const marker = path.join(directory, STORE_MARKER);
  try {
    const m = JSON.parse(await fs.readFile(marker, 'utf8'));
    if (m.format !== 'santinnovation-backup-store-v1') throw new OpsError('STORE_INVALID', 'Répertoire de sauvegarde non reconnu.');
    return m;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if ((await fs.readdir(directory)).length) throw new OpsError('STORE_NOT_EMPTY', 'Choisir un répertoire de sauvegarde vide et dédié. Aucun fichier existant n’est adopté ou supprimé.');
    const m = { format: 'santinnovation-backup-store-v1', id: randomUUID() };
    await fs.writeFile(marker, JSON.stringify(m), { flag: 'wx', mode: 0o600 });
    return m;
  }
}
export async function copyImmutable(source, target) {
  const input = await fs.open(source, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await input.stat();
    if (!before.isFile()) throw new OpsError('FILE_UNSAFE', 'Seuls les fichiers ordinaires sont admis.');
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await pipeline(input.createReadStream({ autoClose: false }), createWriteStream(target, { flags: 'wx', mode: 0o600 }));
    const after = await input.stat();
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ino !== after.ino) throw new OpsError('SOURCE_CHANGED', 'Un fichier a changé pendant sa copie. Sauvegarde refusée ; les médias doivent être immuables.');
  } finally { await input.close(); }
}
async function copyTree(source, target) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory())) throw new OpsError('FILE_UNSAFE', 'Lien symbolique ou fichier spécial refusé dans une release.');
    if (entry.isDirectory()) await copyTree(path.join(source, entry.name), path.join(target, entry.name));
    else await copyImmutable(path.join(source, entry.name), path.join(target, entry.name));
  }
}
async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new OpsError('FILE_UNSAFE', 'Type de fichier non admis.');
  }
  return files;
}
export async function effectiveSecret(dataDir) {
  const env = process.env.PAYLOAD_SECRET;
  let secret = env;
  if (!secret) {
    const secretFile = path.join(dataDir, 'secret');
    const stat = await fs.lstat(secretFile);
    if (!stat.isFile() || stat.size > 16_384) throw new OpsError('CMS_SECRET_REQUIRED', 'Secret CMS privé introuvable ou invalide.');
    secret = (await fs.readFile(secretFile, 'utf8')).trim();
  }
  if (secret.length < 32 || secret.length > 16_384) throw new OpsError('CMS_SECRET_REQUIRED', 'Secret CMS privé absent ou invalide.');
  return secret;
}
export async function defaultProjection(dataDir, snapshotAt, output, timeoutMs = 180_000) {
  const secret = (await fs.readFile(path.join(dataDir, 'secret'), 'utf8')).trim();
  await fs.mkdir(path.dirname(output), { recursive: true, mode: 0o700 });
  await runPrivate(process.execPath, ['--import', 'tsx', 'scripts/ops-projection.ts', output, snapshotAt], {
    cwd: path.join(REPO_ROOT, 'cms'), timeoutMs,
    env: { CMS_DATA_DIR: dataDir, PAYLOAD_SECRET: secret, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
  });
  return JSON.parse(await fs.readFile(output, 'utf8'));
}
function checkpoint(filename) {
  const db = new DatabaseSync(filename);
  try { const result = db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get(); if (result?.busy) throw new OpsError('SQLITE_BUSY', 'La copie SQLite reste occupée.'); }
  finally { db.close(); }
}
async function writeStatus(directory, value) {
  const temporary = path.join(directory, `.${randomUUID()}.status`);
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
    await fs.rename(temporary, path.join(directory, 'backup-status.json'));
  } finally { await fs.rm(temporary, { force: true }); }
}
export async function createBackup({ dataDir, backupDir, key: keyValue = process.env.BACKUP_KEY_HEX, projection = defaultProjection, siteDir = null, timeoutMs = 180_000, requireProjection = false }) {
  const key = requireKey(keyValue); // No writes at all when the key is missing.
  dataDir = await fs.realpath(path.resolve(dataDir)); backupDir = path.resolve(backupDir);
  const sourceDB = path.join(dataDir, 'cms.sqlite');
  if (!(await fs.lstat(sourceDB)).isFile()) throw new OpsError('SQLITE_REQUIRED', 'Base SQLite ordinaire requise.');
  const secret = await effectiveSecret(dataDir);
  const store = await prepareStore(backupDir);
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'santinnovation-backup-')); await fs.chmod(stage, 0o700);
  let temporaryArchive;
  try {
    await runPrivate(process.execPath, [path.join(REPO_ROOT, 'ops/db-snapshot.mjs'), sourceDB, path.join(stage, 'cms.sqlite')], { timeoutMs });
    const snapshotAt = new Date().toISOString();
    const filenames = inspectDatabase(path.join(stage, 'cms.sqlite'));
    await fs.mkdir(path.join(stage, 'media'), { mode: 0o700 });
    for (const filename of filenames) {
      if (typeof filename !== 'string' || !filename || path.basename(filename) !== filename || filename.includes('\\') || filename === '.' || filename === '..') throw new OpsError('MEDIA_PATH_INVALID', 'Nom de fichier média non admissible.');
      await copyImmutable(path.join(dataDir, 'media', filename), path.join(stage, 'media', filename));
    }
    await fs.writeFile(path.join(stage, 'secret'), secret, { flag: 'wx', mode: 0o600 });
    await fs.mkdir(path.join(stage, 'proof'), { mode: 0o700 });
    let proof;
    try {
      const value = await projection(stage, snapshotAt, path.join(stage, 'proof', 'raw-export.json'), timeoutMs);
      proof = { status: 'verified', snapshotAt, sha256: sha256(canonicalJSON(value)), value };
    } catch (error) {
      if (requireProjection) throw new OpsError('PROJECTION_REQUIRED', 'Projection refusée : aucune archive complète déclarée.');
      // An editorial incident must not stop the preservation of the database.
      proof = { status: 'unavailable', snapshotAt, code: error instanceof OpsError ? error.code : 'PROJECTION_FAILED' };
    }
    await fs.writeFile(path.join(stage, 'proof', 'projection.json'), canonicalJSON(proof), { flag: 'wx', mode: 0o600 });
    checkpoint(path.join(stage, 'cms.sqlite')); inspectDatabase(path.join(stage, 'cms.sqlite'));
    let site = { included: false, reason: 'Aucune release publique sélectionnée ou disponible.' };
    if (siteDir) {
      let source;
      try { source = await fs.realpath(path.resolve(siteDir)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      if (source) {
        if (!(await fs.lstat(path.join(source, 'index.html'))).isFile()) throw new OpsError('SITE_INCOMPLETE', 'La release sélectionnée ne contient pas index.html.');
        await copyTree(source, path.join(stage, 'site'));
        site = { included: true, releaseName: path.basename(path.dirname(source)), independentSnapshot: true };
        const releaseManifest = path.join(path.dirname(source), 'manifest.json');
        try { await copyImmutable(releaseManifest, path.join(stage, 'site-release.json')); }
        catch (e) { if (e.code !== 'ENOENT') throw e; }
      }
    }
    const approved = ['cms.sqlite', 'secret', ...filenames.map(n => `media/${n}`), 'proof/projection.json'];
    if (site.included) approved.push(...(await listFiles(path.join(stage, 'site'))).map(n => `site/${n}`));
    try { await fs.stat(path.join(stage, 'site-release.json')); approved.push('site-release.json'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const files = [];
    for (const relative of approved.sort()) { const filename = path.join(stage, relative); files.push({ path: relative, size: (await fs.stat(filename)).size, sha256: await hashFile(filename) }); }
    const id = randomUUID();
    const manifest = { format: 'santinnovation-backup-v1', id, storeId: store.id, snapshotAt, createdAt: new Date().toISOString(), node: process.version, code: await codeIdentity(), projection: { status: proof.status, sha256: proof.sha256 ?? null, snapshotAt }, site, files };
    const basename = `msp-backup-${snapshotAt.replace(/[:.]/g, '-')}-${id}.santbackup`;
    temporaryArchive = path.join(backupDir, `.${id}.partial`);
    await encryptArchive(stage, manifest, temporaryArchive, key);
    const destination = path.join(backupDir, basename);
    await fs.link(temporaryArchive, destination); await fs.unlink(temporaryArchive); temporaryArchive = undefined;
    const result = { state: proof.status === 'verified' ? 'ready' : 'warning', archive: basename, createdAt: manifest.createdAt, snapshotAt, projectionVerified: proof.status === 'verified', siteIncluded: site.included, archiveSha256: await hashFile(destination) };
    await writeStatus(backupDir, result);
    return { ...result, path: destination };
  } catch (error) {
    // Do not leave a prior success looking current when this invocation failed.
    // Never include child output, credentials, or arbitrary exception messages.
    try {
      let previous;
      try { previous = JSON.parse(await fs.readFile(path.join(backupDir, 'backup-status.json'), 'utf8')); } catch {}
      const lastBackup = previous?.archive ? { archive: previous.archive, createdAt: previous.createdAt } : previous?.lastBackup ?? null;
      await writeStatus(backupDir, { state: 'error', createdAt: new Date().toISOString(), code: error instanceof OpsError ? error.code : 'BACKUP_FAILED', lastBackup });
    } catch {} // The CLI still fails if the status medium itself is unavailable.
    throw error;
  } finally {
    if (temporaryArchive) await fs.rm(temporaryArchive, { force: true });
    await fs.rm(stage, { recursive: true, force: true }); // Only this invocation's private staging directory.
  }
}
if (isMain(import.meta)) {
  try {
    const args = readArgs(); onlyArgs(args, ["data-dir", "backup-dir", "site-dir", "without-site", "require-projection"]);
    const result = await createBackup({ dataDir: option(args, 'data-dir', process.env.CMS_DATA_DIR), backupDir: option(args, 'backup-dir', process.env.BACKUP_DIR), siteDir: args.has('without-site') ? null : (args.has('site-dir') ? option(args, 'site-dir') : path.join(process.env.PUBLICATION_ROOT || REPO_ROOT, '.local/site-current')), timeoutMs: positiveInt(process.env.BACKUP_TIMEOUT_MS, 180_000), requireProjection: args.has('require-projection') });
    console.log(JSON.stringify(result)); if (!result.projectionVerified) process.exitCode = 2;
  } catch (error) { reportFailure(error); }
}
