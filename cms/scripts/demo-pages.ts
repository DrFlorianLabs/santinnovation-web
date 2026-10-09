import type { Payload } from 'payload'
const pages = [
  ['accueil', 'Accueil'], ['projet-de-sante', 'Projet de santé'], ['soins-et-parcours', 'Soins et parcours'],
  ['recherche-innovation', 'Recherche et innovation'], ['rejoindre', 'Rejoindre la MSP'],
  ['informations-pratiques', 'Informations pratiques'], ['contact', 'Contact'], ['equipe', 'Équipe'],
  ['lieux', 'Établissements'], ['prendre-rendez-vous', 'Prendre rendez-vous'],
  ['mentions-legales', 'Mentions légales'], ['confidentialite', 'Confidentialité'], ['accessibilite', 'Accessibilité']
]
export async function completeDemoPages(payload: Payload) {
  const info = await payload.find({ collection: 'informations', where: { and: [{ slug: { equals: 'general' } }, { nom: { equals: 'MSP de démonstration — fictive' } }] }, overrideAccess: true, limit: 1 })
  if (!info.docs.length) throw new Error('Complément de fixtures refusé : la base ne correspond pas à la démonstration synthétique attendue.')
  const admin = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, overrideAccess: true, limit: 1 })).docs[0]
  if (!admin) throw new Error('Administrateur introuvable pour les fixtures.')
  let added = 0
  for (const [slug, label] of pages) {
    if ((await payload.count({ collection: 'pages', where: { slug: { equals: slug } }, overrideAccess: true })).totalDocs) continue
    const text = `${label} : contenu entièrement fictif de recette locale. Aucune information réelle ou réglementaire validée pour la production.`
    await payload.create({ collection: 'pages', user: { ...admin, collection: 'users' }, overrideAccess: false, data: {
      slug: slug as any, titre: `${label} — démonstration fictive`, resume: 'Texte synthétique pour vérifier l’administration de cette rubrique.',
      validationLegale: ['mentions-legales', 'confidentialite', 'accessibilite'].includes(slug),
      corps: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } },
      _status: 'published'
    } })
    added++
  }
  return added
}
