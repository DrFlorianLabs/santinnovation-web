import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createLocalReq, restoreVersionOperation, type Payload } from 'payload'
import { exportSnapshot } from './export'
import { PublicationGraphError } from '../src/lib/publication-graph'

export async function hardeningLocal(payload: Payload, admin: any, editor: any, testDir: string, ok: (s: string) => void) {
  const create = (collection: any, data: any) => payload.create({ collection, data, user: admin, overrideAccess: false }) as Promise<any>
  const update = (collection: any, id: any, data: any, draft = false) => payload.update({ collection, id, data, draft, user: admin, overrideAccess: false }) as Promise<any>
  const read = (collection: any, id: any, draft = false) => payload.findByID({ collection, id, draft, depth: 0, user: admin, overrideAccess: false }) as Promise<any>
  const version = async (collection: any, id: any, predicate: (doc: any) => boolean) => (await payload.findVersions({ collection, where: { parent: { equals: id } }, sort: '-updatedAt', limit: 100, user: admin, overrideAccess: false })).docs.find(predicate)!
  const restoreAsDraft = async (collection: any, id: any) => restoreVersionOperation({ collection: payload.collections[collection as keyof typeof payload.collections], id, draft: true, overrideAccess: false, req: await createLocalReq({ user: admin }, payload) })
  const placeData = (slug: string, extra = {}) => ({ slug, nom: 'Lieu de test synthétique', adresse: '1 rue fictive', codePostal: '25000', ville: 'Fictive', latitude: 47, longitude: 6, coordonneesVerifiees: true, _status: 'published', ...extra })
  const proData = (slug: string, lieux: number[], extra = {}) => ({ slug, prenom: 'Fictif', nom: 'Test', titreAffiche: 'Professionnel de test', profession: 'infirmier', professionLabel: 'Infirmier', lieux, _status: 'published', ...extra })
  const a = await create('lieux', placeData('graphe-a'))
  const b = await create('lieux', placeData('graphe-b'))
  const pro = await create('professionnels', proData('graphe-pro', [a.id], { horairesParLieu: [{ lieu: a.id, horaires: 'Horaires fictifs' }] }))
  const proBefore = await version('professionnels', pro.id, v => v.version._status === 'published')
  await update('professionnels', pro.id, { lieux: [b.id], horairesParLieu: [], _status: 'draft' }, true)
  assert.deepEqual((await read('professionnels', pro.id)).lieux, [a.id])
  for (const data of [{ _status: 'draft' }, { visible: false, _status: 'published' }, { archive: true, _status: 'published' }, { debutAffichage: '2099-01-01T00:00:00Z', _status: 'published' }, { finAffichage: '2099-01-01T00:00:00Z', _status: 'published' }]) await assert.rejects(() => update('lieux', a.id, data), /fiche publiée/)
  await update('lieux', a.id, { visible: false, _status: 'draft' }, true)
  const retirement = await version('lieux', a.id, v => v.version._status === 'draft' && !v.version.visible)
  assert.equal((await read('lieux', a.id)).visible, true)
  await assert.rejects(() => update('lieux', a.id, { _status: 'published' }), /fiche publiée/)
  ok('M02 — retrait/masquage/archive/période refusés sur liens publiés malgré brouillons plus récents')
  // Publish the move first; withdrawing the now unused place is then allowed.
  await update('professionnels', pro.id, { _status: 'published' })
  await update('lieux', a.id, { _status: 'draft' })
  await assert.rejects(() => payload.restoreVersion({ collection: 'professionnels', id: proBefore.id, user: admin, overrideAccess: false }), /lieu lié/)
  await restoreAsDraft('professionnels', proBefore.id)
  assert.deepEqual((await read('professionnels', pro.id)).lieux, [b.id])
  await update('lieux', a.id, { visible: true, _status: 'published' })
  await update('professionnels', pro.id, { _status: 'published' })
  await assert.rejects(() => payload.restoreVersion({ collection: 'lieux', id: retirement.id, user: admin, overrideAccess: false }), /fiche publiée/)
  await restoreAsDraft('lieux', retirement.id)
  assert.equal((await read('lieux', a.id)).visible, true)
  ok('M02 — restaurations contrôlées; restauration en brouillon préserve le publié; déplacement autorise retrait')

  const future = await create('lieux', placeData('graphe-futur', { debutAffichage: '2090-01-01T00:00:00Z', finAffichage: '2092-01-01T00:00:00Z' }))
  await assert.rejects(() => create('professionnels', proData('graphe-trop-tot', [future.id])), /période/)
  await assert.rejects(() => create('professionnels', proData('graphe-trop-long', [future.id], { debutAffichage: '2090-01-01T00:00:00Z' })), /période/)
  const futurePro = await create('professionnels', proData('graphe-futur-pro', [future.id], { debutAffichage: '2090-01-01T00:00:00Z', finAffichage: '2092-01-01T00:00:00Z' }))
  await assert.rejects(() => update('lieux', future.id, { debutAffichage: '2091-01-01T00:00:00Z', _status: 'published' }), /fiche publiée/)
  await assert.rejects(() => update('lieux', future.id, { finAffichage: '2091-01-01T00:00:00Z', _status: 'published' }), /fiche publiée/)
  await update('professionnels', futurePro.id, { finAffichage: '2091-01-01T00:00:00Z', _status: 'published' })
  await update('lieux', future.id, { finAffichage: '2091-01-01T00:00:00Z', _status: 'published' })
  const past = await create('lieux', placeData('graphe-passe'))
  await create('professionnels', proData('graphe-passe-pro', [past.id], { debutAffichage: '2019-01-01T00:00:00Z', finAffichage: '2020-01-01T00:00:00Z' }))
  await update('lieux', past.id, { _status: 'draft' })
  ok('M02 — périodes futures couvertes, égalité des bornes acceptée, dépendances expirées libérées')

  const concurrentPlace = await create('lieux', placeData('graphe-concurrent'))
  const concurrentPro = await create('professionnels', proData('graphe-concurrent-pro', [concurrentPlace.id], { _status: 'draft' }))
  const concurrent = await Promise.allSettled([update('professionnels', concurrentPro.id, { _status: 'published' }), update('lieux', concurrentPlace.id, { visible: false, _status: 'published' })])
  assert.ok(concurrent.some(result => result.status === 'rejected'))
  await exportSnapshot(payload, path.join(testDir, 'graphe-valide.json'), path.join(testDir, 'graph-media'))
  ok('M02 — course publication/retrait : au moins une mutation refusée, graphe final cohérent')

  // Corrupt only the isolated test DB, below hooks, to verify exporter defence.
  await payload.db.updateOne({ collection: 'lieux', id: a.id, data: { visible: false } })
  await assert.rejects(() => exportSnapshot(payload, path.join(testDir, 'graphe-interdit.json'), path.join(testDir, 'graph-media')), (error: unknown) => error instanceof PublicationGraphError && error.problem.code === 'LOCATION_UNAVAILABLE' && error.problem.slug === 'graphe-pro')
  await assert.rejects(fs.access(path.join(testDir, 'graphe-interdit.json')))
  await payload.db.updateOne({ collection: 'lieux', id: a.id, data: { visible: true } })
  const frozen = Date.parse('2090-06-01T00:00:00Z')
  const frozenBundle = await exportSnapshot(payload, path.join(testDir, 'graphe-date-figee.json'), path.join(testDir, 'graph-media'), frozen)
  assert.ok(frozenBundle.professionnels.some(doc => doc.slug === 'graphe-futur-pro'))
  ok('M02 — export défensif structuré, aucun fichier incohérent écrit; instant figé pour restauration')

  const nextPassword = randomBytes(24).toString('base64url')
  const storedPassword = () => payload.db.findOne({ collection: 'users', where: { id: { equals: editor.id } }, select: { hash: true, salt: true } }) as Promise<{ hash?: string; salt?: string } | null>
  const passwordBefore = await storedPassword()
  const originalAccount = await payload.findByID({ collection: 'users', id: editor.id, user: editor, overrideAccess: false })
  const nativeFields = { password: nextPassword, 'confirm-password': nextPassword, nom: editor.nom, email: editor.email, role: editor.role, updatedAt: originalAccount.updatedAt, createdAt: originalAccount.createdAt }
  const changed = await payload.update({ collection: 'users', id: editor.id, user: editor, overrideAccess: false, data: nativeFields })
  assert.equal(changed.role, 'editor'); assert.equal(changed.email, editor.email)
  // Keep the real login immediately after update, before any extra diagnostic
  // read or PBKDF2 work. Diagnostics must not hide a timing-dependent failure.
  const authenticatedImmediately = await payload.login({ collection: 'users', data: { email: editor.email, password: nextPassword } }).then(result => Boolean(result.token), () => false)
  // Verify committed storage outside the update request. Keep every assertion
  // boolean: a failure must never print password hashes, salts or credentials.
  const passwordAfter = await storedPassword()
  assert.ok(typeof passwordAfter?.hash === 'string' && typeof passwordAfter.salt === 'string', 'Le compte doit conserver un hash et un sel valides')
  assert.ok(passwordAfter.hash !== passwordBefore?.hash && passwordAfter.salt !== passwordBefore?.salt, 'Le changement de mot de passe doit renouveler le hash et le sel persistés')
  const prefix = 'pbkdf2-sha256-v1:' // Format generated by the pinned Payload 3.90.2.
  assert.ok(passwordAfter.hash.startsWith(prefix), 'Le hash persisté doit utiliser le format courant de Payload')
  const storedHash = Buffer.from(passwordAfter.hash.slice(prefix.length), 'hex')
  const expectedHash = await promisify(pbkdf2)(nextPassword, passwordAfter.salt, 600000, 32, 'sha256')
  assert.ok(storedHash.length === expectedHash.length && timingSafeEqual(storedHash, expectedHash), 'Le hash persisté doit correspondre au nouveau mot de passe')
  assert.ok(authenticatedImmediately, 'La connexion immédiate doit accepter le nouveau mot de passe, avant tout diagnostic')
  for (const data of [{ role: 'admin' }, { email: 'intrus@example.invalid' }, { nom: 'Autre nom' }, { resetPasswordToken: 'fictif' }, { loginAttempts: 0 }, { sessions: [] }, { unknown: 'fictif' }]) await assert.rejects(() => payload.update({ collection: 'users', id: editor.id, user: editor, overrideAccess: false, data: { password: nextPassword, ...data } as any }))
  await assert.rejects(() => payload.update({ collection: 'users', id: editor.id, user: editor, overrideAccess: false, data: { password: nextPassword, 'confirm-password': 'confirmation-fictive-differente' } as any }), /confirmation/)
  for (const field of ['updatedAt', 'createdAt']) await assert.rejects(() => payload.update({ collection: 'users', id: editor.id, user: editor, overrideAccess: false, data: { password: nextPassword, [field]: '2000-01-01T00:00:00Z' } as any }))
  await assert.rejects(() => payload.update({ collection: 'users', id: admin.id, user: editor, overrideAccess: false, data: { password: nextPassword } }))
  for (const email of [admin.email, 'absent@example.invalid']) await assert.rejects(() => payload.forgotPassword({ collection: 'users', data: { email } }), /désactivée/)
  const account = await payload.findByID({ collection: 'users', id: admin.id, overrideAccess: true, showHiddenFields: true })
  assert.ok(!account.resetPasswordToken && !account.resetPasswordExpiration)
  ok('M03 — éditeur modifie seulement son mot de passe; identité/rôle/champs internes et autre compte refusés')
  ok('M03 — récupération locale désactivée, aucun jeton généré')
  const db = payload.db as typeof payload.db & { client: { execute: (sql: string) => Promise<{ rows: any[] }> } }
  assert.equal((await db.client.execute('PRAGMA journal_mode')).rows[0].journal_mode, 'wal')
  // libsql rotates its native connection after a transaction. Its next connection
  // does not inherit busy_timeout; do not claim a 5s wait on every write.
  assert.equal(Number((await db.client.execute('PRAGMA busy_timeout')).rows[0].timeout), 0)
  assert.equal(Number((await db.client.execute('PRAGMA synchronous')).rows[0].synchronous), 2)
  ok('SQLite — WAL et FULL vérifiés; timeout initial 5000 puis remise à 0 native libsql caractérisée')
  return nextPassword
}

export function runChild(args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''; child.stdout.on('data', chunk => { output += chunk }); child.stderr.on('data', chunk => { output += chunk })
    child.once('error', reject); child.once('exit', code => resolve({ code, output }))
  })
}

export async function hardeningInit(cmsRoot: string, testDir: string, ok: (s: string) => void) {
  const dir = path.join(testDir, 'production-init')
  const password = randomBytes(24).toString('base64url'), secret = randomBytes(48).toString('base64url')
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production', CMS_DATA_DIR: dir, PAYLOAD_SECRET: secret, CMS_INIT_ADMIN_EMAIL: 'init-fictif@example.invalid', CMS_INIT_ADMIN_PASSWORD: password }
  const absent = await runChild(['--import', 'tsx', 'scripts/init.ts'], cmsRoot, { ...env, CMS_INIT_ADMIN_PASSWORD: '' })
  assert.equal(absent.code, 1); await assert.rejects(fs.access(dir))
  await fs.mkdir(dir, { recursive: true, mode: 0o700 })
  const migrate = await runChild(['--import', 'tsx', '--input-type=module', '-e', "import {getPayload} from 'payload'; import config from './src/payload.config.ts'; const p=await getPayload({config}); await p.db.migrate(); await p.destroy()"], cmsRoot, env)
  assert.equal(migrate.code, 0, 'Migration du test init production doit réussir')
  const first = await runChild(['--import', 'tsx', 'scripts/init.ts'], cmsRoot, env)
  assert.equal(first.code, 0, 'Init production doit réussir')
  const second = await runChild(['--import', 'tsx', 'scripts/init.ts'], cmsRoot, { ...env, CMS_INIT_ADMIN_PASSWORD: randomBytes(24).toString('base64url') })
  assert.equal(second.code, 0); assert.match(second.output, /Comptes existants conservés/)
  for (const result of [absent, migrate, first, second]) { assert.ok(!result.output.includes(password)); assert.ok(!result.output.includes(secret)); assert.ok(!result.output.includes(env.CMS_INIT_ADMIN_EMAIL!)) }
  await assert.rejects(fs.access(path.join(dir, 'identifiants-locaux.json')))
  await assert.rejects(fs.access(path.join(dir, 'secret')))
  const login = await runChild(['--import', 'tsx', '--input-type=module', '-e', "import {getPayload} from 'payload'; import config from './src/payload.config.ts'; const p=await getPayload({config}); await p.login({collection:'users',data:{email:process.env.CMS_INIT_ADMIN_EMAIL,password:process.env.CMS_INIT_ADMIN_PASSWORD}}); await p.destroy()"], cmsRoot, env)
  assert.equal(login.code, 0, 'Init réexécuté doit préserver le mot de passe initial')
  ok('M03 — init production exige environnement, migre en test, reste idempotent et ne crée ni identifiants ni secret sur disque')
}
