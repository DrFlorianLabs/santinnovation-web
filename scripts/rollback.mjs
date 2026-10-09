import { readdir, mkdir, symlink, rename } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { acquireLock } from './lib/publication-lock.mjs';
import { configuration, json, atomicJSON, currentRelease, releaseManifest, status, safeError, PublicationError } from './lib/publication-runtime.mjs';
const config = configuration();
let lock;
try {
  lock = await acquireLock(config, 'rollback');
  await mkdir(config.releases, { recursive: true, mode: 0o700 });
  const id = process.argv[2];
  if (!id || id === '--list') {
    for (const name of (await readdir(config.releases)).sort()) {
      try { const m = await releaseManifest(config, name); console.log(JSON.stringify({ id: m.id, createdAt: m.createdAt, contentDigest: m.contentDigest })); } catch { /* Never offer incomplete/legacy releases. */ }
    }
  } else {
    const manifest = await releaseManifest(config, id);
    const current = await currentRelease(config);
    const previous = await json(join(config.data, 'publication-status.json'), {});
    const baseline = previous.observedDigest || previous.digest || (current ? (await releaseManifest(config, current.id)).contentDigest : null);
    if (!/^[a-f0-9]{64}$/.test(baseline || '')) throw new PublicationError('INVALID_RELEASE');
    await atomicJSON(join(config.local, 'publication-pin.json'), { version: 1, releaseId: id, baselineDigest: baseline, createdAt: new Date().toISOString() });
    const candidate = join(config.local, `rollback-${randomUUID()}`);
    const out = join(config.releases, id, 'site');
    await symlink(relative(config.local, out), candidate, 'dir');
    await rename(candidate, join(config.local, 'site-current'));
    await status(config, { state: 'rolledBack', releaseId: id, directory: out, digest: manifest.contentDigest, observedDigest: baseline, rollbackMode: 'until-content-changes', previousReleaseId: current?.id || null });
    console.log('Retour arrière local effectué. Conservé jusqu’au prochain changement de contenu publié (ou release --force).');
  }
} catch (error) { await status(config, { state: 'error', error: safeError(error) }); console.error(JSON.stringify(safeError(error))); process.exitCode = 1; }
finally { if (lock) await lock.release(); }
