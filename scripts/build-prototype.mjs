// Public demo uses a NEW synthetic database, never the editor's actual data.
import { mkdtemp, mkdir, readFile, writeFile, readdir, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { projectContent } from './project-content.mjs';
import { inspectPublicOutput } from './scan-public.mjs';

const root = resolve(import.meta.dirname, '..');
await mkdir(join(root, '.local'), { recursive: true });
const work = await mkdtemp(join(root, '.local', 'prototype-'));
const output = resolve(process.env.PROTOTYPE_OUT_DIR || join(root, 'prototype-dist'));
// Refuse arbitrary output locations or an existing output: preserve all prior work.
try { await mkdir(output); } catch { throw new Error('Le dossier de sortie du prototype existe déjà. Choisir PROTOTYPE_OUT_DIR neuf.'); }
const content = join(work, 'content');
await mkdir(content);
const env = { ...process.env, NODE_ENV: 'development', PAYLOAD_SECRET: '', CMS_DATA_DIR: join(work, 'cms'), CMS_SERVER_URL: 'http://127.0.0.1:3001',
  SITE_URL: 'https://drflorianlabs.github.io', SITE_BASE: '/santinnovation-web/', PUBLIC_DEMO: '1' };
const run = (args, extra = {}) => new Promise((done, reject) => {
  const child = spawn('npm', args, { cwd: root, env: { ...env, ...extra }, stdio: 'inherit' });
  child.once('error', reject); child.once('exit', code => code === 0 ? done() : reject(new Error('Construction du prototype refusée.')));
});
await run(['--prefix', 'cms', 'run', 'init']);
await run(['--prefix', 'cms', 'run', 'seed:demo']);
await run(['--prefix', 'cms', 'run', 'export', '--', join(work, 'bundle.json'), join(work, 'media')]);
const bundle = JSON.parse(await readFile(join(work, 'bundle.json'), 'utf8'));
if (bundle.informations?.[0]?.nom !== 'MSP de démonstration — fictive') throw new Error('Source synthétique requise.');
const data = projectContent(bundle);
data.site.nom = 'Sant’Innovation — prototype fictif';
data.site.nomCourt = 'Sant’Innovation';
data.site.url = env.SITE_URL;
data.site.baseline = 'Soins coordonnés · Recherche · Innovation';
data.site.description = 'Prototype pour présentation à l’équipe Sant’Innovation. Contenus fictifs, aucun service de soins.';
for (const location of data.lieux) location.adresseVerifiee = false;
for (const [name, entries] of Object.entries(data)) await writeFile(join(content, name + '.json'), JSON.stringify(entries));
await run(['run', 'build'], { CMS_CONTENT_DIR: content, BUILD_OUT_DIR: output, NODE_ENV: 'production' });
await cp(join(work, 'media'), join(output, 'media'), { recursive: true });
async function disableDemoActions(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const filename = join(dir, item.name);
    if (item.isDirectory()) await disableDemoActions(filename);
    else if (item.name.endsWith('.html')) {
      const html = await readFile(filename, 'utf8');
      // No appointment, fictitious itinerary or mail is actionable in the public demo.
      await writeFile(filename, html.replace(/href="(?:https:\/\/(?:www\.)?doctolib\.fr\/[^"\s]*|https:\/\/www\.google\.com\/maps\/[^"\s]*|mailto:[^"\s]*)"/g, 'href="#prototype-info"'));
    }
  }
}
await disableDemoActions(output);
await writeFile(join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n# Pages de démonstration : meta robots noindex sur chaque page.\n');
let revision = 'local';
try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
await writeFile(join(output, 'prototype.json'), JSON.stringify({ prototype: true, synthetic: true, revision }, null, 2));
const secret = (await readFile(join(env.CMS_DATA_DIR, 'secret'), 'utf8')).trim();
const credentials = JSON.parse(await readFile(join(env.CMS_DATA_DIR, 'identifiants-locaux.json'), 'utf8'));
await inspectPublicOutput(output, [secret, credentials.password, credentials.email]);
console.log('Prototype synthétique contrôlé ; seule la sortie statique est déployable.');
