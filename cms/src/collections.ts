import { APIError, type CollectionConfig, type Field } from 'payload'
import { admin, adminField, contentAccess, staff } from './lib/access'
import { mediaDir } from './lib/runtime'

const text = (name: string, label: string, required = false): Field => ({ name, label, type: 'text', required })
const date = (name: string, label: string): Field => ({ name, label, type: 'date', admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } } })
const photo = (name = 'image', label = 'Image'): Field => ({ name, label, type: 'upload', relationTo: 'medias' })
const email = (name: string, label: string): Field => ({ name, label, type: 'email' })
const list = (name: string, label: string): Field => ({ name, label, type: 'array', fields: [text('libelle', 'Libellé', true)] })
const url = (name: string, label: string, domains?: string[]): Field => ({ name, label, type: 'text', validate: (value: unknown) => {
  if (!value) return true
  try { const u = new URL(String(value)); return u.protocol === 'https:' && !u.username && !u.password && (!domains || domains.includes(u.hostname)) || 'Utiliser une adresse HTTPS autorisée.' } catch { return 'Adresse web invalide.' }
} })
const links: Field = { name: 'liens', label: 'Liens externes', type: 'array', fields: [text('libelle', 'Libellé', true), url('url', 'Adresse HTTPS')] }
const common: Field[] = [
  { ...text('slug', 'Identifiant dans l’adresse du site', true), unique: true, validate: (v: unknown) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(v)) || 'Minuscules, chiffres et tirets uniquement.' } as Field,
  { name: 'visible', label: 'Visible sur le site', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  { name: 'archive', label: 'Archiver (masquer et conserver)', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  { name: 'ordre', label: 'Ordre d’affichage', type: 'number', defaultValue: 99, admin: { position: 'sidebar' } },
  date('debutAffichage', 'Début d’affichage (facultatif)'), date('finAffichage', 'Fin d’affichage (facultative)'),
  { name: 'corps', label: 'Présentation / contenu', type: 'richText' }
]
const sharedHooks: CollectionConfig['hooks'] = {
  beforeOperation: [({ args, operation, req }) => {
    if (['create', 'update'].includes(operation)) {
      const submitted = (args as { data?: Record<string, unknown> }).data
      req.context.cmsStatusExplicit = typeof submitted?._status === 'string'
    }
    if (['create', 'update', 'restoreVersion'].includes(operation)) req.context.cmsSavingDraft = Boolean((args as { draft?: boolean }).draft)
    if (operation === 'restoreVersion') req.context.cmsRestoringDraft = Boolean(args.draft)
    return args
  }],
  beforeChange: [({ data, originalDoc, req }) => {
    const dates = { ...originalDoc, ...data }
    if (req.context.isRestoringVersion && req.context.cmsRestoringDraft) data._status = 'draft'
    // Explicit fallback: never base publication checks solely on presence of _status
    // in a client PATCH. Native draft writes remain drafts; explicit publication wins.
    data._status ??= req.context.cmsSavingDraft ? 'draft' : (originalDoc?._status ?? 'draft')
    if (dates.debutAffichage && dates.finAffichage && new Date(dates.debutAffichage) >= new Date(dates.finAffichage)) throw new APIError('La fin d’affichage doit être postérieure au début.', 400)
    if (dates.debutEvenement && dates.finEvenement && new Date(dates.debutEvenement) > new Date(dates.finEvenement)) throw new APIError('La fin de l’événement doit être postérieure au début.', 400)
    return data
  }]
}
function collection(slug: string, singular: string, plural: string, title: string, fields: Field[]): CollectionConfig {
  return {
    slug, labels: { singular, plural }, access: contentAccess,
    admin: { components: { edit: { beforeDocumentControls: [{ path: '/components/PrivatePreview#default', serverProps: { collectionSlug: slug } }] } }, useAsTitle: title, group: 'Contenus du site', defaultColumns: [title, '_status', 'visible', 'updatedAt'],
      description: 'Contenu public uniquement. Ne jamais saisir de donnée patient. Publier déclenche la prochaine génération locale du site.',
      preview: (doc) => `${process.env.CMS_SERVER_URL || 'http://127.0.0.1:3001'}/apercu/${slug}/${doc.id}` },
    versions: { drafts: { autosave: false }, maxPerDoc: 50 },
    hooks: sharedHooks,
    fields: [...fields, ...common]
  }
}
export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: 'Compte autorisé', plural: 'Accès administrateurs' },
  admin: { useAsTitle: 'email', group: 'Administration' },
  auth: { tokenExpiration: 7200, maxLoginAttempts: 5, lockTime: 900000, cookies: { sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' } },
  access: { admin: ({ req }) => ['admin', 'editor'].includes(String(req.user?.role)), create: admin, update: admin, delete: admin, read: ({ req }) => req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false },
  fields: [text('nom', 'Nom affiché', true), { name: 'role', label: 'Rôle', type: 'select', required: true, defaultValue: 'editor', saveToJWT: true, options: [{ label: 'Administrateur', value: 'admin' }, { label: 'Éditeur', value: 'editor' }], access: { create: adminField, update: adminField } }]
}
export const Media: CollectionConfig = {
  slug: 'medias', labels: { singular: 'Image', plural: 'Images privées' },
  admin: { useAsTitle: 'alt', group: 'Contenus du site', description: 'Images publiques destinées au site seulement. Les fichiers restent privés dans ce serveur et seuls ceux utilisés dans un contenu publié sont exportés. Une image est immuable : créer un nouveau fichier, le choisir dans un brouillon puis publier.' },
  access: { read: staff, create: staff, update: () => false, delete: () => false },
  upload: { staticDir: mediaDir, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], imageSizes: [], focalPoint: false },
  fields: [text('alt', 'Description pour les personnes malvoyantes', true), text('credit', 'Crédit / droits de diffusion')]
}
export const Lieux = collection('lieux', 'Établissement', 'Établissements', 'nom', [
  text('nom', 'Nom', true), text('adresse', 'Adresse', true), text('codePostal', 'Code postal', true), text('ville', 'Ville', true),
  text('secteur', 'Quartier'), text('telephone', 'Téléphone professionnel'), email('email', 'Adresse électronique professionnelle'),
  { name: 'horaires', label: 'Horaires d’ouverture', type: 'textarea' }, { name: 'infosPratiques', label: 'Informations pratiques', type: 'textarea' },
  text('accesTransport', 'Transports en commun'), { name: 'accesPMR', label: 'Accès adapté aux personnes à mobilité réduite', type: 'checkbox' },
  { name: 'accessibilite', label: 'Précisions d’accessibilité', type: 'textarea' },
  { name: 'latitude', label: 'Latitude vérifiée', type: 'number', min: -90, max: 90 }, { name: 'longitude', label: 'Longitude vérifiée', type: 'number', min: -180, max: 180 },
  { name: 'coordonneesVerifiees', label: 'Adresse et position géographique vérifiées', type: 'checkbox', defaultValue: false, admin: { description: 'Obligatoire avant publication. Toute modification de l’adresse ou de la position impose une nouvelle confirmation.' } },
  url('itineraireUrl', 'Lien d’itinéraire', ['www.google.com', 'maps.google.com', 'www.openstreetmap.org']), photo('photo', 'Photo principale'),
  { name: 'photos', label: 'Autres photographies', type: 'array', fields: [photo(), text('legende', 'Légende')] }
])
Lieux.hooks = { ...sharedHooks, beforeChange: [...(sharedHooks.beforeChange || []), ({ data, originalDoc, req }) => {
  if (!req.context.isRestoringVersion && !req.context.cmsSavingDraft && req.context.cmsStatusExplicit === false) throw new APIError('Choisir explicitement Enregistrer un brouillon ou Publier pour modifier cette fiche.', 400)
  const merged = { ...originalDoc, ...data }
  if (originalDoc?.id && ['adresse', 'codePostal', 'ville', 'latitude', 'longitude'].some(key => key in data && data[key] !== originalDoc[key])) data.coordonneesVerifiees = false
  if (data._status === 'published' && (!(data.coordonneesVerifiees ?? merged.coordonneesVerifiees) || merged.latitude == null || merged.longitude == null)) throw new APIError('Vérifier l’adresse et la position, enregistrer le brouillon, puis confirmer la vérification avant publication.', 400)
  return data
}] }
export const Professionnels = collection('professionnels', 'Professionnel', 'Professionnels', 'titreAffiche', [
  text('prenom', 'Prénom', true), text('nom', 'Nom', true), text('titreAffiche', 'Nom complet affiché', true),
  { name: 'profession', label: 'Profession (filtre annuaire)', type: 'select', required: true, options: [
    { value: 'medecin-generaliste', label: 'Médecin généraliste' }, { value: 'infirmier', label: 'Infirmier' }, { value: 'kinesitherapeute', label: 'Kinésithérapeute' }, { value: 'pharmacien', label: 'Pharmacien' }, { value: 'coordination', label: 'Coordination' }, { value: 'autre', label: 'Autre' }, { value: 'a-confirmer', label: 'À confirmer' }
  ] }, text('professionLabel', 'Profession affichée', true),
  { name: 'lieux', label: 'Lieux d’exercice', type: 'relationship', relationTo: 'lieux', hasMany: true },
  { name: 'horairesParLieu', label: 'Horaires par établissement', type: 'array', fields: [{ name: 'lieu', label: 'Établissement', type: 'relationship', relationTo: 'lieux', required: true }, { name: 'horaires', label: 'Horaires de consultation', type: 'textarea', required: true }] },
  list('domaines', 'Compétences'), list('activites', 'Activités'), text('telephone', 'Téléphone professionnel'), email('email', 'Adresse électronique professionnelle'),
  url('doctolibUrl', 'Prise de rendez-vous Doctolib', ['www.doctolib.fr', 'doctolib.fr']), photo('photo', 'Photographie'),
  { name: 'accepteNouveauxPatients', label: 'Accepte de nouveaux patients', type: 'checkbox', defaultValue: false },
  { name: 'soinsADomicile', label: 'Soins à domicile', type: 'checkbox', defaultValue: false }
])
Professionnels.hooks = { ...sharedHooks, beforeChange: [...(sharedHooks.beforeChange || []), ({ data, originalDoc, req }) => {
  if (!req.context.isRestoringVersion && !req.context.cmsSavingDraft && req.context.cmsStatusExplicit === false) throw new APIError('Choisir explicitement Enregistrer un brouillon ou Publier pour modifier cette fiche.', 400)
  const merged = { ...originalDoc, ...data }; const id = (x: any) => typeof x === 'object' ? x.id : x
  if (data._status === 'published' && (merged.horairesParLieu || []).some((h: any) => !(merged.lieux || []).some((l: any) => String(id(l)) === String(id(h.lieu))))) throw new APIError('Chaque horaire doit correspondre à un lieu d’exercice sélectionné.', 400)
  return data
}] }
export const Actualites = collection('actualites', 'Actualité', 'Actualités', 'titre', [
  text('titre', 'Titre', true), { ...date('date', 'Date de publication affichée'), required: true } as Field,
  { name: 'resume', label: 'Résumé', type: 'textarea', required: true },
  { name: 'categorie', label: 'Catégorie', type: 'select', required: true, defaultValue: 'Actualité', options: ['Actualité', 'Prévention', 'Santé publique', 'Recherche', 'Événement', 'Vie de la MSP'] },
  photo(), { name: 'epingle', label: 'Mettre en avant', type: 'checkbox', defaultValue: false }, date('debutEvenement', 'Début de l’événement'), date('finEvenement', 'Fin de l’événement')
])
export const Activites = collection('activites', 'Activité', 'Activités et services', 'titre', [text('titre', 'Titre', true), { name: 'resume', label: 'Résumé', type: 'textarea' }, photo(), links])
export const Innovations = collection('innovations', 'Projet', 'Recherche et innovation', 'titre', [text('titre', 'Titre', true), { name: 'resume', label: 'Résumé', type: 'textarea' }, photo(), links])
export const Partenaires = collection('partenaires', 'Partenaire', 'Partenaires', 'nom', [text('nom', 'Nom', true), { name: 'description', label: 'Description', type: 'textarea' }, url('url', 'Site internet'), photo('logo', 'Logo')])
const pageSlugs = ['accueil', 'projet-de-sante', 'soins-et-parcours', 'recherche-innovation', 'rejoindre', 'informations-pratiques', 'contact', 'equipe', 'lieux', 'prendre-rendez-vous', 'mentions-legales', 'confidentialite', 'accessibilite']
export const Pages = collection('pages', 'Rubrique éditoriale', 'Rubriques et mentions légales', 'titre', [text('titre', 'Titre', true), { name: 'resume', label: 'Introduction', type: 'textarea' }, photo(), { name: 'validationLegale', label: 'Contenu réglementaire validé par un administrateur', type: 'checkbox', defaultValue: false, access: { create: adminField, update: adminField } }])
Pages.fields = Pages.fields.map(f => 'name' in f && f.name === 'slug' ? { name: 'slug', label: 'Rubrique du site', type: 'select', required: true, unique: true, options: pageSlugs, admin: { description: 'Choisir à la création. L’identité d’une rubrique existante est fixe ; son titre et son contenu restent modifiables.' } } : f)
Pages.hooks = { ...sharedHooks, beforeChange: [...(sharedHooks.beforeChange || []), ({ data, originalDoc, req }) => {
  const merged = { ...originalDoc, ...data }
  if (originalDoc?.id && 'slug' in data && data.slug !== originalDoc.slug) throw new APIError('La rubrique d’une page existante est fixe. Modifier son contenu ou créer une autre rubrique.', 400)
  if (['mentions-legales', 'confidentialite', 'accessibilite'].includes(merged.slug)) {
    if (!req.context.cmsSavingDraft && req.user?.role !== 'admin') throw new APIError('Un éditeur peut seulement proposer un brouillon de cette page réglementaire.', 403)
    if (!req.context.isRestoringVersion && !req.context.cmsSavingDraft && req.context.cmsStatusExplicit === false) throw new APIError('Choisir explicitement Enregistrer un brouillon ou Publier pour modifier cette page réglementaire.', 400)
    const changed = originalDoc?.id && ['titre', 'resume', 'corps', 'image', 'slug'].some(key => key in data && JSON.stringify(data[key]) !== JSON.stringify(originalDoc[key]))
    if (changed) data.validationLegale = false
    if (data._status === 'published' && (req.user?.role !== 'admin' || !(data.validationLegale ?? merged.validationLegale))) throw new APIError('La publication réglementaire exige une validation administrateur après la dernière modification.', 403)
  }
  return data
}] }
export const Informations = collection('informations', 'Informations générales', 'Informations générales', 'nom', [
  text('nom', 'Nom complet', true), text('nomCourt', 'Nom court'), text('baseline', 'Accroche'), { name: 'description', label: 'Présentation courte', type: 'textarea' },
  text('ville', 'Ville'), list('secteurs', 'Quartiers / secteurs'), text('telephone', 'Téléphone général'), email('email', 'Adresse électronique générale'), text('adresse', 'Adresse générale'), { name: 'horaires', label: 'Horaires généraux', type: 'textarea' },
  { name: 'contact', label: 'Contacts professionnels', type: 'group', fields: [email('general', 'Contact général'), email('secretariat', 'Secrétariat'), email('coordination', 'Coordination')] },
  { name: 'contactsVerifies', label: 'Coordonnées confirmées par un administrateur', type: 'checkbox', defaultValue: false, access: { create: adminField, update: adminField } },
  url('doctolibUrl', 'Rendez-vous Doctolib général', ['www.doctolib.fr', 'doctolib.fr']), links
])
Informations.access = { ...contentAccess, create: admin, update: admin }
Informations.fields = Informations.fields.map(f => 'name' in f && f.name === 'slug' ? { name: 'slug', type: 'select', required: true, unique: true, defaultValue: 'general', options: [{ label: 'Informations générales', value: 'general' }] } : f)
Informations.hooks = { ...sharedHooks, beforeChange: [...(sharedHooks.beforeChange || []), ({ data, originalDoc, req }) => {
  if (!req.context.isRestoringVersion && !req.context.cmsSavingDraft && req.context.cmsStatusExplicit === false) throw new APIError('Choisir explicitement Enregistrer un brouillon ou Publier pour modifier cette fiche.', 400)
  const merged = { ...originalDoc, ...data }
  if (originalDoc?.id && ['telephone', 'email', 'adresse', 'contact'].some(key => key in data && JSON.stringify(data[key]) !== JSON.stringify(originalDoc[key]))) data.contactsVerifies = false
  if (data._status === 'published' && !merged.doctolibUrl) throw new APIError('Renseigner le lien Doctolib général avant publication.', 400)
  if (data._status === 'published' && !(data.contactsVerifies ?? merged.contactsVerifies)) throw new APIError('Faire confirmer les coordonnées avant de publier les informations générales.', 400)
  return data
}] }
export const contentCollections = [Professionnels, Lieux, Actualites, Activites, Innovations, Partenaires, Pages, Informations]
