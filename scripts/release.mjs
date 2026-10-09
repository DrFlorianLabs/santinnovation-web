import { mkdir, readFile, readdir, cp, symlink, rename, unlink } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { projectContent } from './project-content.mjs';
import { acquireLock } from './lib/publication-lock.mjs';
import { runManaged } from './lib/publication-runner.mjs';
import { configuration, json, atomicJSON, status, safeError, PublicationError, currentRelease, releaseManifest, fileHashes } from './lib/publication-runtime.mjs';

const config = configuration();
const abort = new AbortController();
const stop = () => abort.abort();
process.on('SIGTERM', stop); process.on('SIGINT', stop);
let lock, heartbeat, writes = Promise.resolve(), finalState;
const write = values => { writes = writes.then(() => status(config, values)); return writes; };
const endHeartbeat = async () => { clearInterval(heartbeat); await writes; };
try {
  lock = await acquireLock(config);
  const previous = await json(join(config.data, 'publication-status.json'), {}).catch(() => ({}));
  const current = await currentRelease(config);
  const pin = await json(join(config.local, 'publication-pin.json'));
  if (pin && current?.id === pin.releaseId && pin.mode === 'until-forced' && !process.argv.includes('--force')) {
    await releaseManifest(config, current.id);
    finalState = { state: 'rolledBack', releaseId: current.id, directory: current.site, observedDigest: null, rollbackMode: 'until-forced' };
    console.log('Retour arrière conservé : reprise explicite avec release --force requise.');
  } else {
    await write({ state: 'building', phase: 'export', startedAt: new Date().toISOString() });
    let phase = 'export';
    heartbeat = setInterval(() => { write({ state: 'building', phase }).catch(() => abort.abort()); }, 30_000);
    const buffer = join(config.local, 'export-buffer');
    await mkdir(buffer, { recursive: true, mode: 0o700 });
    const media = join(buffer, 'media');
    const env = { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH || ''}` };
    await runManaged(lock, 'npm', ['run','export','--',join(buffer,'bundle.json'),media], {
      cwd: join(config.root, 'cms'), env, timeout: config.timeout, signal: abort.signal, failureCode: 'EXPORT_FAILED',
    });
    const projected = projectContent(JSON.parse(await readFile(join(buffer,'bundle.json'),'utf8')));
    const digest = createHash('sha256').update(JSON.stringify(projected)).digest('hex');
    await write({ state: 'building', phase, observedDigest: digest });
    if (pin && current?.id === pin.releaseId && pin.baselineDigest === digest && !process.argv.includes('--force')) {
      await releaseManifest(config, current.id);
      finalState = { state: 'rolledBack', releaseId: current.id, directory: current.site, observedDigest: digest, rollbackMode: 'until-content-changes' };
      console.log('Retour arrière conservé : aucun changement de contenu publié.');
    } else {
      let currentManifest;
      if (current) currentManifest = await releaseManifest(config, current.id).catch(() => null);
      if (process.argv.includes('--if-changed') && currentManifest?.contentDigest === digest && !pin) {
        finalState = { state: 'unchanged', releaseId: current.id, directory: current.site, digest, observedDigest: digest, builtAt: currentManifest.createdAt };
        console.log('Aucun changement de contenu publié.');
      } else {
        phase = 'build'; await write({ state: 'building', phase });
        const stamp = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0,8)}`;
        const stage = join(config.releases, stamp);
        const content = join(stage, 'content');
        await mkdir(content, { recursive: true, mode: 0o700 });
        for (const [name, entries] of Object.entries(projected)) await atomicJSON(join(content, `${name}.json`), entries);
        const out = join(stage, 'site');
        await runManaged(lock, 'npm', ['run','build'], {
          cwd: config.root, env: { ...env, CMS_CONTENT_DIR: content, BUILD_OUT_DIR: out, CONTENT_BUILD_TIME: new Date().toISOString() },
          timeout: config.timeout, signal: abort.signal, failureCode: 'BUILD_FAILED',
        });
        const projectionText = JSON.stringify(projected);
        await mkdir(join(out, 'media'), { recursive: true });
        for (const filename of await readdir(media)) {
          if (!/^[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(filename)) throw new PublicationError('EXPORT_FAILED');
          if (projectionText.includes(`/media/${filename}`)) await cp(join(media,filename),join(out,'media',filename));
        }
        if (abort.signal.aborted) throw new PublicationError('INTERRUPTED');
        const manifest = { version: 1, id: stamp, createdAt: new Date().toISOString(), complete: true, contentDigest: digest, siteRelativePath: 'site', files: await fileHashes(out) };
        if (!manifest.files.some(f => f.path === 'index.html')) throw new PublicationError('INVALID_RELEASE');
        await atomicJSON(join(stage, 'manifest.json'), manifest);
        const candidate = join(config.local, `site-${stamp}`);
        await symlink(relative(config.local, out), candidate, 'dir');
        await rename(candidate, join(config.local, 'site-current'));
        if (pin) await unlink(join(config.local, 'publication-pin.json'));
        finalState = { state: 'ready', releaseId: stamp, directory: out, digest, observedDigest: digest, builtAt: manifest.createdAt, rollbackMode: null, rollbackCause: null };
        console.log('Version locale prête. Aucun transfert réseau ni déploiement effectué.');
      }
    }
  }
  await endHeartbeat();
  await write({ ...finalState, phase: null, previousReleaseId: previous.releaseId || null });
} catch (error) {
  await endHeartbeat().catch(() => {});
  const detail = safeError(error);
  await status(config, { state: ['LOCKED','LOCK_CHILD_ACTIVE','LOCK_UNVERIFIABLE'].includes(detail.code) ? 'locked' : 'error', error: detail, phase: null });
  console.error(JSON.stringify({ event: 'publication_failed', at: new Date().toISOString(), ...detail }));
  process.exitCode = 1;
} finally {
  clearInterval(heartbeat);
  if (lock) await lock.release().catch(async error => { await status(config, { state: 'error', error: safeError(error) }); process.exitCode = 1; });
  process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
}
