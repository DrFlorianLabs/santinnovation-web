import { defineConfig } from '@playwright/test';
const port = Number(process.env.PUBLIC_TEST_PORT || 4321);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Port de recette locale invalide.');
const output = process.env.PUBLIC_TEST_OUTPUT || '.local/site-current';
const quotedOutput = "'" + output.replaceAll("'", "'\\''") + "'";
export default defineConfig({
  testDir: './tests/browser', timeout: 60_000, retries: 0, workers: 2,
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: `node scripts/serve-local.mjs ${quotedOutput}`, env: { PORT: String(port) }, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI },
  reporter: [['list'], ['json',{outputFile:'.local/browser-results.json'}]],
});
