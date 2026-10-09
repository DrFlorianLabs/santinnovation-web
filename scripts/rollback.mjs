import { readdir, readFile, mkdir, symlink, rename } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { acquireLock } from './lib/publication-lock.mjs';
import { runManaged } from './lib/publication-runner.mjs';
import { projectContent } from './project-content.mjs';
import { configuration, atomicJSON, currentRelease, releaseManifest, status, safeError } from './lib/publication-runtime.mjs';
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
    // The last successful build may predate current CMS changes. Establish the
    // baseline now, under the publication lock, never from an old status file.
    let baseline = null, rollbackMode = 'until-content-changes', rollbackCause = null;
    try {
      const buffer = join(config.local, 'export-buffer');
      await mkdir(buffer, { recursive: true, mode: 0o700 });
      await runManaged(lock, 'npm', ['run', 'export', '--', join(buffer, 'bundle.json'), join(buffer, 'media')], {
        cwd: join(config.root, 'cms'), timeout: config.timeout, failureCode: 'EXPORT_FAILED',
        env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH || ''}` },
      });
      const projected = projectContent(JSON.parse(await readFile(join(buffer, 'bundle.json'), 'utf8')));
      baseline = createHash('sha256').update(JSON.stringify(projected)).digest('hex');
    } catch (error) {
      if (error?.code === 'PROCESS_STILL_RUNNING') throw error;
      // Recovery must remain possible during an editorial/export incident, but
      // an unknown baseline can only be released by an explicit --force.
      rollbackMode = 'until-forced'; rollbackCause = safeError(error);
    }
    await atomicJSON(join(config.local, 'publication-pin.json'), { version: 1, releaseId: id, baselineDigest: baseline, mode: rollbackMode, createdAt: new Date().toISOString() });
    const candidate = join(config.local, `rollback-${randomUUID()}`);
    const out = join(config.releases, id, 'site');
    await symlink(relative(config.local, out), candidate, 'dir');
    await rename(candidate, join(config.local, 'site-current'));
    await status(config, { state: 'rolledBack', releaseId: id, directory: out, digest: manifest.contentDigest, observedDigest: baseline, rollbackMode, rollbackCause, previousReleaseId: current?.id || null });
    console.log(rollbackMode === 'until-forced'
      ? 'Retour arrière local effectué. Export courant indisponible : maintien jusqu’à une reprise explicite avec release --force.'
      : 'Retour arrière local effectué. Conservé jusqu’au prochain changement de contenu publié (ou release --force).');
  }
} catch (error) { await status(config, { state: 'error', error: safeError(error) }); console.error(JSON.stringify(safeError(error))); process.exitCode = 1; }
finally { if (lock) await lock.release(); }
