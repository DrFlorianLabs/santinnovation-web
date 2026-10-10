// Deliberately separate from the CMS production projection: this is a reviewed,
// versioned public prototype snapshot, never an export of a private CMS database.
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'astro/zod';
import sanitizeHtml from 'sanitize-html';
import { cleanHTML } from './project-content.mjs';

export const approvedFiles = ['professionnels', 'lieux', 'actualites', 'pages', 'activites', 'innovations', 'site', 'doctolib', 'partenaires'];
export const legalPages = ['mentions-legales', 'confidentialite', 'accessibilite'];
export const pageSlugs = ['accueil', 'projet-de-sante', 'soins-et-parcours', 'recherche-innovation', 'rejoindre', 'informations-pratiques', 'contact', 'equipe', 'lieux', 'prendre-rendez-vous', ...legalPages];
export const approvedPublicAssets = ['.htaccess', '_headers', 'robots.txt', 'favicon.svg', 'brand/symbole.svg', 'brand/symbole-blanc.svg', 'brand/team-ic.jpg', 'brand/digital-medical-hub.png', 'brand/ars-bfc.jpg', 'brand/cpts-capacites.jpg', 'brand/femasco-bfc.png'];
const partnerLogo = z.enum(['/brand/digital-medical-hub.png', '/brand/ars-bfc.jpg', '/brand/cpts-capacites.jpg', '/brand/femasco-bfc.png']);
const privatePath = /(?:^|\/)(?:pro|admin|api|cms|apercu|\.local|\.releases)(?:\/|$)/i;
const privateText = /DRAFT_NEVER_PUBLIC|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|PAYLOAD_SECRET|identifiants-locaux\.json|(?:\/Users\/|\/home\/)[^\s<]+|\[À (?:COMPLÉTER|CONFIRMER)/i;
const text = z.string().max(50_000).refine(value => !privateText.test(value), 'Marqueur privé ou trame historique interdit');
const label = text.min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).refine(value => !privatePath.test(value));
function publicHTTPS(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password
      && !/^(?:localhost|127\.|0\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[)/.test(host)
      && !/\.(?:localhost|local|internal)$/.test(host)
      && !privatePath.test(decodeURIComponent(url.pathname))
      && ![...url.searchParams.keys()].some(k => /^(?:token|password|secret|access_token|api_key)$/i.test(k));
  } catch { return false; }
}
const https = text.refine(publicHTTPS, 'Lien public HTTPS requis');
const doctolib = https.refine(value => ['www.doctolib.fr', 'doctolib.fr'].includes(new URL(value).hostname), 'Lien Doctolib requis');
const email = z.union([z.literal(''), z.email().max(254)]);
const link = z.strictObject({ libelle: label, url: https });
const links = z.array(link).max(100);
function approvedHTML(value) {
  return sanitizeHtml(cleanHTML(value || ''), {
    allowedTags: ['p','br','strong','em','u','s','h2','h3','h4','ul','ol','li','blockquote','a'],
    allowedAttributes: { a: ['href','title'] },
    transformTags: { a: (_tag, attributes) => {
      const href = attributes.href;
      if (href && !(publicHTTPS(href) || /^mailto:[^?]+$/.test(href) && z.email().safeParse(href.slice(7)).success || /^tel:\+?[\d ()-]+$/.test(href))) {
        throw new Error('Lien privé ou invalide dans un texte public.');
      }
      return { tagName: 'a', attribs: attributes };
    } },
  });
}
const common = {
  id: slug, bodyHtml: text.optional().transform(approvedHTML),
  visible: z.literal(true).optional().default(true), archive: z.literal(false).optional().default(false),
  ordre: z.number().optional().default(99),
};
const editorial = {
  ...common, titre: label, resume: text.optional().default(''), liens: links.optional().default([]), url: https.optional(),
};
const schemas = {
  professionnels: z.array(z.strictObject({
    ...common, prenom: label, nom: label, titreAffiche: label,
    profession: z.enum(['medecin-generaliste', 'infirmier', 'kinesitherapeute', 'pharmacien', 'coordination', 'autre', 'a-confirmer']),
    professionLabel: label, lieux: z.array(slug).max(100),
    domaines: z.array(label).max(100).optional().default([]), activites: z.array(label).max(100).optional().default([]),
    horairesParLieu: z.array(z.strictObject({ lieu: slug, horaires: label })).max(100).optional().default([]),
    doctolibUrl: doctolib.optional(), telephone: text.optional(), email: z.email().optional(),
    accepteNouveauxPatients: z.boolean().optional(), soinsADomicile: z.boolean().optional(),
  })).max(1000),
  lieux: z.array(z.strictObject({
    ...common, nom: label, adresse: label, codePostal: label, ville: label,
    secteur: text.optional(), accesTransport: text.optional(), accesPMR: z.boolean().optional(), accessibilite: text.optional(),
    horaires: text.optional(), telephone: text.optional(), email: z.email().optional(), infosPratiques: text.optional(),
    latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(),
    adresseVerifiee: z.boolean(),
    itineraireUrl: https.refine(value => ['www.google.com', 'maps.google.com', 'www.openstreetmap.org'].includes(new URL(value).hostname)).optional(),
    // No photograph has been approved for this snapshot. Do not accept a private
    // upload URL, an unreviewed binary, or an old media directory implicitly.
    photos: z.array(z.never()).optional(),
  })).max(1000),
  actualites: z.array(z.strictObject({
    ...common, titre: label, date: z.iso.datetime({ offset: true }), resume: label,
    categorie: label, epingle: z.boolean().optional(), draft: z.literal(false).optional(),
    debutEvenement: z.iso.datetime({ offset: true }).optional(), finEvenement: z.iso.datetime({ offset: true }).optional(),
  })).max(1000),
  pages: z.array(z.strictObject({ ...editorial, id: z.enum(pageSlugs) })).max(pageSlugs.length),
  activites: z.array(z.strictObject(editorial)).max(1000),
  innovations: z.array(z.strictObject(editorial)).max(1000),
  site: z.strictObject({
    nom: label, nomCourt: label, baseline: text, description: text, url: https, ville: text,
    secteurs: z.array(label).max(100), contactsVerifies: z.boolean(),
    contact: z.strictObject({ general: email, secretariat: email, coordination: email }),
    telephone: text, adresse: text, horaires: text, liens: links,
  }),
  doctolib: z.strictObject({ etablissement: z.union([z.literal(''), doctolib]) }),
  partenaires: z.array(z.strictObject({ nom: label, description: text.optional(), url: https.optional(), logo: partnerLogo.optional(), logoAlt: label.optional() })).max(1000),
};

export function validateApprovedContent(input) {
  const parsed = z.strictObject(schemas).safeParse(input);
  // Do not echo rejected field values: validation may discover private content.
  if (!parsed.success) throw new Error('Instantané approuvé refusé : fichier, champ ou valeur hors contrat public.');
  const result = parsed.data;
  for (const name of ['professionnels', 'lieux', 'actualites', 'pages', 'activites', 'innovations']) {
    const ids = result[name].map(doc => doc.id);
    if (new Set(ids).size !== ids.length) throw new Error(`Identifiant dupliqué : ${name}.`);
  }
  const locations = new Set(result.lieux.map(doc => doc.id));
  for (const person of result.professionnels) {
    if (new Set(person.lieux).size !== person.lieux.length || person.lieux.some(id => !locations.has(id))
      || person.horairesParLieu.some(row => !person.lieux.includes(row.lieu))) {
      throw new Error('Relation professionnel–lieu absente ou incohérente.');
    }
  }
  for (const id of legalPages) {
    const page = result.pages.find(doc => doc.id === id);
    if (!page || !page.bodyHtml.trim() || !/prototype|version de présentation|avant l’ouverture du site définitif/i.test(page.bodyHtml)) {
      throw new Error('Chaque rubrique réglementaire doit présenter explicitement les limites du prototype.');
    }
  }
  if (!result.site.contactsVerifies && (result.site.telephone || Object.values(result.site.contact).some(Boolean))) {
    throw new Error('Coordonnées générales présentes sans vérification.');
  }
  for (const item of result.actualites) {
    if (item.debutEvenement && item.finEvenement && Date.parse(item.finEvenement) < Date.parse(item.debutEvenement)) throw new Error('Dates d’événement incohérentes.');
  }
  return result;
}

export async function readApprovedContent(directory) {
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Dossier de contenus approuvés invalide.');
  const entries = await readdir(directory, { withFileTypes: true });
  const expected = approvedFiles.map(name => `${name}.json`).sort();
  if (entries.some(entry => !entry.isFile() || entry.isSymbolicLink())
    || JSON.stringify(entries.map(entry => entry.name).sort()) !== JSON.stringify(expected)) {
    throw new Error('Seuls les neuf fichiers JSON publics attendus sont autorisés. Aucun média ou dossier privé.');
  }
  const input = {};
  for (const name of approvedFiles) {
    const file = join(directory, `${name}.json`);
    if ((await lstat(file)).size > 2_000_000) throw new Error('Fichier de contenu trop volumineux.');
    try { input[name] = JSON.parse(await readFile(file, 'utf8')); }
    catch { throw new Error(`JSON invalide : ${name}.`); }
  }
  return validateApprovedContent(input);
}

export async function validateApprovedPublicAssets(directory) {
  const found = [];
  async function visit(path, prefix = '') {
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Dossier public invalide.');
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error('Lien symbolique dans les assets publics.');
      if (entry.isDirectory()) {
        if (name !== 'brand') throw new Error('Dossier public non approuvé.');
        await visit(join(path, entry.name), `${name}/`);
      } else if (entry.isFile() && approvedPublicAssets.includes(name)) found.push(name);
      else throw new Error('Fichier public non approuvé. Aucun média supplémentaire ne peut être copié implicitement.');
    }
  }
  await visit(directory);
  if (found.length !== approvedPublicAssets.length) throw new Error('Asset public attendu absent.');
}
