import { mkdir, readFile, writeFile, rename, unlink, readlink, realpath, stat, readdir } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';

export const sourceRoot = resolve(import.meta.dirname, '../..');
export function configuration(env = process.env) {
  const root = realpathSync(resolve(env.PUBLICATION_ROOT || sourceRoot));
  if (env.CMS_DATA_DIR && !isAbsolute(env.CMS_DATA_DIR)) throw new Error('CMS_DATA_DIR doit être absolu.');
  const local = join(root, '.local');
  return { root, local, releases: join(root, '.releases'), data: env.CMS_DATA_DIR || join(root, 'cms/.local'),
    timeout: positive(env.PUBLICATION_TIMEOUT_MS, 600_000), interval: positive(env.PUBLICATION_INTERVAL_MS, 60_000) };
}
export function positive(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('Délai ou nombre invalide.');
  return n;
}
export async function json(path, fallback = null) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
export async function atomicJSON(path, value) {
  const tmp = `${path}.${process.pid}-${randomUUID()}.tmp`;
  try { await writeFile(tmp, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' }); await rename(tmp, path); }
  finally { await unlink(tmp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
export async function status(config, values) {
  await mkdir(config.data, { recursive: true, mode: 0o700 });
  const file = join(config.data, 'publication-status.json');
  const previous = await json(file, {}).catch(() => ({}));
  const next = { ...previous, ...values, checkedAt: new Date().toISOString() };
  if (!['error', 'locked'].includes(next.state)) delete next.error;
  await atomicJSON(file, next);
  return next;
}
export class PublicationError extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}
const messages = {
  TIMEOUT: 'Le délai maximal de génération est dépassé.',
  INTERRUPTED: 'La génération a été interrompue.',
  LOCKED: 'Une opération de publication est déjà en cours.',
  LOCK_CHILD_ACTIVE: 'Un processus de génération est encore actif. Reprise différée.',
  LOCK_UNVERIFIABLE: 'Le propriétaire du verrou ne peut pas être vérifié. Intervention technique requise.',
  LOCATION_REFERENCED: 'Un établissement est encore référencé par un professionnel publié.',
  LOCATION_UNAVAILABLE: 'Un professionnel publié référence un établissement non publiable.',
  PUBLICATION_INTERVAL_INVALID: 'Les dates d’affichage du professionnel et de son établissement sont incompatibles.',
  LEGAL_VALIDATION_REQUIRED: 'Une rubrique réglementaire publiée et validée est requise.',
  GENERAL_INFORMATION_REQUIRED: 'Les informations générales publiées sont requises.',
  PROCESS_STILL_RUNNING: 'Un processus ne s’est pas arrêté ; la reprise reste verrouillée.',
  INVALID_RELEASE: 'Cette version est absente, incomplète ou son intégrité ne peut pas être confirmée.',
  CONFIRMATION_REQUIRED: 'La purge exige --apply et --confirm-prune après examen du mode à blanc.',
  EXPORT_FAILED: 'L’export a échoué. Consulter le journal technique.',
  BUILD_FAILED: 'La construction a échoué. Consulter le journal technique.',
};
export function safeError(error) {
  const candidate = error?.details || error;
  const code = /^[A-Z][A-Z0-9_]{1,63}$/.test(error?.code || '') ? error.code : 'PUBLICATION_FAILED';
  return { code, message: messages[code] || 'La publication a échoué. Intervention technique requise.',
    ...(['professionnels','lieux','actualites','pages','informations','medias','activites','innovations','partenaires'].includes(candidate?.collection) ? { collection: candidate.collection } : {}),
    ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate?.slug || '') && candidate.slug.length <= 120 ? { slug: candidate.slug } : {}) };
}
export async function currentRelease(config) {
  try {
    const target = await readlink(join(config.local, 'site-current'));
    const site = resolve(config.local, target);
    if (!site.startsWith(config.releases + sep) || relative(config.releases, site).split(sep).length !== 2 || !site.endsWith(`${sep}site`)) throw new PublicationError('INVALID_RELEASE');
    return { id: relative(config.releases, site).split(sep)[0], site };
  } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function releaseManifest(config, id) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(id) || id === '..') throw new PublicationError('INVALID_RELEASE');
  const dir = join(config.releases, id);
  try {
    // A manifest is a completion marker, written only after all outputs exist.
    const [actual, m] = await Promise.all([realpath(dir), json(join(dir, 'manifest.json'))]);
    if (actual !== dir || m?.version !== 1 || m.id !== id || m.complete !== true || m.siteRelativePath !== 'site' || !/^[a-f0-9]{64}$/.test(m.contentDigest)) throw new Error('Invalid manifest');
    if (!(await stat(join(dir, 'site/index.html'))).isFile() || !Array.isArray(m.files) || !m.files.length) throw new Error('Missing index');
    if (await realpath(join(dir, 'site')) !== join(dir, 'site')) throw new Error('Invalid site');
    if (JSON.stringify(await fileHashes(join(dir, 'site'))) !== JSON.stringify(m.files)) throw new Error('Integrity mismatch');
    return m;
  } catch { throw new PublicationError('INVALID_RELEASE'); }
}
export async function fileHashes(root, prefix = '') {
  const files = [];
  for (const item of (await readdir(join(root, prefix), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) files.push(...await fileHashes(root, name));
    else if (item.isFile()) files.push({ path: name, sha256: createHash('sha256').update(await readFile(join(root, name))).digest('hex') });
    else throw new PublicationError('INVALID_RELEASE');
  }
  return files;
}
