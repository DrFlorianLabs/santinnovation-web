/** Run after npm test -- --prod, using its fresh isolated Next production build.
 * A new synthetic database and Chromium context are created on every invocation.
 * No existing CMS accounts, credentials or screenshots are read or modified.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { chromium, type Browser } from '@playwright/test'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await fs.access(path.join(cmsRoot, '.next-test-production', 'BUILD_ID'))
const testDir = path.join(cmsRoot, '.local', 'tests', `account-ui-${Date.now()}`)
await fs.mkdir(testDir, { recursive: true, mode: 0o700 })
const base = 'http://127.0.0.1:3111'
Object.assign(process.env, { NODE_ENV: 'production', CMS_DATA_DIR: testDir, PAYLOAD_SECRET: randomBytes(48).toString('base64url'), CMS_SERVER_URL: base, CMS_TEST_DIST: 'production' })
delete process.env.CMS_DIST_DIR
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const email = `editor-${randomBytes(6).toString('hex')}@example.invalid`
const password = randomBytes(24).toString('base64url')
const newPassword = randomBytes(24).toString('base64url')
try {
  await payload.db.migrate()
  await payload.create({ collection: 'users', overrideAccess: true, data: { nom: 'Admin fictif', email: 'admin-ui@example.invalid', password: randomBytes(24).toString('base64url'), role: 'admin' } })
  await payload.create({ collection: 'users', overrideAccess: true, data: { nom: 'Éditeur fictif', email, password, role: 'editor' } })
} finally { await payload.destroy() }

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3111'], { cwd: cmsRoot, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
let logs = '', browser: Browser | undefined, stage = 'startup', fields: string[] = [], status: number | undefined
child.stdout.on('data', chunk => { logs += chunk }); child.stderr.on('data', chunk => { logs += chunk })
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    assert.equal(child.exitCode, null, 'Le serveur de test doit rester actif')
    try { if ((await fetch(`${base}/admin/login`)).ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  assert.ok(ready)
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  stage = 'login'
  await page.goto(`${base}/admin/login`)
  await page.locator('#field-email').fill(email)
  await page.locator('#field-password').fill(password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(`${base}/admin`)
  stage = 'account'
  await page.goto(`${base}/admin/account`)
  await page.getByRole('button', { name: 'Changer le mot de passe', exact: true }).waitFor()
  assert.ok(await page.locator('input[name="email"]').isDisabled())
  assert.ok(await page.locator('input[name="nom"]').isDisabled())
  assert.equal(await page.getByRole('button', { name: 'Forcer le déverrouillage', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'Changer le mot de passe', exact: true }).click()
  await page.locator('input[name="password"]').fill(newPassword)
  await page.locator('input[name="confirm-password"]').fill(newPassword)
  await page.locator('input[name="confirm-password"]').blur()
  // Payload validates these transient fields with a debounce; await that
  // validation as a human typist would before clicking the native Save control.
  await page.waitForTimeout(800)
  stage = 'native-submit'
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname.startsWith('/api/users/')),
    page.getByRole('button', { name: 'Sauvegarder', exact: true }).click()
  ])
  status = response.status()
  const request = response.request()
  const form = await new Request(request.url(), { method: 'PATCH', headers: request.headers(), body: request.postData() }).formData()
  // Inspect names only. Passwords, token values and account data are never logged.
  fields = Object.keys(JSON.parse(String(form.get('_payload')))).sort()
  assert.deepEqual(fields, ['confirm-password', 'createdAt', 'email', 'nom', 'password', 'role', 'updatedAt'])
  assert.equal(status, 200)
  await page.getByRole('button', { name: 'Changer le mot de passe', exact: true }).waitFor()
  stage = 'new-and-old-login'
  const login = (value: string) => fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email, password: value }) })
  const renewedLogin = await login(newPassword)
  assert.equal(renewedLogin.status, 200)
  const renewedSession = await renewedLogin.json() as { token: string }
  assert.equal((await login(password)).status, 401)
  // Changing the password can invalidate the browser's previous session.
  // Re-read identity using the newly authenticated session, never an old cookie.
  const account = await (await fetch(`${base}/api/users/me`, { headers: { Authorization: `JWT ${renewedSession.token}` } })).json() as any
  assert.equal(account.user.nom, 'Éditeur fictif'); assert.equal(account.user.email, email); assert.equal(account.user.role, 'editor')
  const report = { at: new Date().toISOString(), passed: true, data: 'synthetic-only', mode: 'chromium-production-3111', nativeFields: fields, status, newPasswordLogin: 'pass', oldPasswordRefused: 'pass', identityUnchanged: 'pass', editorUnlockHidden: 'pass' }
  await fs.writeFile(path.join(cmsRoot, '.local', 'account-ui-report.json'), JSON.stringify(report, null, 2), { mode: 0o600 })
  console.log(JSON.stringify(report))
} catch {
  // Playwright exceptions can include fill() arguments; never print them.
  console.error(JSON.stringify({ passed: false, stage, status, nativeFields: fields }))
  process.exitCode = 1
} finally {
  await browser?.close()
  if (child.exitCode === null) { const ended = new Promise(resolve => child.once('exit', resolve)); child.kill('SIGTERM'); await ended }
  await fs.writeFile(path.join(testDir, 'server.log'), logs, { mode: 0o600 })
}
