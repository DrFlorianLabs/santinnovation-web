import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { assertAbsent, hashFile, OpsError, canonicalJSON } from './common.mjs';

export const MAGIC = Buffer.from('SANT-MSP-BACKUP\n1\n');
const MAX_MANIFEST = 8 * 1024 * 1024;
export function validateManifest(manifest) {
  if (manifest?.format !== 'santinnovation-backup-v1' || !Array.isArray(manifest.files) || manifest.files.length > 100000 || !Number.isFinite(Date.parse(manifest.snapshotAt))) throw new OpsError('ARCHIVE_INVALID', 'Format de manifeste non reconnu.');
  const seen = new Set();
  for (const file of manifest.files) {
    const valid = /^(cms\.sqlite|secret|proof\/projection\.json|site-release\.json|media\/[^/\\]+|site\/.+)$/.test(file.path ?? '') && !file.path.includes('\0') && !file.path.includes('\\') && !file.path.includes('//') && !file.path.endsWith('/');
    if (!valid || file.path.length > 512 || file.path.split('/').some(s => s === '.' || s === '..') || seen.has(file.path) || !Number.isSafeInteger(file.size) || file.size < 0 || !/^[a-f0-9]{64}$/.test(file.sha256 ?? '')) throw new OpsError('ARCHIVE_INVALID', 'Chemin, longueur ou empreinte de fichier invalide dans l’archive.');
    seen.add(file.path);
  }
  if (!seen.has('cms.sqlite') || !seen.has('secret') || !seen.has('proof/projection.json')) throw new OpsError('ARCHIVE_INVALID', 'Archive incomplète.');
  if (manifest.site?.included && !seen.has('site/index.html')) throw new OpsError('ARCHIVE_INVALID', 'La copie du site est incomplète.');
  return manifest;
}
export async function encryptArchive(staging, manifest, destination, key) {
  validateManifest(manifest); await assertAbsent(destination);
  const nonce = randomBytes(12);
  const header = Buffer.concat([MAGIC, nonce]);
  const cipher = createCipheriv('aes-256-gcm', key, nonce); cipher.setAAD(header);
  const json = Buffer.from(canonicalJSON(manifest));
  if (json.length > MAX_MANIFEST) throw new OpsError('ARCHIVE_INVALID', 'Manifeste trop volumineux.');
  const length = Buffer.alloc(8); length.writeBigUInt64BE(BigInt(json.length));
  async function* content() {
    yield length; yield json;
    for (const file of manifest.files) yield* createReadStream(path.join(staging, file.path));
  }
  const out = await fs.open(destination, 'wx', 0o600);
  try { await out.write(header); } finally { await out.close(); }
  try {
    await pipeline(Readable.from(content()), cipher, createWriteStream(destination, { flags: 'a', mode: 0o600 }));
    await fs.appendFile(destination, cipher.getAuthTag());
    const completed = await fs.open(destination, 'r+');
    try { await completed.sync(); } finally { await completed.close(); }
  } catch (error) { await fs.rm(destination, { force: true }); throw error; }
}
export async function decryptArchive(archive, plain, key) {
  const file = await fs.open(archive, 'r');
  try {
    const size = (await file.stat()).size;
    const header = Buffer.alloc(MAGIC.length + 12); await file.read(header, 0, header.length, 0);
    if (size < header.length + 16 + 8 || !header.subarray(0, MAGIC.length).equals(MAGIC)) throw new OpsError('ARCHIVE_INVALID', 'Archive inconnue ou tronquée.');
    const tag = Buffer.alloc(16); await file.read(tag, 0, 16, size - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length)); decipher.setAAD(header); decipher.setAuthTag(tag);
    try {
      await pipeline(createReadStream(archive, { start: header.length, end: size - 17 }), decipher, createWriteStream(plain, { flags: 'wx', mode: 0o600 }));
    } catch { await fs.rm(plain, { force: true }); throw new OpsError('ARCHIVE_AUTH_FAILED', 'Archive altérée ou clé incorrecte : restauration refusée.'); }
  } finally { await file.close(); }
}
async function exactRead(file, length, position) {
  const buffer = Buffer.alloc(length); let done = 0;
  while (done < length) { const { bytesRead } = await file.read(buffer, done, length - done, position + done); if (!bytesRead) throw new OpsError('ARCHIVE_INVALID', 'Archive tronquée.'); done += bytesRead; }
  return buffer;
}
export async function extractPlain(plain, target) {
  const input = await fs.open(plain, 'r');
  try {
    const size = (await input.stat()).size;
    const length = Number((await exactRead(input, 8, 0)).readBigUInt64BE());
    if (!Number.isSafeInteger(length) || length < 2 || length > MAX_MANIFEST) throw new OpsError('ARCHIVE_INVALID', 'Longueur du manifeste invalide.');
    let manifest;
    try { manifest = validateManifest(JSON.parse((await exactRead(input, length, 8)).toString('utf8'))); }
    catch (e) { throw e instanceof OpsError ? e : new OpsError('ARCHIVE_INVALID', 'Manifeste illisible.'); }
    if (8 + length + manifest.files.reduce((total, file) => total + file.size, 0) !== size) throw new OpsError('ARCHIVE_INVALID', 'La taille de l’archive ne correspond pas au manifeste.');
    let offset = 8 + length;
    for (const file of manifest.files) {
      const filename = path.join(target, file.path); await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
      if (file.size === 0) await fs.writeFile(filename, '', { flag: 'wx', mode: 0o600 });
      else await pipeline(createReadStream(plain, { start: offset, end: offset + file.size - 1 }), createWriteStream(filename, { flags: 'wx', mode: 0o600 }));
      offset += file.size;
      if (await hashFile(filename) !== file.sha256) throw new OpsError('FILE_HASH_MISMATCH', 'Une empreinte de fichier ne correspond pas au manifeste.');
    }
    return manifest;
  } finally { await input.close(); }
}
/** Read only after decryptArchive has authenticated the complete ciphertext. */
export async function inspectPlainManifest(plain) {
  const input = await fs.open(plain, 'r');
  try {
    const size = (await input.stat()).size;
    const length = Number((await exactRead(input, 8, 0)).readBigUInt64BE());
    if (!Number.isSafeInteger(length) || length < 2 || length > MAX_MANIFEST) throw new OpsError('ARCHIVE_INVALID', 'Longueur du manifeste invalide.');
    const manifest = validateManifest(JSON.parse((await exactRead(input, length, 8)).toString('utf8')));
    if (8 + length + manifest.files.reduce((n, f) => n + f.size, 0) !== size) throw new OpsError('ARCHIVE_INVALID', 'Taille d’archive incohérente.');
    return manifest;
  } finally { await input.close(); }
}
