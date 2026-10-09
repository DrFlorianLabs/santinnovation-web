/** Local restoration proof. Never exposed as an HTTP endpoint. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { exportSnapshot } from './export'

const [output, snapshot] = process.argv.slice(2)
if (!output || !snapshot || !Number.isFinite(Date.parse(snapshot))) throw new Error('Chemin privé et instant de projection requis.')
const payload = await getPayload({ config })
try {
  const media = path.join(path.dirname(output), 'projection-media')
  const bundle = await exportSnapshot(payload, output, media, Date.parse(snapshot))
  // Object key order is canonicalized by the backup runner, not by Payload.
  await fs.writeFile(output, JSON.stringify(bundle), { mode: 0o600 })
} finally { await payload.destroy() }
