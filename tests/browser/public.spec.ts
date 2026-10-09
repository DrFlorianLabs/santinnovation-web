import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
async function routes(dir=resolve('.local/site-current'),prefix=''): Promise<string[]> {
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
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:'docs/recette/accueil-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto('/equipe/');await page.screenshot({path:'docs/recette/annuaire-mobile.png',fullPage:true});
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
