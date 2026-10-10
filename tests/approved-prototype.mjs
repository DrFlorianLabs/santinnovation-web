import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readApprovedContent, legalPages, pageSlugs, approvedPublicAssets, validateApprovedPublicAssets } from '../scripts/validate-approved-content.mjs';
import { inspectPublicOutput } from '../scripts/scan-public.mjs';

const root = resolve(import.meta.dirname, '..');
const output = resolve(process.env.PROTOTYPE_OUT_DIR || join(root, 'prototype-dist'));
const data = await readApprovedContent(join(root, 'content', 'approved'));
await validateApprovedPublicAssets(join(root, 'public'));
data.site.url = 'https://drflorianlabs.github.io/santinnovation-web/';
const metadata = JSON.parse(await readFile(join(output, 'prototype.json'), 'utf8'));
assert.equal(metadata.prototype, true);
assert.equal(metadata.synthetic, false);
assert.equal(metadata.approved, true);
assert.equal(metadata.revision, execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
assert.equal(metadata.contentDigest, createHash('sha256').update(JSON.stringify(data)).digest('hex'));
let pages = 0;
const htmlPaths = new Set(['index.html', 'actualites/index.html', ...pageSlugs.filter(id => id !== 'accueil').map(id => `${id}/index.html`)]);
for (const [collection, directory] of [['professionnels', 'equipe'], ['lieux', 'lieux'], ['actualites', 'actualites'], ['activites', 'activites'], ['innovations', 'innovations']]) {
  for (const doc of data[collection]) htmlPaths.add(`${directory}/${doc.id}/index.html`);
}
const staticPaths = new Set([...approvedPublicAssets, 'prototype.json', 'sitemap-index.xml', 'sitemap-0.xml']);
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), 'Lien symbolique dans le prototype');
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    const path = relative(output, file);
    const compiledAsset = /^_astro\/[^/]+\.(?:js|css|svg|woff2?)$/.test(path);
    const leafletIcon = /^_astro\/(?:layers(?:-2x)?|marker-icon(?:-2x)?|marker-shadow)\.[A-Za-z0-9_-]+\.png$/.test(path);
    assert.ok(htmlPaths.has(path) || staticPaths.has(path) || compiledAsset || leafletIcon, 'Fichier inattendu dans la sortie');
    if (!entry.name.endsWith('.html')) continue;
    pages++;
    const html = await readFile(file, 'utf8');
    assert.match(html, /id="prototype-info"/);
    assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
    assert.match(html, /https:\/\/drflorianlabs\.github\.io\/santinnovation-web\//);
    assert.doesNotMatch(html, /Les professionnels, lieux et actualités sont fictifs|\[À (?:COMPLÉTER|CONFIRMER)|DRAFT_NEVER_PUBLIC|application\/ld\+json/);
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) assert.ok(url.startsWith('/santinnovation-web/'), 'Chemin public hors préfixe GitHub Pages');
  }
}
await visit(output);
assert.ok(pages >= 10, 'Pages institutionnelles manquantes');
for (const [collection, directory] of [['professionnels', 'equipe'], ['lieux', 'lieux'], ['actualites', 'actualites'], ['activites', 'activites'], ['innovations', 'innovations']]) {
  for (const doc of data[collection]) assert.ok((await stat(join(output, directory, doc.id, 'index.html'))).isFile(), 'Fiche approuvée absente');
}
for (const id of legalPages) {
  const html = await readFile(join(output, id, 'index.html'), 'utf8');
  assert.match(html, /prototype/i);
  // The distinct prototype path must not promote a historical legal template.
  assert.doesNotMatch(html, /\[À COMPLÉTER|Le site est hébergé par <strong>OVH SAS/);
}
console.log(JSON.stringify({ approvedPrototypePages: pages, professionals: data.professionnels.length, locations: data.lieux.length, ...await inspectPublicOutput(output) }));
