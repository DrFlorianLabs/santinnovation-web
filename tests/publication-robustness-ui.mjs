import { chromium } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { build } from '../cms/node_modules/esbuild/lib/main.js';
const root = resolve(import.meta.dirname, '..');
const data = await mkdtemp(join(tmpdir(), 'publication-robustness-ui-'));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [status, text] of [
    [{ state:'locked', checkedAt:new Date().toISOString(), error:{code:'LOCK_CHILD_ACTIVE'} }, 'Publication bloquée'],
    [{ state:'ready', checkedAt:new Date(Date.now()-360_000).toISOString() }, 'Service de publication inactif'],
    [{ state:'error', checkedAt:new Date().toISOString(), error:{code:'LOCATION_UNAVAILABLE',collection:'professionnels',slug:'camille-fictif',message:'SECRET_MUST_NOT_RENDER'} }, 'professionnels / camille-fictif'],
    [{ state:'rolledBack', checkedAt:new Date().toISOString() }, 'Version antérieure restaurée'],
  ]) {
    await writeFile(join(data,'publication-status.json'),JSON.stringify(status));
    const render = spawnSync(process.execPath, ['--import',join(root,'cms/node_modules/tsx/dist/loader.mjs'),join(root,'tests/publication-robustness-render.mjs')], { cwd:join(root,'cms'),env:{...process.env,CMS_DATA_DIR:data},encoding:'utf8',timeout:10_000 });
    assert.equal(render.status,0,render.stderr);
    await page.setContent(render.stdout);
    assert.match(await page.locator('body').innerText(),new RegExp(text));
    assert.doesNotMatch(await page.locator('body').innerText(),/SECRET_MUST_NOT_RENDER/);
    if (status.state !== 'rolledBack') assert.equal(await page.getByRole('alert').count(),1);
  }
  console.log('PASS 4 états du composant serveur réel relus dans Chromium (HTML isolé, aucun CMS ni capture publique modifié).');
  // Mount the actual client component; only Next's router is replaced with a
  // refresh counter. Advance the browser clock without waiting six real minutes.
  const bundled = await build({
    stdin: { contents: `import {createElement} from './cms/node_modules/react/index.js';
      import {createRoot} from './cms/node_modules/react-dom/client.js';
      import Freshness from './cms/src/components/PublicationFreshness.tsx';
      window.refreshCount=0;window.fixtureRouter={refresh(){window.refreshCount++}};
      createRoot(document.getElementById('app')).render(createElement(Freshness,{updated:new Date(Date.now()).toISOString(),stale:false,label:'Dernière génération du site prête.',hasCause:false}));`, resolveDir:root },
    bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"test"'},
    plugins:[{name:'router-harness',setup(builder){
      builder.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'fixture'}));
      builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export function useRouter(){return window.fixtureRouter}',loader:'js'}));
    }}],
  });
  await page.clock.install({time:new Date()});
  await page.setContent('<div id="app"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});
  await page.getByRole('status').waitFor();
  await page.clock.runFor(316_000);
  assert.match(await page.getByRole('alert').innerText(),/Service de publication inactif/);
  assert.ok(await page.evaluate(()=>window.refreshCount)>=10);
  assert.doesNotMatch(await page.locator('body').innerText(),/site prête/);
  console.log('PASS onglet maintenu ouvert : à 5 min 15 s le badge prêt disparaît, alerte visible, rafraîchissement demandé toutes les 30 s (horloge Chromium simulée).');
} finally { await browser.close(); }
