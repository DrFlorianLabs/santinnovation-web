import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createBackup } from '../ops/backup.mjs';
import { restoreBackup } from '../ops/restore.mjs';
import { runPrivate, REPO_ROOT } from '../ops/common.mjs';

test('production Payload snapshot is encrypted, restored to a new directory and re-exported at the same instant', { timeout: 240_000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'santinnovation-ops-cms-test-'));
  const dataDir = path.join(root, 'cms-data'); await fs.mkdir(dataDir, { mode: 0o700 });
  const secret = randomBytes(48).toString('hex');
  const key = randomBytes(32).toString('hex');
  const env = { CMS_DATA_DIR: dataDir, NODE_ENV: 'production', PAYLOAD_SECRET: secret, CMS_INIT_ADMIN_EMAIL: 'ops-test@example.invalid', CMS_INIT_ADMIN_PASSWORD: randomBytes(32).toString('hex'), CMS_SERVER_URL: 'http://127.0.0.1:3999', NEXT_TELEMETRY_DISABLED: '1', PATH: `${path.dirname(process.execPath)}:${process.env.PATH}` };
  const cwd = path.join(REPO_ROOT, 'cms');
  const inheritedSecret = process.env.PAYLOAD_SECRET;
  try {
    await runPrivate(process.execPath, ['node_modules/payload/bin.js', 'migrate'], { cwd, env });
    await runPrivate(process.execPath, ['--import', 'tsx', 'scripts/init.ts'], { cwd, env });
    await runPrivate(process.execPath, ['--import', 'tsx', 'scripts/seed-demo.ts'], { cwd, env });
    // Source secret is supplied by the environment, as on an operated CMS.
    process.env.PAYLOAD_SECRET = secret;
    const source = new DatabaseSync(path.join(dataDir, 'cms.sqlite'), { readOnly: true });
    const initialUsers = source.prepare('SELECT count(*) AS count FROM users').get().count;
    const initialVersions = source.prepare('SELECT count(*) AS count FROM _actualites_v').get().count;
    source.close();
    const backup = await createBackup({ dataDir, backupDir: path.join(root, 'backups'), key, requireProjection: true });
    assert.equal(backup.projectionVerified, true);
    const target = path.join(root, 'restored');
    const result = await restoreBackup({ archive: backup.path, target, key, requireProjection: true });
    assert.equal(result.projectionVerified, true); assert.equal(result.activated, false);
    const restored = new DatabaseSync(path.join(target, 'cms.sqlite'), { readOnly: true });
    assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(restored.prepare('SELECT count(*) AS count FROM users').get().count, initialUsers);
    assert.equal(restored.prepare('SELECT count(*) AS count FROM _actualites_v').get().count, initialVersions);
    assert.ok(restored.prepare("SELECT count(*) AS count FROM actualites WHERE _status='draft'").get().count > 0, 'private drafts are restored as well');
    restored.close();
    const proof = JSON.parse(await fs.readFile(path.join(target, 'proof/projection.json'), 'utf8'));
    assert.equal(proof.status, 'verified');
    assert.equal(JSON.stringify(proof.value).includes('DRAFT_NEVER_PUBLIC'), false);
    assert.equal(await fs.readFile(path.join(target, 'secret'), 'utf8'), secret);
    console.log('OPS_CMS_PROOF: SQLite integrity=ok; users, versions, drafts and immutable media restored; public export hash identical; no activation.');
  } finally {
    if (inheritedSecret === undefined) delete process.env.PAYLOAD_SECRET; else process.env.PAYLOAD_SECRET = inheritedSecret;
    await fs.rm(root, { recursive: true, force: true }); // Only synthetic data created by this test.
  }
});
