import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { dataDir } from '../src/lib/runtime'
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
const secretPath = path.join(dataDir, 'secret')
if (!process.env.PAYLOAD_SECRET && !fs.existsSync(secretPath)) fs.writeFileSync(secretPath, randomBytes(48).toString('base64url'), { mode: 0o600 })
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const count = await payload.count({ collection: 'users', overrideAccess: true })
if (!count.totalDocs) {
  const email = 'administration@example.invalid'
  const password = randomBytes(24).toString('base64url')
  await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, nom: 'Administration locale de démonstration', role: 'admin' } })
  fs.writeFileSync(path.join(dataDir, 'identifiants-locaux.json'), JSON.stringify({ email, password }, null, 2), { mode: 0o600 })
  console.log('Compte local créé. Identifiants dans .local/identifiants-locaux.json (privé, non versionné).')
} else console.log('Comptes existants conservés; aucun mot de passe modifié.')
console.log('CMS initialisé. Aucun contenu réel importé. Les fixtures fictives sont créées seulement par npm test.')
await payload.destroy()
