import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const production = process.argv.includes('--prod')
if (production) Object.assign(process.env, { NODE_ENV: 'production' })
const testDir = path.join(cmsRoot, '.local', 'tests', String(Date.now()))
await fs.mkdir(testDir, { recursive: true, mode: 0o700 })
process.env.CMS_DATA_DIR = testDir
process.env.PAYLOAD_SECRET = randomBytes(48).toString('base64url')
await fs.writeFile(path.join(testDir, 'secret'), process.env.PAYLOAD_SECRET, { mode: 0o600 })
process.env.CMS_SERVER_URL = 'http://127.0.0.1:3111'
const { getPayload, restoreVersionOperation, createLocalReq } = await import('payload')
const { default: config } = await import('../src/payload.config')
const { exportSnapshot } = await import('./export')
const { hardeningLocal, hardeningInit, runChild } = await import('./test-hardening')
const payload = await getPayload({ config })
const initialTimeout = await (payload.db as any).client.execute('PRAGMA busy_timeout')
assert.equal(Number(initialTimeout.rows[0].timeout), 5000)
if (production) await payload.db.migrate()
const results: { scenario: string; result: string }[] = []
const ok = (scenario: string) => { results.push({ scenario, result: 'pass' }); console.log(`PASS ${scenario}`) }
const adminPassword = randomBytes(24).toString('base64url')
const admin = await payload.create({ collection: 'users', overrideAccess: true, data: { email: 'admin-test@example.invalid', password: adminPassword, nom: 'Responsable fictif', role: 'admin' } })
await fs.writeFile(path.join(testDir, 'identifiants-locaux.json'), JSON.stringify({ email: admin.email, password: adminPassword }), { mode: 0o600 })
const adminUser = { ...admin, collection: 'users' as const }
let editorPassword = randomBytes(24).toString('base64url')
const editor = await payload.create({ collection: 'users', user: adminUser, overrideAccess: false, data: { email: 'editeur-test@example.invalid', password: editorPassword, nom: 'Éditeur fictif', role: 'editor' } })
const editorUser = { ...editor, collection: 'users' as const }
const create = (collection: any, data: any) => payload.create({ collection, data, overrideAccess: false, user: adminUser }) as Promise<any>
const update = (collection: any, id: any, data: any, draft = false) => payload.update({ collection, id, data, draft, overrideAccess: false, user: adminUser }) as Promise<any>
const snapshot = () => exportSnapshot(payload, path.join(testDir, 'bundle.json'), path.join(testDir, 'public', 'media'))
const richText = (text: string) => ({ root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } })
try {
  const lieu1 = await create('lieux', { slug: 'lieu-fictif-nord', nom: 'Établissement fictif Nord', adresse: '1 rue de démonstration', codePostal: '25000', ville: 'Ville fictive', latitude: 47.24, longitude: 6.02, coordonneesVerifiees: true, _status: 'published' })
  const lieu2 = await create('lieux', { slug: 'lieu-fictif-sud', nom: 'Établissement fictif Sud', adresse: '2 rue de démonstration', codePostal: '25000', ville: 'Ville fictive', latitude: 47.25, longitude: 6.03, coordonneesVerifiees: true, _status: 'published' })
  const pro = await create('professionnels', { slug: 'camille-exemple', prenom: 'Camille', nom: 'Exemple', titreAffiche: 'Dr Camille Exemple (fictif)', profession: 'medecin-generaliste', professionLabel: 'Médecin généraliste', lieux: [lieu1.id], horairesParLieu: [{ lieu: lieu1.id, horaires: 'Lundi 09 h–12 h' }], _status: 'published' })
  await update('professionnels', pro.id, { horairesParLieu: [{ lieu: lieu1.id, horaires: 'Mardi 14 h–18 h' }], _status: 'published' })
  assert.equal((await snapshot()).professionnels[0].horairesParLieu[0].horaires, 'Mardi 14 h–18 h'); ok('A — horaires publiés présents dans le snapshot')
  await update('professionnels', pro.id, { lieux: [lieu2.id], horairesParLieu: [{ lieu: lieu2.id, horaires: 'Mardi 14 h–18 h' }], _status: 'published' })
  let bundle = await snapshot(); assert.deepEqual(bundle.professionnels[0].lieux, ['lieu-fictif-sud']); assert.equal(bundle.professionnels[0].horairesParLieu[0].lieu, 'lieu-fictif-sud'); ok('B — changement de lieu et horaires cohérents')
  await create('professionnels', { slug: 'alex-exemple', prenom: 'Alex', nom: 'Exemple', titreAffiche: 'Alex Exemple (fictif)', profession: 'infirmier', professionLabel: 'Infirmier', lieux: [lieu1.id], _status: 'published' })
  assert.equal((await snapshot()).professionnels.length, 2); ok('C — nouveau professionnel exporté')
  const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64')
  const media = await payload.create({ collection: 'medias', user: adminUser, overrideAccess: false, data: { alt: 'Carré rouge de démonstration' }, file: { data: imageBuffer, mimetype: 'image/png', name: 'prevention-fictive.png', size: imageBuffer.length } })
  const article = await create('actualites', { slug: 'prevention-fictive', titre: 'Prévention fictive', date: '2026-10-09T09:00:00.000Z', resume: 'Contenu de recette synthétique.', categorie: 'Prévention', image: media.id, corps: richText('Texte de prévention entièrement fictif.'), _status: 'draft' })
  assert.equal((await snapshot()).actualites.length, 0)
  await update('actualites', article.id, { _status: 'published' })
  bundle = await snapshot(); assert.equal(bundle.actualites.length, 1); assert.match(bundle.actualites[0].image, /^\/media\/[a-f0-9]{64}\.png$/); assert.match(bundle.actualites[0].bodyHtml, /entièrement fictif/)
  await fs.access(path.join(testDir, 'public', bundle.actualites[0].image)); ok('D — image privée exportée seulement après publication')
  const versions = await payload.findVersions({ collection: 'actualites', where: { parent: { equals: article.id } }, sort: '-updatedAt', overrideAccess: false, user: adminUser })
  const publishedVersion = versions.docs.find((v: any) => v.version._status === 'published')!
  await update('actualites', article.id, { titre: 'Titre modifié fictif', _status: 'published' })
  await payload.restoreVersion({ collection: 'actualites', id: publishedVersion.id, overrideAccess: false, user: adminUser })
  assert.equal((await snapshot()).actualites[0].titre, 'Prévention fictive'); ok('E — version antérieure restaurée par API CMS')
  for (const action of [
    () => payload.find({ collection: 'actualites', draft: true, overrideAccess: false }),
    () => payload.findVersions({ collection: 'actualites', overrideAccess: false }),
    () => payload.findByID({ collection: 'medias', id: media.id, overrideAccess: false }),
    () => payload.create({ collection: 'users', overrideAccess: false, data: { email: 'intrus@example.invalid', password: randomBytes(24).toString('base64url'), nom: 'Intrus', role: 'admin' } }),
    () => payload.update({ collection: 'users', id: editor.id, overrideAccess: false, user: editorUser, data: { role: 'admin' } }),
    () => payload.create({ collection: 'informations', overrideAccess: false, user: editorUser, data: { nom: 'Faux', slug: 'general' } })
  ]) await assert.rejects(action)
  ok('F — API locale: anonymes refusés, versions et médias privés, élévation de rôle refusée')
  await update('actualites', article.id, { titre: 'Brouillon confidentiel fictif', _status: 'draft' }, true)
  assert.equal((await snapshot()).actualites[0].titre, 'Prévention fictive'); ok('Brouillon plus récent ne remplace pas la version publiée')
  await create('actualites', { slug: 'future-fictive', titre: 'Actualité future fictive', date: '2099-01-01T00:00:00.000Z', resume: 'Fictif', debutAffichage: '2099-01-01T00:00:00.000Z', _status: 'published' })
  await create('actualites', { slug: 'archive-fictive', titre: 'Archive fictive', date: '2026-01-01T00:00:00.000Z', resume: 'Fictif', archive: true, _status: 'published' })
  await create('actualites', { slug: 'masquee-fictive', titre: 'Masquée fictive', date: '2026-01-01T00:00:00.000Z', resume: 'Fictif', visible: false, _status: 'published' })
  assert.equal((await snapshot()).actualites.length, 1); ok('Dates, masquage et archivage exclus du snapshot public')
  await assert.rejects(() => update('lieux', lieu2.id, { adresse: '3 rue modifiée fictive', coordonneesVerifiees: true, _status: 'published' }))
  await update('lieux', lieu2.id, { adresse: '3 rue modifiée fictive', _status: 'draft' }, true)
  await update('lieux', lieu2.id, { coordonneesVerifiees: true, _status: 'published' })
  ok('Adresse modifiée: vérification réinitialisée, publication immédiate refusée')
  await assert.rejects(() => create('pages', { slug: 'mentions-legales', titre: 'Mentions fictives', _status: 'published' }))
  const legal = await create('pages', { slug: 'mentions-legales', titre: 'Mentions fictives', validationLegale: true, _status: 'published' })
  await assert.rejects(() => payload.update({ collection: 'pages', id: legal.id, user: editorUser, overrideAccess: false, data: { _status: 'published', validationLegale: true } }))
  await assert.rejects(() => update('pages', legal.id, { titre: 'Mentions changées', validationLegale: true, _status: 'published' }))
  await assert.rejects(() => payload.update({ collection: 'pages', id: legal.id, user: editorUser, overrideAccess: false, data: { titre: 'Contournement sans statut' } }), 'Un éditeur ne peut modifier une page légale publiée en omettant _status')
  await assert.rejects(() => payload.update({ collection: 'pages', id: legal.id, user: editorUser, overrideAccess: false, data: { slug: 'projet-de-sante', titre: 'Déplacement illégitime des mentions' } }), 'Un éditeur ne peut déplacer une page légale vers une rubrique courante')
  await assert.rejects(() => update('pages', legal.id, { titre: 'Texte changé sans statut' }))
  await assert.rejects(() => update('lieux', lieu2.id, { adresse: 'Adresse non revalidée sans statut' }))
  await assert.rejects(() => update('professionnels', pro.id, { horairesParLieu: [{ lieu: lieu1.id, horaires: 'Horaire incohérent' }] }))
  const information = await create('informations', { slug: 'general', nom: 'Informations fictives', email: 'contact@example.invalid', contactsVerifies: true, doctolibUrl: 'https://www.doctolib.fr/', _status: 'published' })
  await assert.rejects(() => update('informations', information.id, { email: 'autre@example.invalid' }))
  await assert.rejects(() => update('informations', information.id, { doctolibUrl: null }))
  const standardPage = await create('pages', { slug: 'projet-de-sante', titre: 'Projet fictif', _status: 'published' })
  await assert.rejects(() => payload.update({ collection: 'pages', id: standardPage.id, user: editorUser, overrideAccess: false, draft: true, data: { slug: 'confidentialite' } }))
  const proposedLegal = await payload.update({ collection: 'pages', id: legal.id, user: editorUser, overrideAccess: false, draft: true, data: { titre: 'Proposition légale privée' } })
  assert.equal(proposedLegal._status, 'draft'); assert.equal(proposedLegal.validationLegale, false)
  assert.equal((await payload.findByID({ collection: 'pages', id: legal.id, draft: false, user: adminUser, overrideAccess: false })).titre, 'Mentions fictives')
  await payload.update({ collection: 'pages', id: legal.id, user: editorUser, overrideAccess: false, draft: true, data: { titre: 'Mentions fictives' } })
  await update('pages', legal.id, { validationLegale: true, _status: 'published' })
  ok('PATCH sans statut — validation légale/adresse/contacts/horaires maintenue; brouillons natifs conservés')
  ok('Identité des rubriques fixe — déplacements légal vers courant et inverse refusés')
  ok('Validation réglementaire: administrateur obligatoire et invalidation après modification')
  await update('actualites', article.id, { _status: 'draft' })
  assert.equal((await snapshot()).actualites.length, 0)
  await update('actualites', article.id, { _status: 'published', titre: 'Prévention fictive' })
  ok('Dépublication enlève le contenu du snapshot')
  await assert.rejects(() => payload.update({ collection: 'medias', id: media.id, overrideAccess: false, user: adminUser, data: { alt: 'Modification sans publication' } }))
  ok('Médias immuables: remplacement ou métadonnées ne contournent pas la publication')
  const oldLegal = (await payload.findVersions({ collection: 'pages', user: adminUser, overrideAccess: false, where: { parent: { equals: legal.id } } })).docs[0]
  await update('pages', legal.id, { titre: 'Nouvelles mentions fictives', _status: 'draft' }, true)
  await restoreVersionOperation({ collection: payload.collections.pages, id: oldLegal.id, draft: true, overrideAccess: false, req: await createLocalReq({ user: adminUser }, payload) })
  const restoredLegal = await payload.findByID({ collection: 'pages', id: legal.id, draft: true, user: adminUser, overrideAccess: false })
  assert.equal(restoredLegal.titre, 'Mentions fictives'); assert.equal(restoredLegal._status, 'draft'); assert.equal(restoredLegal.validationLegale, false)
  const oldPlace = (await payload.findVersions({ collection: 'lieux', user: adminUser, overrideAccess: false, where: { parent: { equals: lieu1.id } } })).docs[0]
  await update('lieux', lieu1.id, { adresse: '9 rue de test fictive', _status: 'draft' }, true)
  await restoreVersionOperation({ collection: payload.collections.lieux, id: oldPlace.id, draft: true, overrideAccess: false, req: await createLocalReq({ user: adminUser }, payload) })
  const restoredPlace = await payload.findByID({ collection: 'lieux', id: lieu1.id, draft: true, user: adminUser, overrideAccess: false })
  assert.equal(restoredPlace.adresse, '1 rue de démonstration'); assert.equal(restoredPlace._status, 'draft'); assert.equal(restoredPlace.coordonneesVerifiees, false)
  ok('E étendu — restauration adresse et mentions en brouillon avec nouvelle validation requise')
  await assert.rejects(() => update('lieux', lieu2.id, { visible: false, _status: 'published' }), /fiche publiée/)
  ok('Relation publiée bloque le masquage avant écriture en base')
  editorPassword = await hardeningLocal(payload, adminUser, editorUser, testDir, ok)
  await hardeningInit(cmsRoot, testDir, ok)
  await snapshot()
  if (process.argv.includes('--http') || production) {
    const serverEnv: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: production ? 'production' : 'development', CMS_TEST_DIST: production ? 'production' : '1', CMS_DIST_DIR: undefined }
    if (production) {
      const build = await runChild(['node_modules/next/dist/bin/next', 'build', '--webpack'], cmsRoot, serverEnv)
      await fs.writeFile(path.join(testDir, 'production-build.log'), build.output)
      assert.equal(build.code, 0, 'Build Next de production isolé doit réussir (log privé dans le test)')
      ok('Production — migration versionnée et next build réel avant next start')
    }
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', production ? 'start' : 'dev', ...production ? [] : ['--webpack'], '--hostname', '127.0.0.1', '--port', '3111'], { cwd: cmsRoot, env: serverEnv, stdio: ['ignore', 'pipe', 'pipe'] })
    const logs: string[] = []
    child.stdout.on('data', b => logs.push(String(b))); child.stderr.on('data', b => logs.push(String(b)))
    const base = 'http://127.0.0.1:3111'
    try {
      let ready = false
      for (let i = 0; i < 90; i++) { try { const r = await fetch(`${base}/admin/login`); if (r.status === 200) { ready = true; break } } catch {} await new Promise(resolve => setTimeout(resolve, 500)) }
      assert.ok(ready, 'Serveur CMS HTTP doit démarrer')
      const anon = ['/api/access', '/api/actualites', `/api/actualites/${article.id}?draft=true`, '/api/actualites/versions', '/api/medias', String(media.url).replace(base, ''), '/api/users']
      for (const url of anon) { const r = await fetch(new URL(url, base)); assert.ok([401, 403, 404].includes(r.status), `Anonyme refusé ${url} (${r.status})`) }
      const preview = await fetch(`${base}/apercu/actualites/${article.id}`, { redirect: 'manual' }); assert.ok([302, 303, 307, 308].includes(preview.status)); assert.match(preview.headers.get('location') || '', /admin\/login/)
      const adminPage = await fetch(`${base}/admin`, { redirect: 'manual' }); if (adminPage.status === 200) { const html = await adminPage.text(); assert.match(html, /admin\/login/); assert.doesNotMatch(html, /Responsable fictif/) } else assert.ok([302, 303, 307, 308].includes(adminPage.status))
      const login = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: admin.email, password: adminPassword }) })
      assert.equal(login.status, 200); const { token } = await login.json() as any
      const authHeaders = { Authorization: `JWT ${token}` }
      assert.equal((await fetch(`${base}/api/access`, { headers: authHeaders })).status, 200)
      const recoveryResults = []
      for (const email of [admin.email, 'absent-http@example.invalid']) {
        const response = await fetch(`${base}/api/users/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email }) })
        recoveryResults.push({ status: response.status, body: await response.text() })
      }
      assert.deepEqual(recoveryResults[0], recoveryResults[1]); assert.equal(recoveryResults[0].status, 200); assert.doesNotMatch(recoveryResults[0].body, /token|resetPasswordToken/)
      const recoveryPage = await fetch(`${base}/admin/forgot`); assert.equal(recoveryPage.status, 200)
      const recoveryHtml = await recoveryPage.text(); assert.match(recoveryHtml, /récupération par courriel est désactivée/); assert.doesNotMatch(recoveryHtml, /<form[ >]|name="email"/)
      const resetPage = await fetch(`${base}/admin/reset/jeton-fictif-de-test`); assert.equal(resetPage.status, 200); assert.match(await resetPage.text(), /récupération par courriel est désactivée/)
      ok('M03 HTTP — récupération existant/absent identique, /api/access privé puis disponible authentifié')
      const draft = await fetch(`${base}/api/actualites/${article.id}?draft=true`, { headers: authHeaders }); assert.equal(draft.status, 200)
      const imageResponse = await fetch(new URL(String(media.url), base), { headers: authHeaders }); assert.equal(imageResponse.status, 200)
      const editScreen = await fetch(`${base}/admin/collections/actualites/${article.id}`, { headers: authHeaders }); assert.equal(editScreen.status, 200); const editHtml = await editScreen.text(); assert.match(editHtml, /Aperçu privé/); assert.match(editHtml, /private-preview-link/)
      const privatePreview = await fetch(`${base}/apercu/actualites/${article.id}`, { headers: authHeaders }); assert.equal(privatePreview.status, 200); assert.match(await privatePreview.text(), /Aperçu privé/)
      const graphql = await fetch(`${base}/api/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '{ Actualites { docs { id } } }' }) }); assert.ok([403, 404].includes(graphql.status))
      const crossOrigin = await fetch(`${base}/api/actualites/${article.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: `payload-token=${token}`, Origin: 'https://hostile.example.invalid' }, body: JSON.stringify({ titre: 'Tentative CSRF fictive' }) }); assert.equal(crossOrigin.status, 403)
      const restoration = await fetch(`${base}/api/pages/versions/${oldLegal.id}?draft=true`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json', Origin: base }, body: '{}' }); assert.equal(restoration.status, 200); assert.equal((await restoration.json() as any)._status, 'draft')
      const hostileUpload = new FormData(); hostileUpload.set('_payload', JSON.stringify({ alt: 'Fichier SVG fictif refusé' })); hostileUpload.set('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'refuse.svg')
      const svgResponse = await fetch(`${base}/api/medias`, { method: 'POST', headers: { ...authHeaders, Origin: base }, body: hostileUpload }); assert.ok([400, 403].includes(svgResponse.status))
      ok('F HTTP — admin redirigé, drafts/versions/médias refusés anonymes; login et aperçu autorisés; GraphQL absent')
      const editorLogin = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: editor.email, password: editorPassword }) }); assert.equal(editorLogin.status, 200)
      const { token: editorToken } = await editorLogin.json() as any
      const editorHeaders = { Authorization: `JWT ${editorToken}`, 'Content-Type': 'application/json', Origin: base }
      const deniedUnlock = await fetch(`${base}/api/users/unlock`, { method: 'POST', headers: editorHeaders, body: JSON.stringify({ email: editor.email }) }); assert.equal(deniedUnlock.status, 403)
      const patch = (collection: string, id: string | number, data: any, headers = { ...authHeaders, 'Content-Type': 'application/json', Origin: base }, query = '') => fetch(`${base}/api/${collection}/${id}${query}`, { method: 'PATCH', headers, body: JSON.stringify(data) })
      const heldTransaction = await (payload.db as any).client.transaction('write')
      try {
        const conflict = await patch('actualites', article.id, { titre: 'Conflit fictif non enregistré', _status: 'published' })
        assert.equal(conflict.status, 409); const message = await conflict.text(); assert.match(message, /réessayer/); assert.doesNotMatch(message, /SQLITE|stack|\/Users\/|cms\.sqlite/)
      } finally { await heldTransaction.rollback() }
      ok('SQLite HTTP — verrou concurrent réel : réponse 409 compréhensible, aucune donnée technique exposée')
      for (const data of [{ _status: 'draft' }, { visible: false, _status: 'published' }, { archive: true, _status: 'published' }, { finAffichage: '2099-01-01T00:00:00Z', _status: 'published' }]) assert.equal((await patch('lieux', lieu2.id, data)).status, 400)
      ok('M02 HTTP — retrait/masquage/archive/période lieu dépendant refusés')
      const selfPassword = randomBytes(24).toString('base64url')
      const ownAccount = await (await fetch(`${base}/api/users/${editor.id}`, { headers: editorHeaders })).json() as any
      const nativeForm = new FormData(); nativeForm.set('_payload', JSON.stringify({ password: selfPassword, 'confirm-password': selfPassword, nom: editor.nom, email: editor.email, role: editor.role, updatedAt: ownAccount.updatedAt, createdAt: ownAccount.createdAt }))
      const ownPassword = await fetch(`${base}/api/users/${editor.id}`, { method: 'PATCH', headers: { Authorization: `JWT ${editorToken}`, Origin: base }, body: nativeForm })
      assert.equal(ownPassword.status, 200)
      assert.equal((await patch('users', editor.id, { password: selfPassword, 'confirm-password': 'confirmation-fictive-differente' }, editorHeaders)).status, 400)
      for (const data of [{ role: 'admin' }, { email: 'interdit@example.invalid' }, { nom: 'Autre' }, { loginAttempts: 0 }, { resetPasswordToken: 'fictif' }]) assert.equal((await patch('users', editor.id, { password: selfPassword, ...data }, editorHeaders)).status, 403)
      assert.equal((await patch('users', admin.id, { password: selfPassword }, editorHeaders)).status, 403)
      const newLogin = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: editor.email, password: selfPassword }) }); assert.equal(newLogin.status, 200)
      const oldLogin = await fetch(`${base}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ email: editor.email, password: editorPassword }) }); assert.equal(oldLogin.status, 401)
      ok('M03 HTTP — mot de passe propre changé, ancien refusé, identité/rôle/champs internes/autre compte refusés')
      // A published legal document with a newer draft must also be protected.
      assert.equal((await patch('pages', legal.id, { titre: 'Modification légale HTTP non validée' }, editorHeaders)).status, 403)
      assert.equal((await patch('pages', legal.id, { slug: 'contact' }, editorHeaders)).status, 400)
      assert.equal((await patch('pages', standardPage.id, { slug: 'confidentialite' }, editorHeaders, '?draft=true')).status, 400)
      assert.equal((await patch('lieux', lieu2.id, { adresse: 'Adresse HTTP non validée' })).status, 400)
      assert.equal((await patch('informations', information.id, { email: 'http@example.invalid' })).status, 400)
      assert.equal((await patch('professionnels', pro.id, { horairesParLieu: [{ lieu: lieu1.id, horaires: 'Incohérence HTTP' }] })).status, 400)
      assert.equal((await patch('pages', legal.id, { _status: 'draft' }, editorHeaders)).status, 403)
      assert.equal((await patch('pages', legal.id, { _status: 'published' }, editorHeaders, '?draft=true')).status, 403)
      const editorDraft = await patch('pages', legal.id, { titre: 'Proposition HTTP privée' }, editorHeaders, '?draft=true'); assert.equal(editorDraft.status, 200); const editorDraftResult = await editorDraft.json() as any; assert.equal((editorDraftResult.doc || editorDraftResult)._status, 'draft')
      const legalPublic = await fetch(`${base}/api/pages/${legal.id}?draft=false`, { headers: authHeaders }); assert.equal((await legalPublic.json() as any).titre, 'Mentions fictives')
      ok('HTTP PATCH sans statut — validations serveur et routes fixes, proposition éditoriale privée sans altérer le publié')
      ok('HTTP renforcé — CSRF cookie refusé, upload SVG refusé, restauration légale en brouillon réussie')
    } finally { child.kill('SIGTERM'); await new Promise(resolve => setTimeout(resolve, 500)); await fs.writeFile(path.join(testDir, 'http-server.log'), logs.join('')) }
  }
  const report = { at: new Date().toISOString(), mode: production ? 'production-build-start' : process.argv.includes('--http') ? 'development-http' : 'local', data: 'synthetic-only', testDir, snapshot: path.join(testDir, 'bundle.json'), results }
  await fs.writeFile(path.join(cmsRoot, '.local', 'last-test-report.json'), JSON.stringify(report, null, 2))
  console.log(`${results.length} scénarios réussis. Rapport local : cms/.local/last-test-report.json`)
} finally { await payload.destroy() }
