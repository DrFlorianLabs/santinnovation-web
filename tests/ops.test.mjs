import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { createBackup } from '../ops/backup.mjs';
import { restoreBackup } from '../ops/restore.mjs';
import { rotateBackups } from '../ops/rotate-backups.mjs';
import { evaluateStatus } from '../ops/check-health.mjs';
import { validateManifest } from '../ops/archive.mjs';
import { hashFile } from '../ops/common.mjs';

const roots = [];
test.after(async () => { for (const root of roots) await fs.rm(root, { recursive: true, force: true }); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'santinnovation-ops-test-')); roots.push(root);
  const dataDir = path.join(root, 'data'); await fs.mkdir(path.join(dataDir, 'media'), { recursive: true });
  const secret = randomBytes(48).toString('hex'); await fs.writeFile(path.join(dataDir, 'secret'), secret, { mode: 0o600 });
  await fs.writeFile(path.join(dataDir, 'media', 'fictif.png'), Buffer.from('SYNTHETIC_IMAGE_ONLY'));
  const db = new DatabaseSync(path.join(dataDir, 'cms.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE medias (id INTEGER PRIMARY KEY, filename TEXT); CREATE TABLE state (id INTEGER PRIMARY KEY, seq INTEGER); CREATE TABLE events (seq INTEGER PRIMARY KEY); CREATE TABLE padding (id INTEGER PRIMARY KEY, body TEXT); INSERT INTO medias VALUES (1,\'fictif.png\'); INSERT INTO state VALUES (1,0); INSERT INTO events VALUES (0);');
  const insert = db.prepare('INSERT INTO padding (body) VALUES (?)');
  db.exec('BEGIN'); for (let n = 0; n < 1800; n++) insert.run('DONNEES FICTIVES '.repeat(100)); db.exec('COMMIT'); db.close();
  const siteDir = path.join(root, 'release', 'site'); await fs.mkdir(path.join(siteDir, '_astro'), { recursive: true });
  await fs.writeFile(path.join(siteDir, 'index.html'), '<!doctype html><title>MSP fictive</title>'); await fs.writeFile(path.join(siteDir, '_astro', 'style.css'), 'body{color:#12324a}'); await fs.writeFile(path.join(siteDir, '.htaccess'), '# fixture only');
  await fs.writeFile(path.join(root, 'release', 'manifest.json'), JSON.stringify({ complete: true, id: 'release-fictive' }));
  return { root, dataDir, siteDir, secret, backupDir: path.join(root, 'backups'), key: randomBytes(32).toString('hex') };
}
async function projection(dataDir, snapshotAt) {
  const db = new DatabaseSync(path.join(dataDir, 'cms.sqlite'), { readOnly: true });
  try {
    const seq = db.prepare('SELECT seq FROM state WHERE id=1').get().seq;
    const max = db.prepare('SELECT MAX(seq) AS value FROM events').get().value;
    assert.equal(seq, max, 'coherent SQLite transaction snapshot');
    return { snapshotAt, seq, media: db.prepare('SELECT filename FROM medias ORDER BY filename').all() };
  } finally { db.close(); }
}
test('encrypted backup restores database, secret, media and static site byte-for-byte without activation', async () => {
  const f = await fixture();
  const result = await createBackup({ ...f, projection });
  assert.equal(result.projectionVerified, true); assert.equal(result.siteIncluded, true);
  assert.equal((await fs.stat(result.path)).mode & 0o777, 0o600);
  assert.equal((await fs.readFile(result.path)).includes(Buffer.from(f.secret)), false);
  const target = path.join(f.root, 'restored'); const restored = await restoreBackup({ archive: result.path, target, key: f.key, projection });
  assert.equal(restored.activated, false); assert.equal(restored.siteRestored, true); assert.equal(restored.projectionVerified, true);
  assert.equal(await fs.readFile(path.join(target, 'secret'), 'utf8'), f.secret);
  assert.equal(await hashFile(path.join(target, 'site/index.html')), await hashFile(path.join(f.siteDir, 'index.html')));
  const manifest = JSON.parse(await fs.readFile(path.join(target, 'backup-manifest.json'), 'utf8'));
  for (const file of manifest.files) assert.equal(await hashFile(path.join(target, file.path)), file.sha256);
});
test('SQLite online backup remains coherent while a separate writer commits transactions', async () => {
  const f = await fixture();
  const writer = new Worker(`const {parentPort,workerData}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(workerData);db.exec('PRAGMA busy_timeout=5000');let n=0;parentPort.postMessage('ready');const timer=setInterval(()=>{n++;db.exec('BEGIN IMMEDIATE');db.prepare('INSERT INTO events VALUES (?)').run(n);db.prepare('UPDATE state SET seq=?').run(n);db.exec('COMMIT');},2);parentPort.on('message',()=>{clearInterval(timer);db.close();parentPort.postMessage(n);});`, { eval: true, workerData: path.join(f.dataDir, 'cms.sqlite') });
  await once(writer, 'message');
  let result;
  try { result = await createBackup({ ...f, projection }); }
  finally { const stopped = once(writer, 'message'); writer.postMessage('stop'); const [writes] = await stopped; assert.ok(writes > 0); await writer.terminate(); }
  const restored = await restoreBackup({ archive: result.path, target: path.join(f.root, 'restored-hot'), key: f.key, projection });
  assert.equal(restored.projectionVerified, true);
});
test('missing key, tampered ciphertext and wrong key fail without creating restoration destinations', async () => {
  const f = await fixture(); await assert.rejects(createBackup({ ...f, key: '', projection }), { code: 'BACKUP_KEY_REQUIRED' });
  await assert.rejects(fs.stat(f.backupDir), { code: 'ENOENT' });
  const backup = await createBackup({ ...f, projection });
  const bytes = await fs.readFile(backup.path); bytes[Math.floor(bytes.length / 2)] ^= 1;
  const tampered = path.join(f.root, 'altered.santbackup'); await fs.writeFile(tampered, bytes);
  const target = path.join(f.root, 'tampered-restore');
  await assert.rejects(restoreBackup({ archive: tampered, target, key: f.key, projection }), { code: 'ARCHIVE_AUTH_FAILED' });
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  await assert.rejects(restoreBackup({ archive: backup.path, target, key: randomBytes(32).toString('hex'), projection }), { code: 'ARCHIVE_AUTH_FAILED' });
});
test('existing target, symlink media and differing public projection are refused', async () => {
  const f = await fixture(); const backup = await createBackup({ ...f, projection });
  await assert.rejects(restoreBackup({ archive: backup.path, target: f.dataDir, key: f.key, projection }), { code: 'TARGET_EXISTS' });
  const target = path.join(f.root, 'different');
  await assert.rejects(restoreBackup({ archive: backup.path, target, key: f.key, projection: async () => ({ different: true }) }), { code: 'PROJECTION_MISMATCH' });
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  await fs.rename(path.join(f.dataDir, 'media/fictif.png'), path.join(f.root, 'real-fixture.png'));
  await fs.symlink(path.join(f.root, 'real-fixture.png'), path.join(f.dataDir, 'media/fictif.png'));
  await assert.rejects(createBackup({ ...f, projection }));
  const failed = JSON.parse(await fs.readFile(path.join(f.backupDir, 'backup-status.json'), 'utf8'));
  assert.equal(failed.state, 'error'); assert.equal(failed.lastBackup.archive, backup.archive);
  assert.equal(evaluateStatus(failed, { kind: 'backup' }).healthy, false);
});
test('editorial export failure preserves an encrypted backup with explicit unverified warning', async () => {
  const f = await fixture(); const backup = await createBackup({ ...f, projection: async () => { throw new Error('test-only refusal'); } });
  assert.equal(backup.state, 'warning'); assert.equal(backup.projectionVerified, false);
  await assert.rejects(restoreBackup({ archive: backup.path, target: path.join(f.root, 'strict'), key: f.key, projection, requireProjection: true }), { code: 'PROJECTION_UNAVAILABLE' });
  const result = await restoreBackup({ archive: backup.path, target: path.join(f.root, 'preserved'), key: f.key, projection });
  assert.equal(result.projectionVerified, false); assert.equal(result.activated, false);
});
test('rotation is dry-run by default; explicit apply keeps newest archives and unrelated files', async () => {
  const f = await fixture(); const created = [];
  for (let n = 0; n < 3; n++) created.push(await createBackup({ ...f, projection }));
  await fs.writeFile(path.join(f.backupDir, 'unrelated.txt'), 'KEEP');
  const foreign = await createBackup({ ...f, backupDir: path.join(f.root, 'foreign-store'), projection });
  await fs.copyFile(foreign.path, path.join(f.backupDir, foreign.archive));
  const plan = await rotateBackups({ directory: f.backupDir, key: f.key, keep: 1 });
  assert.equal(plan.mode, 'dry-run'); assert.equal(plan.candidates.length, 2); assert.deepEqual(plan.deleted, []); assert.equal(plan.untouched[0].code, 'FOREIGN_STORE');
  for (const b of created) assert.ok((await fs.stat(b.path)).isFile());
  await assert.rejects(rotateBackups({ directory: f.backupDir, key: f.key, keep: 1, apply: true }), { code: 'CONFIRMATION_REQUIRED' });
  const applied = await rotateBackups({ directory: f.backupDir, key: f.key, keep: 1, apply: true, confirmed: true });
  assert.ok((await fs.stat(path.join(f.backupDir, foreign.archive))).isFile()); assert.equal(applied.deleted.length, 2); assert.ok((await fs.stat(created[2].path)).isFile()); assert.equal(await fs.readFile(path.join(f.backupDir, 'unrelated.txt'), 'utf8'), 'KEEP');
});
test('archive path traversal and stale or locked health statuses are rejected', () => {
  assert.throws(() => validateManifest({ format: 'santinnovation-backup-v1', snapshotAt: new Date().toISOString(), files: [{ path: 'site/../../private', size: 0, sha256: '0'.repeat(64) }] }), { code: 'ARCHIVE_INVALID' });
  const now = Date.parse('2026-10-09T12:00:00Z');
  assert.equal(evaluateStatus({ state: 'ready', checkedAt: '2026-10-09T11:54:00Z' }, { now }).code, 'STALE');
  assert.equal(evaluateStatus({ state: 'locked', checkedAt: '2026-10-09T12:00:00Z' }, { now }).healthy, false);
  assert.equal(evaluateStatus({ state: 'ready', checkedAt: '2026-10-09T12:00:00Z' }, { now }).healthy, true);
  assert.equal(evaluateStatus(undefined, { now }).code, 'STATUS_MISSING');
});
test('private helper processes are stopped at the configured deadline', async () => {
  const { runPrivate } = await import('../ops/common.mjs');
  await assert.rejects(runPrivate(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 40 }), { code: 'TIMEOUT' });
});
