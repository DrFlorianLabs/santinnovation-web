import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { getPayload, type Payload, type CollectionSlug } from 'payload'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import config from '../src/payload.config'
import { mediaDir } from '../src/lib/runtime'

export const slugs = ['professionnels', 'lieux', 'actualites', 'activites', 'innovations', 'partenaires', 'pages', 'informations'] as const
export function publishable(doc: any, now = Date.now()): boolean {
  return doc._status === 'published' && doc.visible === true && doc.archive !== true && (!doc.debutAffichage || Date.parse(doc.debutAffichage) <= now) && (!doc.finAffichage || Date.parse(doc.finAffichage) > now)
}
/** Deliberately local-only. No browser, token or endpoint can invoke this export. */
export async function exportSnapshot(payload: Payload, destination: string, images: string) {
  const now = Date.now()
  const raw: Record<string, any[]> = {}
  for (const slug of slugs) {
    const result = await payload.find({ collection: slug as CollectionSlug, draft: false, depth: 0, pagination: false, overrideAccess: true, where: { and: [{ _status: { equals: 'published' } }, { visible: { equals: true } }, { archive: { not_equals: true } }] }, sort: 'ordre' })
    raw[slug] = result.docs.filter(doc => publishable(doc, now))
  }
  // Relationship resolution only uses the above published snapshot. Draft/hidden
  // linked documents never enter the bundle through Payload depth population.
  const lookup = (slug: string, id: any) => raw[slug].find(d => String(d.id) === String(typeof id === 'object' ? id.id : id))
  await fs.mkdir(images, { recursive: true })
  const mediaCache = new Map<string, { url: string; alt: string; credit: string }>()
  async function image(id: any): Promise<{ url: string; alt: string; credit: string } | undefined> {
    if (!id) return undefined
    const key = String(typeof id === 'object' ? id.id : id)
    if (mediaCache.has(key)) return mediaCache.get(key)
    const doc = await payload.findByID({ collection: 'medias', id: key, overrideAccess: true }) as any
    const ext = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' } as Record<string, string>)[doc.mimeType]
    if (!ext || !doc.filename || path.basename(doc.filename) !== doc.filename) throw new Error('Média non admissible pour export public.')
    const buffer = await fs.readFile(path.join(mediaDir, doc.filename))
    const filename = `${createHash('sha256').update(buffer).digest('hex')}${ext}`
    await fs.writeFile(path.join(images, filename), buffer)
    const target = { url: `/media/${filename}`, alt: String(doc.alt || ''), credit: String(doc.credit || '') }; mediaCache.set(key, target); return target
  }
  const bundle: Record<string, any[]> = {}
  for (const slug of slugs) {
    bundle[slug] = []
    for (const source of raw[slug]) {
      const doc = { ...source }
      for (const key of ['photo', 'image', 'logo']) if (doc[key]) { const media = await image(doc[key]); doc[key] = media?.url; doc[`${key}Alt`] = media?.alt; doc[`${key}Credit`] = media?.credit }
      if (doc.photos) doc.photos = await Promise.all(doc.photos.map(async (p: any) => { const media = await image(p.image); return { ...p, image: media?.url, imageAlt: media?.alt, imageCredit: media?.credit } }))
      if (slug === 'professionnels') {
        doc.lieux = (doc.lieux || []).map((id: any) => { const l = lookup('lieux', id); if (!l) throw new Error(`Lieu non publiable référencé par professionnel ${doc.slug}. Corriger ou masquer la fiche avant génération.`); return l.slug })
        doc.horairesParLieu = (doc.horairesParLieu || []).flatMap((h: any) => { const l = lookup('lieux', h.lieu); if (!l) throw new Error(`Horaires liés à un lieu non publiable pour ${doc.slug}.`); return [{ lieu: l.slug, horaires: h.horaires }] })
      }
      // Rich text supports standard formatting only; no relationship/upload blocks.
      doc.bodyHtml = doc.corps ? convertLexicalToHTML({ data: doc.corps, disableContainer: true, disableIndent: true, disableTextAlign: true }) : ''
      delete doc.corps
      bundle[slug].push(doc)
    }
  }
  await fs.mkdir(path.dirname(destination), { recursive: true })
  const tmp = `${destination}.tmp-${process.pid}`
  await fs.writeFile(tmp, JSON.stringify(bundle, null, 2))
  await fs.rename(tmp, destination)
  return bundle
}
if (process.argv[1]?.endsWith('export.ts')) {
  const [destination, images] = process.argv.slice(2)
  if (!destination || !images) throw new Error('Usage: npm run export -- /chemin/contenus.json /chemin/public/media')
  const payload = await getPayload({ config })
  const bundle = await exportSnapshot(payload, path.resolve(destination), path.resolve(images))
  console.log(JSON.stringify({ exported: Object.fromEntries(Object.entries(bundle).map(([key, docs]) => [key, docs.length])) }))
  await payload.destroy()
}
