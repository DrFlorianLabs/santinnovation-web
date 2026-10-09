// A process-group leader waits for its parent to durably register its PID before
// starting work. A parent killed before registration cannot leave an active job.
import { spawn } from 'node:child_process';
let child, stopping = false, started = false, killTimer;
const startup = setTimeout(() => stop(), 10_000);
function stop() {
  if (stopping) return;
  stopping = true; clearTimeout(startup);
  if (!child) process.exit(130);
  try { process.kill(-process.pid, 'SIGTERM'); } catch {}
  killTimer = setTimeout(() => { try { process.kill(-process.pid, 'SIGKILL'); } catch {} }, 1500);
}
process.on('SIGTERM', stop); process.on('SIGINT', stop); process.on('disconnect', stop);
process.on('message', message => {
  if (message?.type === 'stop') return stop();
  if (message?.type !== 'start' || started || stopping) return;
  started = true; clearTimeout(startup);
  child = spawn(message.command, message.args, { cwd: message.cwd, env: message.env, stdio: ['ignore','inherit','inherit'] });
  child.on('error', () => process.exit(1));
  child.on('exit', (code, signal) => {
    // The command may exit before its grandchildren. On cancellation keep the
    // group leader alive until its group-wide SIGKILL timer fires.
    if (stopping) return;
    clearTimeout(killTimer);
    // Notify the parent, which also verifies that no grandchild group survives.
    if (process.connected) process.send({ type: 'result', code, signal });
    process.exit(code ?? 1);
  });
});
if (!process.send) process.exit(2);
process.send({ type: 'waiting' });
