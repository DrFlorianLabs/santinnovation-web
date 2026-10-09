import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const testCMSURL = process.env.CMS_TEST_URL || 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(testCMSURL).hostname)) {
  throw new Error('Les recettes avec écritures sont réservées au CMS synthétique local.');
}
export async function testCredentials() {
  return JSON.parse(await readFile(resolve(process.env.CMS_DATA_DIR || 'cms/.local', 'identifiants-locaux.json'), 'utf8'));
}
