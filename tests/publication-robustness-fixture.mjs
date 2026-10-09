// Synthetic, isolated publication subprocess. Never reads the working CMS.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { acquireLock } from '../scripts/lib/publication-lock.mjs';
import { configuration } from '../scripts/lib/publication-runtime.mjs';
const mode = process.argv[2];
if (mode === 'hold-group') {
  process.on('SIGTERM', () => {});
  setInterval(() => {}, 1000);
} else if (mode === 'hold-lock') {
  const config = configuration(); const lock = await acquireLock(config);
  await writeFile(join(config.local, 'test-owner-ready'), 'ready');
  process.on('SIGTERM', async () => { await lock.release(); process.exit(0); });
  setInterval(() => {}, 1000);
} else {
  const root = process.env.PUBLICATION_ROOT;
  if (!root || !root.includes('publication-robustness-')) throw new Error('Fixture requires its isolated temporary directory.');
  const options = JSON.parse(await readFile(join(root, 'fixture.json'), 'utf8'));
  if (options.fail === mode) {
    console.error('PUBLICATION_ERROR_JSON=' + JSON.stringify({ code: 'LOCATION_UNAVAILABLE', collection: 'professionnels', slug: 'camille-fictif', message: 'SECRET_SHOULD_NOT_BE_DISPLAYED' }));
    process.exit(2);
  }
  if (options.hang === mode) {
    process.on('SIGTERM', () => {});
    const grandchild = spawn(process.execPath, [import.meta.filename, 'hold-group'], { stdio: 'ignore' });
    await writeFile(join(root, '.local/test-started.json'), JSON.stringify({ pid: process.pid, descendant: grandchild.pid, stage: mode }));
    await new Promise(() => {});
  }
  if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay));
  if (mode === 'export') {
    const doc = (slug, extra = {}) => ({ slug, _status: 'published', visible: true, archive: false, ...extra });
    const bundle = { professionnels: [], lieux: [], actualites: [doc('actualite-fictive', { titre: `Fictif ${options.generation}`, resume: 'Fixture sans données réelles', date: '2026-10-09', bodyHtml: '<p>Fictif</p>' })],
      pages: ['mentions-legales','confidentialite','accessibilite'].map(slug => doc(slug, { titre: 'Fictif', validationLegale: true, bodyHtml: '<p>Fictif</p>' })),
      activites: [], innovations: [], partenaires: [], informations: [doc('general', { nom: 'MSP fictive', contactsVerifies: true, doctolibUrl: 'https://www.doctolib.fr/maison-de-sante/ville-fictive/msp-fictive' })] };
    await mkdir(process.argv[4], { recursive: true });
    await writeFile(process.argv[3], JSON.stringify(bundle));
  } else if (mode === 'build') {
    const articles = JSON.parse(await readFile(join(process.env.CMS_CONTENT_DIR, 'actualites.json'), 'utf8'));
    await mkdir(process.env.BUILD_OUT_DIR, { recursive: true });
    await writeFile(join(process.env.BUILD_OUT_DIR, 'index.html'), `<main><h1>${articles[0].titre}</h1></main>`);
  } else throw new Error('Unknown fixture mode');
}
