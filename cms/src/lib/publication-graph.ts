import { APIError, type CollectionBeforeChangeHook } from 'payload'

type Document = Record<string, any>
export type PublicationProblem = {
  code: 'LOCATION_UNAVAILABLE' | 'PUBLICATION_INTERVAL_INVALID' | 'LOCATION_REFERENCED'
  collection: 'professionnels' | 'lieux'
  slug: string
  message: string
}
export const relationID = (value: any): string => String(value && typeof value === 'object' ? value.id : value)
const start = (doc: Document) => doc.debutAffichage ? Date.parse(doc.debutAffichage) : -Infinity
const end = (doc: Document) => doc.finAffichage ? Date.parse(doc.finAffichage) : Infinity
const publicState = (doc?: Document) => doc?._status === 'published' && doc.visible === true && doc.archive !== true
const safeSlug = (doc: Document) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.slug) ? doc.slug : ''

/** Published promises from now onwards, including future scheduled contents.
 * Expired professionals no longer constrain a place. Draft versions never do.
 */
export function dependencyProblem(pro: Document, places: Map<string, Document>, now = Date.now()): PublicationProblem | undefined {
  if (!publicState(pro) || end(pro) <= now) return
  const selected = new Set((pro.lieux || []).map(relationID))
  const references = new Set([...selected, ...(pro.horairesParLieu || []).map((h: Document) => relationID(h.lieu))])
  for (const id of references) {
    const place = places.get(String(id))
    if (!selected.has(id) || !publicState(place)) return { code: 'LOCATION_UNAVAILABLE', collection: 'professionnels', slug: safeSlug(pro), message: 'Un lieu lié doit être publié, visible et non archivé. Corriger les lieux et les horaires de cette fiche.' }
    if (start(place!) > Math.max(now, start(pro)) || end(place!) < end(pro)) return { code: 'PUBLICATION_INTERVAL_INVALID', collection: 'professionnels', slug: safeSlug(pro), message: 'La période d’affichage du professionnel doit être entièrement couverte par celle de chaque lieu lié.' }
  }
}

export class PublicationGraphError extends Error {
  constructor(readonly problem: PublicationProblem) { super(problem.message); this.name = 'PublicationGraphError' }
}

// Native saves with draft=true only modify version history. An explicit
// published status wins over draft=true in Payload, so it must still be checked.
const savesOnlyDraft = (data: Document, req: any) => req.context.cmsSavingDraft && data._status !== 'published'
export const guardProfessional: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (savesOnlyDraft(data, req)) return data
  const professional = { ...originalDoc, ...data }
  if (!publicState(professional)) return data
  const result = await req.payload.find({ collection: 'lieux', draft: false, depth: 0, pagination: false, overrideAccess: true, req })
  const problem = dependencyProblem(professional, new Map(result.docs.map(doc => [String(doc.id), doc])))
  if (problem) throw new APIError(problem.message, 400)
  return data
}

export const guardPlace: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!originalDoc?.id || savesOnlyDraft(data, req)) return data
  // originalDoc can be the newest private draft. The query must inspect the
  // base published table (draft:false), in the same SQLite transaction as write.
  const result = await req.payload.find({ collection: 'professionnels', draft: false, depth: 0, pagination: false, overrideAccess: true, req, where: { and: [{ _status: { equals: 'published' } }, { visible: { equals: true } }, { archive: { not_equals: true } }] } })
  const candidate = { ...originalDoc, ...data }
  const id = String(originalDoc.id)
  const now = Date.now()
  for (const pro of result.docs as Document[]) {
    if (!(pro.lieux || []).some((value: any) => relationID(value) === id) && !(pro.horairesParLieu || []).some((h: Document) => relationID(h.lieu) === id)) continue
    // Check only this place: other dependencies are checked when publishing the
    // professional and when exporting the entire graph.
    const dependent = { ...pro, lieux: [id], horairesParLieu: [] }
    if (dependencyProblem(dependent, new Map([[id, candidate]]), now)) throw new APIError(`Ce lieu reste nécessaire à la fiche publiée « ${safeSlug(pro)} ». Retirer d’abord ce lieu des professionnels publiés, ou adapter leur période d’affichage, puis publier ces changements. Les brouillons restent possibles.`, 400)
  }
  return data
}
