import { spawn } from 'node:child_process';
import { configuration, sourceRoot, status, safeError, PublicationError, json } from './lib/publication-runtime.mjs';
import { join } from 'node:path';
const config = configuration();
let stopping = false, child, timer;
function stop() { stopping = true; clearTimeout(timer); child?.kill('SIGTERM'); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
async function tick() {
  if (stopping) return;
  const started = Date.now();
  child = spawn(process.execPath, [join(sourceRoot, 'scripts/release.mjs'), '--if-changed'], { cwd: config.root, env: process.env, stdio: 'inherit' });
  const current = child;
  // Each stage is bounded by release; this catches a stall outside those stages.
  let expired = false;
  const limit = setTimeout(() => { expired = true; current.kill('SIGTERM'); }, config.timeout * 2 + 15_000);
  const hard = setTimeout(() => current.kill('SIGKILL'), config.timeout * 2 + 20_000);
  const code = await new Promise(resolve => { current.once('error', () => resolve(1)); current.once('exit', resolve); });
  clearTimeout(limit); clearTimeout(hard); child = null;
  if (expired) await status(config, { state: 'error', error: safeError(new PublicationError('TIMEOUT')) });
  if (code !== 0) {
    // A startup failure (missing binary/import, syntax/runtime failure) happens
    // before release can write its own status. Do not leave a stale ready badge.
    const observed = await json(join(config.data, 'publication-status.json'), {}).catch(() => ({}));
    if (!observed.checkedAt || Date.parse(observed.checkedAt) < started) await status(config, { state: 'error', error: safeError(new PublicationError('WORKER_CHILD_FAILED')) });
    console.error(JSON.stringify({ event: 'publication_cycle_failed', at: new Date().toISOString(), exitCode: code }));
  }
  if (!stopping) timer = setTimeout(tick, Math.max(0, config.interval - (Date.now() - started)));
}
await tick();
