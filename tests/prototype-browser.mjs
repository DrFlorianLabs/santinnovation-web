import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4323/santinnovation-web/';
const browser = await chromium.launch();
let checks = 0;
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const failed = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['', 'equipe/', 'lieux/', 'actualites/prevention-fictive/']) {
      assert.equal((await page.goto(url + route)).status(), 200);
      assert.ok(await page.locator('#prototype-info').isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
      assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
      checks++;
    }
  }
  assert.deepEqual(failed, []);
  await mkdir('test-results/captures', { recursive: true });
  await page.goto(url); await page.screenshot({ path: 'test-results/captures/prototype-desktop.png', fullPage: true });
  await writeFile('.local/prototype-browser-results.json', JSON.stringify({ checks, widths: [320,1440], failures: 0 }, null, 2));
  console.log(`PASS ${checks} pages/largeurs prototype avec assets, bandeau et axe`);
} finally { await browser.close(); }
