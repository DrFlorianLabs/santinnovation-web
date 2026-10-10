/** Local, explicitly synthetic demo fixture. Never imports institutional data. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { completeDemoPages } from './demo-pages'
import { dataDir } from '../src/lib/runtime'
const payload = await getPayload({ config })
const rich = (text: string) => ({ root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } })
try {
  if ((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs === 0) throw new Error('Exécuter npm run init avant les fixtures.')
  const marker = path.join(dataDir, 'demo-seeded.json')
  let seeded = false
  try { await fs.access(marker); seeded = true } catch {}
  if (seeded) { const added = await completeDemoPages(payload); console.log(`Fixtures existantes conservées ; ${added} rubrique(s) synthétique(s) manquante(s) ajoutée(s).`); await payload.destroy(); process.exit(0) }
  for (const collection of ['professionnels', 'lieux', 'actualites', 'activites', 'innovations', 'partenaires', 'pages', 'informations'] as const) {
    if ((await payload.count({ collection, overrideAccess: true })).totalDocs) throw new Error('La base contient déjà des contenus. Fixtures refusées pour préserver les données existantes.')
  }
  const admin = (await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1, overrideAccess: true })).docs[0]
  if (!admin) throw new Error('Un administrateur doit exister avant initialisation des fixtures.')
  const user = { ...admin, collection: 'users' as const }
  const create = (collection: any, data: any) => payload.create({ collection, data, user, overrideAccess: false }) as Promise<any>
  const nord = await create('lieux', { slug: 'etablissement-fictif-nord', nom: 'Établissement fictif Nord', adresse: '1 avenue de démonstration', codePostal: '25000', ville: 'Ville fictive', secteur: 'Secteur de test Nord', latitude: 47.24, longitude: 6.02, coordonneesVerifiees: true, horaires: 'Lundi au vendredi : 9 h–18 h (démonstration)', infosPratiques: 'Lieu fictif réservé à la recette locale.', accessibilite: 'Information d’accessibilité fictive.', _status: 'published' })
  const sud = await create('lieux', { slug: 'etablissement-fictif-sud', nom: 'Établissement fictif Sud', adresse: '2 avenue de démonstration', codePostal: '25000', ville: 'Ville fictive', secteur: 'Secteur de test Sud', latitude: 47.25, longitude: 6.03, coordonneesVerifiees: true, horaires: 'Lundi au vendredi : 8 h–17 h (démonstration)', _status: 'published' })
  await create('professionnels', { slug: 'camille-exemple', prenom: 'Camille', nom: 'Exemple', titreAffiche: 'Dr Camille Exemple — fictif', profession: 'medecin-generaliste', professionLabel: 'Médecin généraliste', lieux: [nord.id, sud.id], horairesParLieu: [{ lieu: nord.id, horaires: 'Lundi 9 h–12 h' }, { lieu: sud.id, horaires: 'Mardi 14 h–18 h' }], domaines: [{ libelle: 'Prévention (exemple)' }], email: 'camille@example.invalid', corps: rich('Professionnel fictif utilisé pour les tests de publication.'), _status: 'published' })
  await create('professionnels', { slug: 'alex-exemple', prenom: 'Alex', nom: 'Exemple', titreAffiche: 'Alex Exemple — fictif', profession: 'infirmier', professionLabel: 'Infirmier', domaines: [{ libelle: 'Éducation thérapeutique (exemple)' }], activites: [{ libelle: 'Coordination' }], lieux: [nord.id], horairesParLieu: [{ lieu: nord.id, horaires: 'Mercredi 10 h–16 h' }], corps: rich('Seconde fiche fictive de recette.'), _status: 'published' })
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64')
  const image = await payload.create({ collection: 'medias', data: { alt: 'Carré rouge synthétique pour la recette' }, file: { data: buffer, mimetype: 'image/png', name: 'image-fictive.png', size: buffer.length }, user, overrideAccess: false })
  await create('actualites', { slug: 'prevention-fictive', titre: 'Campagne de prévention — exemple fictif', date: '2026-10-09T08:00:00.000Z', resume: 'Actualité fictive utilisée pour vérifier la publication locale.', categorie: 'Prévention', image: image.id, debutEvenement: '2026-12-01T09:00:00.000Z', finEvenement: '2026-12-01T11:00:00.000Z', corps: rich('Cette campagne est fictive. Aucune information médicale ou action réelle n’est annoncée.'), _status: 'published' })
  await create('actualites', { slug: 'brouillon-confidentiel-fictif', titre: 'DRAFT_NEVER_PUBLIC', date: '2026-10-09T08:00:00.000Z', resume: 'DRAFT_NEVER_PUBLIC — contrôle de confidentialité', corps: rich('DRAFT_NEVER_PUBLIC'), _status: 'draft' })
  await create('activites', { slug: 'service-fictif', titre: 'Service fictif de démonstration', resume: 'Exemple de présentation administrable.', corps: rich('Contenu synthétique de recette.'), _status: 'published' })
  await create('innovations', { slug: 'innovation-fictive', titre: 'Projet de recherche fictif', resume: 'Exemple de projet administrable.', corps: rich('Projet fictif, sans participant ni donnée de santé.'), _status: 'published' })
  await create('partenaires', { slug: 'partenaire-fictif', nom: 'Partenaire fictif de recette', description: 'Organisation fictive pour vérifier le rendu.', url: 'https://example.org/', _status: 'published' })
  await create('pages', { slug: 'projet-de-sante', titre: 'Projet de santé — contenu fictif', resume: 'Présentation synthétique administrable.', corps: rich('Texte de démonstration locale du projet de santé.'), _status: 'published' })
  await create('pages', { slug: 'mentions-legales', titre: 'Mentions de recette fictives', validationLegale: true, corps: rich('Mentions fictives de recette. Aucun contenu légal réel validé.'), _status: 'published' })
  await create('informations', { slug: 'general', nom: 'MSP de démonstration — fictive', nomCourt: 'MSP fictive', doctolibUrl: 'https://www.doctolib.fr/', baseline: 'Préproduction synthétique locale', description: 'Site de test exclusivement fictif.', ville: 'Ville fictive', secteurs: [{ libelle: 'Secteur fictif' }], email: 'contact@example.invalid', contact: { general: 'contact@example.invalid', secretariat: 'secretariat@example.invalid', coordination: 'coordination@example.invalid' }, contactsVerifies: true, corps: rich('Informations générales fictives.'), _status: 'published' })
  await completeDemoPages(payload)
  await fs.writeFile(marker, JSON.stringify({ createdAt: new Date().toISOString(), synthetic: true }), { mode: 0o600 })
  console.log('Fixtures synthétiques créées. Aucun contenu réel. Publication Internet non effectuée.')
} finally { await payload.destroy() }
