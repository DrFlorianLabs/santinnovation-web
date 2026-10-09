import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60_000, retries: 0, workers: 2,
  use: { baseURL: 'http://127.0.0.1:4321', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: 'node scripts/serve-local.mjs', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI },
  reporter: [['list'], ['json',{outputFile:'.local/browser-results.json'}]],
});
