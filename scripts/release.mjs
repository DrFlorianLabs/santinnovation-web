import { mkdir, readFile, writeFile, readdir, cp, symlink, rename, open } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { projectContent } from './project-content.mjs';
const root = resolve(import.meta.dirname, '..');
const local = join(root, '.local');
await mkdir(local, { recursive: true });
let lock;
try { lock = await open(join(local, 'publication.lock'), 'wx'); }
catch { throw new Error('Publication déjà en cours ou verrou à contrôler : .local/publication.lock'); }
// Lock is a transient coordination file, removed by its owner after completion.
const run = (cmd, args, cwd, env = {}) => new Promise((done, reject) => {
  const child = spawn(cmd, args, { cwd, env: {...process.env, ...env}, stdio: 'inherit' });
  child.on('error', reject); child.on('exit', code => code === 0 ? done() : reject(new Error(`${cmd} a échoué (${code})`)));
});
const statusDir = process.env.CMS_DATA_DIR ? resolve(process.env.CMS_DATA_DIR) : join(root, 'cms/.local');
await mkdir(statusDir,{recursive:true});
const statusFile = join(statusDir, 'publication-status.json');
try {
  const buffer = join(local, 'export-buffer');
  await mkdir(buffer, { recursive: true });
  const media = join(buffer, 'media');
  await run('npm', ['run','export','--',join(buffer,'bundle.json'),media], join(root,'cms'));
  const projected = projectContent(JSON.parse(await readFile(join(buffer,'bundle.json'),'utf8')));
  const digest = createHash('sha256').update(JSON.stringify(projected)).digest('hex');
  let previous;
  try { previous = JSON.parse(await readFile(statusFile,'utf8')); } catch {}
  if (process.argv.includes('--if-changed') && previous?.digest === digest && previous?.state === 'ready') {
    await writeFile(statusFile, JSON.stringify({...previous, checkedAt: new Date().toISOString()}));
    console.log('Aucun changement de contenu publié.');
  } else {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stage = join(root, '.releases', stamp);
    await mkdir(stage, {recursive:true});
    const content = join(stage,'content'); await mkdir(content);
    for (const [name, entries] of Object.entries(projected)) await writeFile(join(content, `${name}.json`),JSON.stringify(entries,null,2));
    const out = join(stage,'site');
    await run('npm', ['run','build'], root, { CMS_CONTENT_DIR: content, BUILD_OUT_DIR: out, CONTENT_BUILD_TIME: new Date().toISOString() });
    // Copy only generated, hashed media referenced in the sanitized projection.
    const projectionText = JSON.stringify(projected);
    await mkdir(join(out,'media'), {recursive:true});
    for (const filename of await readdir(media)) {
      if (!/^[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(filename)) throw new Error('Nom de média exporté invalide');
      if (projectionText.includes(`/media/${filename}`)) await cp(join(media,filename),join(out,'media',filename));
    }
    const candidate = join(local,`site-${stamp}`);
    await symlink(out,candidate,'dir');
    await rename(candidate,join(local,'site-current'));
    await writeFile(statusFile, JSON.stringify({state:'ready', digest, builtAt:new Date().toISOString(), directory:out},null,2));
    console.log('Version locale prête. Aucun transfert réseau ni déploiement effectué.');
  }
} catch(error) {
  await writeFile(statusFile, JSON.stringify({state:'error', checkedAt:new Date().toISOString(), message:'Construction refusée. Consulter le journal technique ; version précédente conservée.'}));
  throw error;
} finally {
  await lock.close();
  const { unlink } = await import('node:fs/promises'); await unlink(join(local,'publication.lock'));
}
