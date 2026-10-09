import { spawn } from 'node:child_process';
const root = new URL('..', import.meta.url);
let running = false;
async function tick() {
  if (running) return;
  running = true;
  const child = spawn(process.execPath, ['scripts/release.mjs','--if-changed'], { cwd:root, stdio:'inherit' });
  await new Promise(resolve => {child.on('error', resolve); child.on('exit', resolve);});
  running = false;
}
await tick();
setInterval(tick, 60_000);
