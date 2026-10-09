import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function inspectPublicOutput(directory, forbidden = []) {
  let files = 0;
  async function visit(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      assert.ok(!item.isSymbolicLink(), 'Lien symbolique interdit dans une sortie publique');
      const name = join(dir, item.name);
      assert.ok(!['cms.sqlite','secret','identifiants-locaux.json','bundle.json','publication-status.json'].includes(item.name), 'Fichier privé dans la sortie publique');
      if (item.isDirectory()) { assert.ok(!['.local','.releases','cms','admin','pro'].includes(item.name), 'Répertoire privé dans la sortie'); await visit(name); }
      else {
        files++;
        const buffer = await readFile(name);
        for (const token of ['DRAFT_NEVER_PUBLIC', 'BEGIN PRIVATE KEY', ...forbidden.filter(Boolean)]) assert.ok(!buffer.includes(Buffer.from(token)), 'Marqueur privé détecté dans la sortie publique');
      }
    }
  }
  await visit(resolve(directory));
  assert.ok(files > 0, 'Sortie publique vide');
  return { files, privateMarkersAbsent: true };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(await inspectPublicOutput(process.argv[2] || '.local/site-current')));
