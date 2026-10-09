import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { inspectPublicOutput } from '../scripts/scan-public.mjs';
const dir = resolve(process.env.PROTOTYPE_OUT_DIR || 'prototype-dist');
let pages = 0;
async function visit(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const file = join(path, item.name);
    if (item.isDirectory()) await visit(file);
    else if (item.name.endsWith('.html')) {
      pages++;
      const html = await readFile(file, 'utf8');
      assert.match(html, /id="prototype-info"/);
      assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
      assert.match(html, /https:\/\/drflorianlabs\.github\.io\/santinnovation-web\//);
      assert.doesNotMatch(html, /href="(?:mailto:|https:\/\/(?:www\.)?doctolib\.fr\/|https:\/\/www\.google\.com\/maps\/)/);
      for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) assert.ok(url.startsWith('/santinnovation-web/'), `Chemin hors préfixe prototype : ${url}`);
    }
  }
}
await visit(dir); assert.ok(pages >= 19);
assert.equal(JSON.parse(await readFile(join(dir,'prototype.json'),'utf8')).synthetic, true);
console.log(JSON.stringify({ prototypePages: pages, ...await inspectPublicOutput(dir) }));
