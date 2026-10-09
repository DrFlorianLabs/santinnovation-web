import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, readlink, rename, access } from 'node:fs/promises';
import { tmpdir, hostname } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { groupAlive } from '../scripts/lib/publication-lock.mjs';
import { publicationView } from '../scripts/lib/publication-status.mjs';
const repo = resolve(import.meta.dirname, '..');
const fixture = join(import.meta.dirname, 'publication-robustness-fixture.mjs');
const pause = ms => new Promise(r => setTimeout(r, ms));
async function until(predicate, timeout = 10_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await predicate()) return; await pause(50); }
  throw new Error('Timed out waiting for fixture');
}
const exists = p => access(p).then(() => true, () => false);
const parse = p => readFile(p, 'utf8').then(JSON.parse);
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'publication-robustness-'));
  await mkdir(join(root, 'cms'), { recursive: true });
  await mkdir(join(root, '.local'), { recursive: true });
  // Shell quoting is not used for untrusted content: fixture is a fixed source
  // path, represented as a package-script argument with escaped quote/backslash.
  const quoted = '"' + fixture.replaceAll('\\','\\\\').replaceAll('"','\\"') + '"';
  await writeFile(join(root, 'package.json'), JSON.stringify({ scripts: { build: `node ${quoted} build` } }));
  await writeFile(join(root, 'cms/package.json'), JSON.stringify({ scripts: { export: `node ${quoted} export` } }));
  const env = { ...process.env, NODE_ENV: 'test', PUBLICATION_ROOT: root, CMS_DATA_DIR: join(root, 'private-data'), PUBLICATION_TIMEOUT_MS: '5000', PATH: `${dirname(process.execPath)}:${process.env.PATH || ''}` };
  const f = { root, env, options: async o => writeFile(join(root, 'fixture.json'), JSON.stringify({ generation: 1, ...o })), status: () => parse(join(root, 'private-data/publication-status.json')) };
  await f.options({}); return f;
}
function launch(f, script = 'release.mjs', args = [], extra = {}) {
  const child = spawn(process.execPath, [join(repo, 'scripts', script), ...args], { env: { ...f.env, ...extra }, stdio: ['ignore','pipe','pipe'] });
  let output = ''; child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b);
  const done = new Promise(resolve => { child.on('error', e => resolve({ code: 1, output: e.message })); child.on('close', (code, signal) => resolve({ code, signal, output })); });
  return { child, done };
}
async function run(f, script, args, env) { return launch(f, script, args, env).done; }
async function success(f, script = 'release.mjs', args = [], env) { const r = await run(f, script, args, env); assert.equal(r.code, 0, r.output); return r; }

test('release complète, aucun build à vide, rollback épinglé, lien relatif transportable et purge confirmée', { timeout: 45_000 }, async () => {
  const f = await setup(); await success(f);
  const first = (await f.status()).releaseId;
  assert.match(await readlink(join(f.root, '.local/site-current')), /^\.\.\/\.releases\//);
  await success(f, 'release.mjs', ['--if-changed']); assert.equal((await f.status()).state, 'unchanged');
  assert.equal((await readdir(join(f.root, '.releases'))).length, 1);
  await f.options({ generation: 2 }); await success(f); const second = (await f.status()).releaseId;
  await success(f, 'rollback.mjs', [first]); assert.equal((await f.status()).state, 'rolledBack');
  await success(f, 'release.mjs', ['--if-changed']); assert.equal((await f.status()).releaseId, first);
  assert.match(await readFile(join(f.root, '.local/site-current/index.html'), 'utf8'), /Fictif 1/);
  const moved = f.root + '-moved'; await rename(f.root, moved); f.root = moved;
  f.env.PUBLICATION_ROOT = moved; f.env.CMS_DATA_DIR = join(moved, 'private-data');
  f.status = () => parse(join(moved, 'private-data/publication-status.json'));
  assert.match(await readFile(join(moved, '.local/site-current/index.html'), 'utf8'), /Fictif 1/);
  await writeFile(join(moved, 'fixture.json'), JSON.stringify({ generation: 3 })); await success(f, 'release.mjs', ['--if-changed']);
  assert.equal((await f.status()).state, 'ready'); assert.match(await readFile(join(moved, '.local/site-current/index.html'), 'utf8'), /Fictif 3/);
  // Closure still points to the old root after movement; read status explicitly.
  const current = (await parse(join(moved, 'private-data/publication-status.json'))).releaseId;
  const count = (await readdir(join(moved, '.releases'))).length;
  const orphan = `${'f'.repeat(64)}.png`; await writeFile(join(moved, '.local/export-buffer/media', orphan), 'fictif');
  const dry = await success(f, 'releases-prune.mjs', ['--keep','1']); assert.match(dry.output, /dry-run/);
  assert.equal((await readdir(join(moved, '.releases'))).length, count);
  assert.equal((await run(f, 'releases-prune.mjs', ['--keep','1','--apply'])).code, 1);
  assert.equal((await run(f, 'releases-prune.mjs', ['--keep','1','--apply','--confirm-prune','--dry-run'])).code, 1);
  await success(f, 'releases-prune.mjs', ['--keep','1','--apply','--confirm-prune']);
  const retained = await readdir(join(moved, '.releases')); assert.deepEqual(new Set(retained), new Set([current, second]));
  assert.equal(await exists(join(moved, '.local/export-buffer/media', orphan)), false);
});

test('rollback établit une référence CMS fraîche après échec du build et après modification non encore observée', { timeout: 30_000 }, async () => {
  const f = await setup(); await success(f); const first = (await f.status()).releaseId;
  await f.options({ generation: 2 }); await success(f);
  const previousDigest = (await f.status()).observedDigest;
  await f.options({ generation: 3, fail: 'build' }); assert.equal((await run(f)).code, 1);
  assert.notEqual((await f.status()).observedDigest, previousDigest, 'Un export réussi reste observé même si son build échoue');
  await success(f, 'rollback.mjs', [first]);
  await f.options({ generation: 3 }); await success(f, 'release.mjs', ['--if-changed']);
  assert.equal((await f.status()).releaseId, first, 'Le retour arrière doit survivre à la réparation du build sans changement éditorial');
  const oldBaseline = (await parse(join(f.root, '.local/publication-pin.json'))).baselineDigest;
  // No release/worker has seen generation 4: the rollback must export it now.
  await f.options({ generation: 4 }); await success(f, 'rollback.mjs', [first]);
  assert.notEqual((await parse(join(f.root, '.local/publication-pin.json'))).baselineDigest, oldBaseline);
  await success(f, 'release.mjs', ['--if-changed']); assert.equal((await f.status()).releaseId, first);
  await f.options({ generation: 5 }); await success(f, 'release.mjs', ['--if-changed']);
  assert.equal((await f.status()).state, 'ready');
  assert.match(await readFile(join(f.root, '.local/site-current/index.html'), 'utf8'), /Fictif 5/);
  assert.equal(await exists(join(f.root, '.local/publication-pin.json')), false);
});

test('rollback sans export fiable reste manuel jusqu’à --force réussi, sans fuite de la cause brute', { timeout: 30_000 }, async () => {
  const f = await setup(); await success(f); const first = (await f.status()).releaseId;
  await f.options({ generation: 2 }); await success(f);
  await f.options({ generation: 3, fail: 'export' }); await success(f, 'rollback.mjs', [first]);
  const pinFile = join(f.root, '.local/publication-pin.json');
  assert.equal((await parse(pinFile)).baselineDigest, null);
  assert.equal((await f.status()).rollbackMode, 'until-forced');
  assert.match(publicationView(await f.status()).label, /Reprise manuelle/);
  assert.doesNotMatch(JSON.stringify(await f.status()), /SECRET_SHOULD_NOT_BE_DISPLAYED/);
  // Export still fails: success proves this cycle respected the manual pin first.
  await success(f, 'release.mjs', ['--if-changed']); assert.equal((await f.status()).releaseId, first);
  await f.options({ generation: 4 }); await success(f, 'release.mjs', ['--if-changed']);
  assert.equal((await f.status()).releaseId, first, 'Même un nouveau contenu ne doit pas annuler le pin manuel');
  await f.options({ generation: 4, fail: 'build' }); assert.equal((await run(f, 'release.mjs', ['--force'])).code, 1);
  assert.equal((await parse(pinFile)).mode, 'until-forced');
  await success(f, 'release.mjs', ['--if-changed']); assert.equal((await f.status()).state, 'rolledBack');
  await f.options({ generation: 4 }); await success(f, 'release.mjs', ['--force']);
  assert.equal((await f.status()).state, 'ready'); assert.equal(await exists(pinFile), false);
  assert.match(await readFile(join(f.root, '.local/site-current/index.html'), 'utf8'), /Fictif 4/);
});

test('verrou vivant même ancien respecté ; SIGKILL puis deux reprises concurrentes sans vol de verrou', { timeout: 30_000 }, async () => {
  const f = await setup();
  const holder = spawn(process.execPath, [fixture, 'hold-lock'], { env: f.env, stdio: 'ignore' });
  const holderExit = new Promise(r => holder.once('exit', r));
  await until(() => exists(join(f.root, '.local/test-owner-ready')));
  const file = join(f.root, '.local/publication.lock'); const old = await parse(file);
  await writeFile(file, JSON.stringify({ ...old, startedAt: '2000-01-01T00:00:00.000Z' }));
  const locked = await run(f); assert.equal(locked.code, 1); assert.equal((await f.status()).state, 'locked');
  assert.equal((await parse(file)).token, old.token);
  holder.kill('SIGKILL'); await holderExit;
  await f.options({ delay: 1000 });
  const attempts = await Promise.all([run(f), run(f)]);
  assert.deepEqual(attempts.map(r => r.code).sort(), [0,1]);
  assert.equal(attempts.filter(r => /publication_lock_recovered/.test(r.output)).length, 1);
  assert.equal((await readdir(join(f.root, '.releases'))).length, 1);
});

for (const stage of ['export','build']) test(`SIGKILL pendant ${stage} : descendants arrêtés et reprise sans concurrence`, { timeout: 30_000 }, async () => {
  const f = await setup(); await success(f); const original = await readlink(join(f.root, '.local/site-current'));
  await f.options({ generation: 2, hang: stage });
  const active = launch(f); await until(() => exists(join(f.root, '.local/test-started.json')));
  const metadata = await parse(join(f.root, '.local/publication.lock')); assert.ok(metadata.children.length);
  active.child.kill('SIGKILL'); await active.done;
  await until(() => !metadata.children.some(groupAlive));
  assert.equal(await readlink(join(f.root, '.local/site-current')), original);
  await f.options({ generation: 2 }); const recovered = await success(f);
  assert.match(recovered.output, /publication_lock_recovered/); assert.equal((await f.status()).state, 'ready');
});

test('propriétaire absent mais groupe enfant vivant : aucune reprise même après quinze minutes', { timeout: 20_000 }, async () => {
  const f = await setup();
  const owner = spawn(process.execPath, ['-e',''], { stdio: 'ignore' }); const dead = owner.pid;
  await new Promise(r => owner.once('exit', r));
  const child = spawn(process.execPath, [fixture,'hold-group'], { detached: true, stdio: 'ignore' });
  const exited = new Promise(r => child.once('exit', r));
  await until(() => groupAlive(child.pid));
  await writeFile(join(f.root,'.local/publication.lock'),JSON.stringify({version:1,pid:dead,hostname:hostname(),startedAt:'2000-01-01',children:[child.pid],token:'synthetic'}));
  try { assert.equal((await run(f)).code,1); assert.equal((await f.status()).error.code,'LOCK_CHILD_ACTIVE'); }
  finally { process.kill(-child.pid,'SIGKILL'); await exited; }
  await success(f);
});

test('timeout arrête le groupe, conserve le site, affiche une cause structurée sans fuite', { timeout: 25_000 }, async () => {
  const f = await setup(); await success(f); const original = await readlink(join(f.root,'.local/site-current'));
  await f.options({ generation:2, hang:'build' });
  const result = await run(f,'release.mjs',[],{PUBLICATION_TIMEOUT_MS:'900'});
  assert.equal(result.code,1); assert.equal((await f.status()).error.code,'TIMEOUT');
  assert.equal(await readlink(join(f.root,'.local/site-current')),original);
  assert.equal(await exists(join(f.root,'.local/publication.lock')),false);
  await f.options({ fail:'export' }); assert.equal((await run(f)).code,1);
  const s = await f.status(); assert.equal(s.error.code,'LOCATION_UNAVAILABLE'); assert.equal(s.error.slug,'camille-fictif');
  assert.doesNotMatch(JSON.stringify(s),/SECRET_SHOULD_NOT_BE_DISPLAYED/);
  assert.match(publicationView(s).reference,/professionnels \/ camille-fictif/);
  await f.options({ generation:2 }); await success(f);
});

test('tableau de bord : fraîcheur cinq minutes, verrou et rollback distincts du succès', () => {
  const now = Date.now();
  const old = {state:'ready',checkedAt:new Date(now-360_000).toISOString()};
  assert.equal(publicationView(old,now).stale,true);assert.match(publicationView(old,now).label,/inactif/);
  for (const state of ['locked','building','error','rolledBack']) assert.doesNotMatch(publicationView({state,checkedAt:new Date(now).toISOString()},now).label,/site prête/);
  assert.equal(publicationView({state:'error',checkedAt:new Date(now).toISOString(),error:{message:'SECRET',collection:'users',slug:'secret@example.invalid'}},now).reference,null);
});

test('worker borné : cycle sans changement, reprise après erreur, arrêt sans processus enfant laissé actif', { timeout: 20_000 }, async () => {
  const f = await setup(); await success(f);
  const worker = launch(f,'watch-publication.mjs',[],{PUBLICATION_INTERVAL_MS:'350'});
  try {
    await until(async()=> (await f.status()).state === 'unchanged');
    await f.options({generation:2,fail:'export'});
    await until(async()=> (await f.status()).state === 'error');
    assert.equal((await f.status()).error.code,'LOCATION_UNAVAILABLE');
    await f.options({generation:2});
    await until(async()=> (await readFile(join(f.root,'.local/site-current/index.html'),'utf8')).includes('Fictif 2'));
  } finally { worker.child.kill('SIGTERM'); await worker.done; }
  assert.equal(await exists(join(f.root,'.local/publication.lock')),false);
  assert.equal((await readdir(join(f.root,'.releases'))).length,2);
});
