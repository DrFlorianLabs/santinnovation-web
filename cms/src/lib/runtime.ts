import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const dataDir = process.env.CMS_DATA_DIR || path.join(cmsRoot, '.local')
export const mediaDir = path.join(dataDir, 'media')
export function getSecret(): string {
  const secret = process.env.PAYLOAD_SECRET || (fs.existsSync(path.join(dataDir, 'secret')) ? fs.readFileSync(path.join(dataDir, 'secret'), 'utf8').trim() : '')
  if (secret.length < 32) throw new Error('Secret CMS absent ou trop court. Exécuter npm run init (local) ou configurer PAYLOAD_SECRET (serveur).')
  return secret
}
