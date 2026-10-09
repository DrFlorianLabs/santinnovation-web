import { readdir, readFile, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { acquireLock } from './lib/publication-lock.mjs';
import { configuration, positive, currentRelease, releaseManifest, PublicationError, safeError } from './lib/publication-runtime.mjs';
const config = configuration();
const args = process.argv.slice(2);
let lock;
try {
  const apply = args.includes('--apply');
  if (apply && args.includes('--dry-run')) throw new PublicationError('CONFIRMATION_REQUIRED');
  if (apply && !args.includes('--confirm-prune')) throw new PublicationError('CONFIRMATION_REQUIRED');
  const keepArg = args.indexOf('--keep');
  const keep = keepArg < 0 ? 10 : positive(args[keepArg + 1], 10);
  lock = await acquireLock(config, 'prune');
  const current = await currentRelease(config);
  if (!current) throw new PublicationError('INVALID_RELEASE');
  await releaseManifest(config, current.id);
  const complete = [], retainedUnknown = [];
  for (const name of await readdir(config.releases)) {
    try { complete.push(await releaseManifest(config, name)); } catch { retainedUnknown.push(name); }
  }
  complete.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const preserved = new Set([current.id, ...complete.filter(m => m.id !== current.id).slice(0, keep).map(m => m.id)]);
  const remove = complete.filter(m => !preserved.has(m.id)).map(m => m.id);
  // Each retained release owns its files. Buffer cleanup also preserves names
  // used by any retained content snapshot and the most recent export bundle.
  let references = '';
  for (const id of preserved) {
    const content = join(config.releases, id, 'content');
    for (const file of await readdir(content)) if (file.endsWith('.json')) references += await readFile(join(content, file), 'utf8');
  }
  references += await readFile(join(config.local, 'export-buffer/bundle.json'), 'utf8');
  const buffer = join(config.local, 'export-buffer/media');
  const media = (await readdir(buffer)).filter(name => /^[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(name) && !references.includes(`/media/${name}`));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', preserved: [...preserved], releasesToRemove: remove, bufferMediaToRemove: media, retainedUnknown }, null, 2));
  if (apply) {
    // Paths are validated direct children; the common mutex prevents publication
    // or rollback from changing the selected release during the operation.
    for (const id of remove) { await releaseManifest(config, id); await rm(join(config.releases, id), { recursive: true }); }
    for (const name of media) await unlink(join(buffer, name));
  }
} catch (error) { console.error(JSON.stringify(safeError(error))); process.exitCode = 1; }
finally { if (lock) await lock.release(); }
