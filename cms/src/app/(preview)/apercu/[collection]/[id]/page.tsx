import config from '@payload-config'
import { getPayload, type CollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { contentCollections } from '../../../../../collections'
export const dynamic = 'force-dynamic'
export default async function Preview({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !['admin', 'editor'].includes(String(user.role))) redirect('/admin/login')
  const { collection, id } = await params
  if (!contentCollections.some(c => c.slug === collection)) notFound()
  const doc = await payload.findByID({ collection: collection as CollectionSlug, id, draft: true, depth: 2, user, overrideAccess: false }).catch(() => null) as any
  if (!doc) notFound()
  const picture = doc.image || doc.photo || doc.logo
  return <main style={{ maxWidth: 850, margin: 'auto', padding: '24px' }}>
    <aside style={{ background: '#e3edff', padding: 16, borderRadius: 12 }}>Aperçu privé du dernier enregistrement — {doc._status === 'published' ? 'version publiée' : 'brouillon'}. Cette page n’est pas le site public. <a href={`/admin/collections/${collection}/${id}`}>Revenir à la fiche</a></aside>
    <article style={{ background: 'white', marginTop: 24, padding: 32, borderRadius: 16 }}>
      <h1>{doc.titre || doc.titreAffiche || doc.nom}</h1>
      {picture?.url && <img src={picture.url} alt={picture.alt || ''} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />}
      {doc.resume && <p>{doc.resume}</p>}{doc.description && <p>{doc.description}</p>}
      {doc.professionLabel && <p>{doc.professionLabel}</p>}
      {doc.adresse && <p>{doc.adresse} {doc.codePostal} {doc.ville}</p>}
      {doc.horaires && <p style={{ whiteSpace: 'pre-line' }}>{doc.horaires}</p>}
      {doc.lieux?.length > 0 && <ul>{doc.lieux.map((l: any) => <li key={l.id}>{l.nom} — {l.adresse}, {l.ville}</li>)}</ul>}
      {doc.horairesParLieu?.map((h: any, i: number) => <p key={i}><strong>{h.lieu?.nom} : </strong>{h.horaires}</p>)}
      {doc.corps && <RichText data={doc.corps} />}
      {doc.debutEvenement && <p>Événement : {new Date(doc.debutEvenement).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}{doc.finEvenement ? ` au ${new Date(doc.finEvenement).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}` : ''}</p>}
      <p>Affichage : {doc.visible ? 'visible' : 'masqué'}{doc.archive ? ' — archivé' : ''}</p>
    </article>
  </main>
}
