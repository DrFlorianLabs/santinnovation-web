import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { dataDir } from '../src/lib/runtime'
const production = process.env.NODE_ENV === 'production'
if (production && (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.CMS_INIT_ADMIN_EMAIL || '') || (process.env.CMS_INIT_ADMIN_PASSWORD || '').length < 20)) {
  console.error('Initialisation refusée : fournir PAYLOAD_SECRET (32 caractères minimum), CMS_INIT_ADMIN_EMAIL et CMS_INIT_ADMIN_PASSWORD (20 caractères minimum) par environnement privé. Appliquer les migrations avant l’initialisation.')
  process.exit(1)
}
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
const secretPath = path.join(dataDir, 'secret')
if (!production && !process.env.PAYLOAD_SECRET && !fs.existsSync(secretPath)) fs.writeFileSync(secretPath, randomBytes(48).toString('base64url'), { mode: 0o600 })
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
try {
  const count = await payload.count({ collection: 'users', overrideAccess: true })
  if (!count.totalDocs) {
    const email = production ? process.env.CMS_INIT_ADMIN_EMAIL! : 'administration@example.invalid'
    const password = production ? process.env.CMS_INIT_ADMIN_PASSWORD! : randomBytes(24).toString('base64url')
    await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, nom: production ? process.env.CMS_INIT_ADMIN_NAME || 'Administration' : 'Administration locale de démonstration', role: 'admin' } })
    if (!production) {
      fs.writeFileSync(path.join(dataDir, 'identifiants-locaux.json'), JSON.stringify({ email, password }, null, 2), { mode: 0o600 })
      console.log('Compte local créé. Identifiants dans .local/identifiants-locaux.json (privé, non versionné).')
    } else console.log('Compte administrateur initial créé. Aucun fichier d’identifiants écrit. Retirer les variables CMS_INIT_ADMIN_* après cette opération.')
  } else console.log('Comptes existants conservés; aucun mot de passe modifié.')
  console.log('CMS initialisé. Aucun contenu importé.')
} finally { await payload.destroy() }
