import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readApprovedContent, validateApprovedPublicAssets } from './validate-approved-content.mjs';
import { inspectPublicOutput } from './scan-public.mjs';

const root = resolve(import.meta.dirname, '..');
// Fixed source: no CMS_DATA_DIR, CMS_CONTENT_DIR, bundle or arbitrary input path.
// Authorization is represented by the reviewed files committed under this path.
const data = await readApprovedContent(join(root, 'content', 'approved'));
await validateApprovedPublicAssets(join(root, 'public'));
const output = resolve(process.env.PROTOTYPE_OUT_DIR || join(root, 'prototype-dist'));
const outputRelative = relative(root, output);
if (outputRelative !== 'prototype-dist' && !outputRelative.startsWith('.local/')) {
  throw new Error('La sortie doit être prototype-dist ou un nouveau dossier dans .local.');
}
await mkdir(join(root, '.local'), { recursive: true });
try { await mkdir(output); }
catch { throw new Error('Le dossier de sortie existe déjà ou ne peut pas être créé. Choisir PROTOTYPE_OUT_DIR neuf.'); }
const work = await mkdtemp(join(root, '.local', 'approved-prototype-'));
const content = join(work, 'content');
await mkdir(content);
data.site.url = 'https://drflorianlabs.github.io/santinnovation-web/';
for (const [name, entries] of Object.entries(data)) await writeFile(join(content, `${name}.json`), JSON.stringify(entries));
const digest = createHash('sha256').update(JSON.stringify(data)).digest('hex');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Révision Git invalide.');
const env = { ...process.env, NODE_ENV: 'production', SITE_URL: 'https://drflorianlabs.github.io', SITE_BASE: '/santinnovation-web/', PUBLIC_DEMO: 'approved', CMS_CONTENT_DIR: content, BUILD_OUT_DIR: output };
// These values have no purpose in a static approved build; do not pass them to
// Astro or allow accidental fallback to a CMS connection/export configuration.
for (const key of Object.keys(env)) if (/^(?:CMS_(?!CONTENT_DIR$)|PAYLOAD_|BACKUP_|SMTP_|DATABASE_)/.test(key)) delete env[key];
await new Promise((done, reject) => {
  const child = spawn('npm', ['run', 'build'], { cwd: root, env, stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', code => code === 0 ? done() : reject(new Error('Construction du prototype approuvé refusée.')));
});
await writeFile(join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n# Prototype public : meta robots noindex sur chaque page.\n');
await writeFile(join(output, 'prototype.json'), JSON.stringify({ prototype: true, synthetic: false, approved: true, revision, contentDigest: digest }, null, 2));
await inspectPublicOutput(output);
console.log('Prototype construit depuis les seuls contenus publics approuvés. Vérifier avec npm run test:approved-prototype avant transfert.');
