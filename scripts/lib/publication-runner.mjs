import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { groupAlive } from './publication-lock.mjs';
import { PublicationError } from './publication-runtime.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function terminateGroup(pid) {
  if (!groupAlive(pid)) return;
  try { process.kill(-pid, 'SIGTERM'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
  const end = Date.now() + 1800;
  while (groupAlive(pid) && Date.now() < end) await sleep(40);
  if (groupAlive(pid)) { try { process.kill(-pid, 'SIGKILL'); } catch (e) { if (e.code !== 'ESRCH') throw e; } }
  const killed = Date.now() + 3000;
  while (groupAlive(pid) && Date.now() < killed) await sleep(40);
  if (groupAlive(pid)) throw new PublicationError('PROCESS_STILL_RUNNING');
}

export async function runManaged(lock, command, args, { cwd, env = process.env, timeout, signal, failureCode = 'BUILD_FAILED' }) {
  if (signal?.aborted) throw new PublicationError('INTERRUPTED');
  const child = spawn(process.execPath, [fileURLToPath(new URL('./publication-child.mjs', import.meta.url))], { cwd, env, detached: true, stdio: ['ignore','pipe','pipe','ipc'] });
  let timedOut = false, interrupted = false, reportedError, stderrLine = '', timer;
  const closed = new Promise(resolve => { child.once('close', code => resolve(code)); child.once('error', () => resolve(1)); });
  child.stdout.on('data', b => process.stdout.write(b));
  child.stderr.on('data', b => {
    process.stderr.write(b);
    stderrLine = (stderrLine + String(b)).slice(-16_384);
    const lines = stderrLine.split('\n'); stderrLine = lines.pop() || '';
    for (const line of lines) if (line.startsWith('PUBLICATION_ERROR_JSON=')) {
      try { const detail = JSON.parse(line.slice(23)); reportedError = new PublicationError(detail.code, '', detail); } catch {}
    }
  });
  const stop = () => { if (child.connected) child.send({ type: 'stop' }, () => {}); };
  const aborted = () => { interrupted = true; stop(); };
  try {
    const waiting = await new Promise(resolve => {
      const t = setTimeout(() => resolve(false), Math.min(timeout, 10_000));
      child.once('message', () => { clearTimeout(t); resolve(true); });
      child.once('error', () => { clearTimeout(t); resolve(false); });
      child.once('exit', () => { clearTimeout(t); resolve(false); });
    });
    if (!waiting || !child.pid) throw new PublicationError(failureCode);
    await lock.child(child.pid, true);
    signal?.addEventListener('abort', aborted, { once: true });
    if (signal?.aborted) { interrupted = true; stop(); }
    else child.send({ type: 'start', command, args, cwd, env }, () => {});
    timer = setTimeout(() => { timedOut = true; stop(); }, timeout);
    // The wrapper is bounded too, even if an unexpected runtime failure prevents
    // it from handling IPC. Kill and await the complete group before unlocking.
    const emergency = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, timeout + 4000);
    const code = await closed;
    clearTimeout(emergency);
    await terminateGroup(child.pid);
    if (timedOut) throw new PublicationError('TIMEOUT');
    if (interrupted) throw new PublicationError('INTERRUPTED');
    if (code !== 0) throw reportedError || new PublicationError(failureCode);
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', aborted);
    if (child.pid) { await terminateGroup(child.pid); await closed; await lock.child(child.pid, false); }
  }
}
