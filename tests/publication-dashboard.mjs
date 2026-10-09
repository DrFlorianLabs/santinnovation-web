import { chromium } from '@playwright/test';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { testCMSURL as base, testCredentials } from './helpers/runtime.mjs';

const filename = resolve(process.env.CMS_DATA_DIR || 'cms/.local', 'publication-status.json');
let previous; try { previous = await readFile(filename); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const browser = await chromium.launch();
const context = await browser.newContext({ extraHTTPHeaders: { Origin: base } });
try {
  const credentials = await testCredentials();
  const login = await context.request.post(base + '/api/users/login', { data: credentials });
  assert.equal(login.status(), 200);
  const info = await (await context.request.get(base + '/api/informations')).json();
  assert.equal(info.docs[0]?.nomCourt, 'MSP fictive', 'Test réservé aux fixtures locales');
  const page = await context.newPage();
  for (const [status, expected] of [
    [{ state: 'locked', checkedAt: new Date().toISOString(), error: { code: 'LOCKED' } }, 'Publication bloquée'],
    [{ state: 'ready', checkedAt: new Date(Date.now()-360000).toISOString() }, 'Service de publication inactif'],
    [{ state: 'error', checkedAt: new Date().toISOString(), error: { code: 'LOCATION_UNAVAILABLE', collection: 'professionnels', slug: 'camille-exemple', message: 'PRIVATE_DETAIL_NEVER_RENDER' } }, 'professionnels / camille-exemple'],
  ]) {
    await writeFile(filename, JSON.stringify(status), { mode: 0o600 });
    await page.goto(base + '/admin');
    await page.getByText(expected, { exact: false }).waitFor();
    const rendered = await page.locator('body').innerText();
    assert.ok(!rendered.includes('Dernière génération du site prête.'));
    assert.ok(!rendered.includes('PRIVATE_DETAIL_NEVER_RENDER'));
  }
  console.log('PASS tableau de bord : verrou, inactivité et erreur avec fiche, sans faux succès ni détail privé');
} finally {
  if (previous) await writeFile(filename, previous); else await unlink(filename).catch(e => { if (e.code !== 'ENOENT') throw e; });
  await browser.close();
}
