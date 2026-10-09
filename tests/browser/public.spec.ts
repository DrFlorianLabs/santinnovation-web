import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
async function routes(dir=resolve(process.env.PUBLIC_TEST_OUTPUT || '.local/site-current'),prefix=''): Promise<string[]> {
  const found:string[]=[];
  for (const item of await readdir(dir,{withFileTypes:true})) {
    if (item.isDirectory()) found.push(...await routes(resolve(dir,item.name),prefix+'/'+item.name));
    else if(item.name==='index.html') found.push(prefix+'/');
  }
  return found;
}
for(const width of [320,768,1440]) test(`navigation, overflow et accessibilité — ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const route of await routes()) {
    const response=await page.goto(route);expect(response?.status(),route).toBe(200);
    await expect(page.locator('h1'),route).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBeTruthy();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test('aucune démo pro ni brouillon accessible, tous liens internes résolus',async({page,request})=>{
  for(const route of ['/pro/','/pro/login/','/actualites/brouillon-secret/','/admin/','/api/actualites']) expect((await request.get(route)).status()).toBe(404);
  const links=new Set<string>();
  for(const route of await routes()) {await page.goto(route);for(const href of await page.locator('a[href^="/"]').evaluateAll(as=>as.map(a=>(a as HTMLAnchorElement).pathname))) links.add(href);}
  for(const link of links) expect((await request.get(link)).status(),link).toBe(200);
});
test('carte sur action seulement et parcours sans JavaScript',async({browser,page})=>{
  const thirdParties:string[]=[];page.on('request',r=>{if(r.url().includes('cartocdn')) thirdParties.push(r.url());});
  await page.goto('/lieux/');await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(thirdParties).toEqual([]);
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const nojs=await context.newPage();
  await nojs.goto('/equipe/');await expect(nojs.locator('main')).toBeVisible();expect(await nojs.locator('a[href*="/equipe/"]').count()).toBeGreaterThan(0);await context.close();
});
test('aperçus visuels synthétiques',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:'test-results/captures/accueil-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto('/equipe/');await page.screenshot({path:'test-results/captures/annuaire-mobile.png',fullPage:true});
});

test('filtres annuaire et menu mobile au clavier',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/equipe/');
  await page.getByLabel('Nom ou compétence').fill('Camille');await expect(page.locator('[data-pro]:visible')).toHaveCount(1);
  await page.getByLabel('Profession',{exact:true}).selectOption('infirmier');await expect(page.locator('[data-empty]')).toBeVisible();
  await page.getByLabel('Nom ou compétence').fill('');await expect(page.locator('[data-pro]:visible')).toHaveCount(1);
  await page.getByLabel('Lieu de consultation',{exact:true}).selectOption('etablissement-fictif-sud');await expect(page.locator('[data-empty]')).toBeVisible();
  const menu=page.getByLabel('Menu de navigation');await menu.focus();await page.keyboard.press('Enter');await expect(page.locator('[data-mobile-menu]')).toHaveAttribute('open','');await page.keyboard.press('Escape');await expect(page.locator('[data-mobile-menu]')).not.toHaveAttribute('open','');await expect(menu).toBeFocused();
});
test('carte déclenchée au clic avec tuiles synthétiques, image et heure événement',async({page})=>{
  const tile=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');let tiles=0;
  await page.route('https://*.basemaps.cartocdn.com/**',r=>{tiles++;return r.fulfill({status:200,contentType:'image/png',body:tile});});
  await page.goto('/lieux/');expect(tiles).toBe(0);await page.getByRole('button',{name:'Afficher la carte interactive'}).click();await expect(page.locator('.leaflet-container')).toBeVisible();await expect.poll(()=>tiles).toBeGreaterThan(0);
  await page.goto('/actualites/prevention-fictive/');await expect(page.locator('main img')).toHaveAttribute('alt','Carré rouge synthétique pour la recette');await expect(page.locator('main')).toContainText('10:00');
});

for (const width of [390, 1440]) test(`accueil continu, ancres et retour depuis une fiche — ${width}px`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  const ids = ['rendez-vous', 'actualites', 'equipe', 'lieux', 'soins-et-parcours', 'projet-de-sante', 'recherche-innovation'];
  expect(await page.locator('main > section[id]').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(ids);
  await page.evaluate(() => { (window as any).__sameHomeDocument = true; });
  const menu = page.locator('[data-mobile-menu]');
  const navigation = page.getByRole('navigation', { name: 'Navigation principale', exact: true });
  for (const [label, id] of [["L'équipe", 'equipe'], ['Les lieux', 'lieux'], ['Soins et parcours', 'soins-et-parcours'], ['Projet de santé', 'projet-de-sante'], ['Recherche & innovation', 'recherche-innovation'], ['Actualités', 'actualites']]) {
    if (width < 1280) { await menu.locator('summary').click(); await menu.getByRole('link', { name: label, exact: true }).click(); }
    else await navigation.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    expect(await page.evaluate(() => (window as any).__sameHomeDocument)).toBe(true);
    await expect.poll(() => page.locator(`#${id}`).evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeGreaterThanOrEqual(64);
    await expect.poll(() => page.locator(`#${id}`).evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThan(160);
    if (width < 1280) await expect(menu).not.toHaveAttribute('open', '');
    else await expect(navigation.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'location');
  }
  await page.getByLabel('Nom ou compétence').fill('Camille');
  await expect(page.locator('[data-pro]:visible')).toHaveCount(1);
  await page.goto('/actualites/prevention-fictive/');
  if (width < 1280) { await menu.locator('summary').click(); await menu.getByRole('link', { name: "L'équipe", exact: true }).click(); }
  else await navigation.getByRole('link', { name: "L'équipe", exact: true }).click();
  await expect(page).toHaveURL(/\/#equipe$/);
  await expect(page.locator('#equipe')).toBeVisible();
});

test('ancres de l’accueil utilisables sans JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(String(test.info().project.use.baseURL) + '/');
  const menu = page.locator('[data-mobile-menu]');
  await menu.locator('summary').click();
  await menu.getByRole('link', { name: "L'équipe", exact: true }).click();
  await expect(page).toHaveURL(/\/#equipe$/);
  await expect(page.locator('#equipe [data-pro]')).toHaveCount(2);
  expect(await page.locator('#equipe').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
  await context.close();
});
