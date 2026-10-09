import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { atomicJSON, PublicationError } from './publication-runtime.mjs';

export function pidAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 1) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
}
export function groupAlive(pgid) {
  if (!Number.isSafeInteger(pgid) || pgid <= 1) return false;
  // Zombies cannot execute or modify files. If ps is unavailable, fail closed.
  const ps = spawnSync('ps', ['-eo', 'pid=,pgid=,stat='], { encoding: 'utf8' });
  if (ps.status === 0) return ps.stdout.split('\n').some(line => {
    const [, group, state] = line.trim().split(/\s+/);
    return Number(group) === pgid && state && !state.startsWith('Z');
  });
  try { process.kill(-pgid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
}

/** The kernel SQLite write reservation serializes claim/reap/release. Unlike
 * unlinking a stale lock file, a dead-owner recovery cannot steal a new lock.
 * This mutex is for a local disk on one host, never a shared network filesystem.
 */
export async function acquireLock(config, purpose = 'publication') {
  await mkdir(config.local, { recursive: true, mode: 0o700 });
  let db;
  try {
    db = new DatabaseSync(join(config.local, 'publication-mutex.sqlite'));
    db.exec('PRAGMA busy_timeout=0; CREATE TABLE IF NOT EXISTS mutex (id INTEGER PRIMARY KEY); BEGIN IMMEDIATE;');
  } catch (e) {
    db?.close();
    if (/locked|busy/i.test(e.message)) throw new PublicationError('LOCKED');
    throw e;
  }
  const file = join(config.local, 'publication.lock');
  try {
    let previous;
    try { previous = JSON.parse(await readFile(file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw new PublicationError('LOCK_UNVERIFIABLE'); }
    if (previous) {
      if (previous.hostname !== hostname() || !Number.isSafeInteger(previous.pid) || !Array.isArray(previous.children)) throw new PublicationError('LOCK_UNVERIFIABLE');
      if (pidAlive(previous.pid)) throw new PublicationError('LOCKED');
      if (previous.children.some(groupAlive)) throw new PublicationError('LOCK_CHILD_ACTIVE');
      console.log(JSON.stringify({ event: 'publication_lock_recovered', at: new Date().toISOString(), ownerPid: previous.pid }));
    }
    const owner = { version: 1, token: randomUUID(), pid: process.pid, hostname: hostname(), startedAt: new Date().toISOString(), purpose, children: [] };
    await atomicJSON(file, owner);
    return {
      owner,
      async child(pid, add) {
        owner.children = add ? [...new Set([...owner.children, pid])] : owner.children.filter(x => x !== pid);
        await atomicJSON(file, owner);
      },
      async release() {
        try {
          // Keep the evidence and refuse future recovery while any child lives.
          if (owner.children.some(groupAlive)) throw new PublicationError('PROCESS_STILL_RUNNING');
          const saved = JSON.parse(await readFile(file, 'utf8'));
          if (saved.token !== owner.token) throw new PublicationError('LOCK_UNVERIFIABLE');
          await unlink(file);
        } finally { db.exec('ROLLBACK'); db.close(); }
      },
    };
  } catch (e) { db.exec('ROLLBACK'); db.close(); throw e; }
}
