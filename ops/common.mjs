import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export class OpsError extends Error {
  constructor(code, message) { super(message); this.name = 'OpsError'; this.code = code; }
}
export function requireKey(value = process.env.BACKUP_KEY_HEX) {
  if (!/^[a-f0-9]{64}$/i.test(value ?? '')) throw new OpsError('BACKUP_KEY_REQUIRED', 'BACKUP_KEY_HEX doit contenir une clé de 32 octets au format hexadécimal, conservée séparément des archives.');
  return Buffer.from(value, 'hex');
}
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export async function hashFile(filename) {
  const file = await fs.open(filename, 'r');
  try {
    const hash = createHash('sha256');
    for await (const chunk of file.createReadStream({ autoClose: false })) hash.update(chunk);
    return hash.digest('hex');
  } finally { await file.close(); }
}
export async function assertAbsent(filename) {
  try { await fs.lstat(filename); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new OpsError('TARGET_EXISTS', 'La destination existe déjà : choisir un répertoire ou fichier neuf. Aucun écrasement autorisé.');
}
export function readArgs(argv = process.argv.slice(2)) {
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--') || args.has(arg.slice(2))) throw new OpsError('ARGUMENT_INVALID', 'Arguments invalides ou répétés.');
    args.set(arg.slice(2), argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
  }
  return args;
}
export function onlyArgs(args, allowed) {
  for (const key of args.keys()) if (!allowed.includes(key)) throw new OpsError("ARGUMENT_INVALID", "Option inconnue. Consulter ops/README.md.");
}
export function option(args, name, fallback) {
  const value = args.get(name) ?? fallback;
  if (typeof value !== 'string' || !value) throw new OpsError('OPTION_REQUIRED', `Option --${name} requise ou variable correspondante absente.`);
  return value;
}
export function positiveInt(value, fallback) {
  if (value !== undefined && !['string', 'number'].includes(typeof value)) throw new OpsError('NUMBER_INVALID', 'Valeur numérique manquante.');
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new OpsError('NUMBER_INVALID', 'Un entier strictement positif est requis.');
  return n;
}
export function isMain(meta) { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(meta.url); }
export function reportFailure(error) {
  // Never echo child stderr, SQL rows, secrets or raw unexpected error objects.
  const safe = error instanceof OpsError ? error : new OpsError('OPERATION_FAILED', 'Opération refusée. Vérifier les chemins, droits et versions des outils. Aucune donnée existante n’a été écrasée.');
  console.error(`${safe.code}: ${safe.message}`); process.exitCode = 1;
}
export function runPrivate(command, args, { cwd = REPO_ROOT, env = {}, timeoutMs = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'ignore'] });
    let timedOut = false;
    let force;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); force = setTimeout(() => child.kill('SIGKILL'), 1000); }, timeoutMs);
    child.on('error', () => { clearTimeout(timer); clearTimeout(force); reject(new OpsError('CHILD_START_FAILED', 'Impossible de démarrer le processus local de vérification.')); });
    child.on('exit', code => {
      clearTimeout(timer); clearTimeout(force);
      if (timedOut) reject(new OpsError('TIMEOUT', 'Délai maximal dépassé pour la copie ou la vérification locale.'));
      else if (code !== 0) reject(new OpsError('PROJECTION_FAILED', 'La vérification de la projection a été refusée. Les sorties du processus ne sont pas journalisées.'));
      else resolve();
    });
  });
}
