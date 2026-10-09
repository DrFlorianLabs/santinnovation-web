import sanitizeHtml from 'sanitize-html';

export const collections = ['professionnels', 'lieux', 'actualites', 'pages', 'activites', 'innovations'];
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fields = {
  professionnels: ['prenom','nom','titreAffiche','profession','professionLabel','doctolibUrl','photo','telephone','email','accepteNouveauxPatients','soinsADomicile'],
  lieux: ['nom','adresse','codePostal','ville','secteur','accesTransport','accesPMR','accessibilite','horaires','telephone','email','latitude','longitude','photo','infosPratiques'],
  actualites: ['titre','date','resume','categorie','image','epingle','debutEvenement','finEvenement'],
  pages: ['titre','resume','image'], activites: ['titre','resume','image','url'], innovations: ['titre','resume','image','url'],
};
export const active = (doc, now = new Date()) => doc._status === 'published' && doc.visible !== false && !doc.archive
  && (!doc.debutAffichage || new Date(doc.debutAffichage) <= now)
  && (!doc.finAffichage || new Date(doc.finAffichage) > now);
export function cleanHTML(html) {
  return sanitizeHtml(html ?? '', {
    allowedTags: ['p','br','strong','em','u','s','h2','h3','h4','ul','ol','li','blockquote','a'],
    allowedAttributes: { a: ['href','title'] }, allowedSchemes: ['https','mailto','tel'], allowProtocolRelative: false,
    // No rich-text image/file/link to private media. Images use typed upload fields.
    transformTags: { a: (_tag, a) => ({ tagName: 'a', attribs: /^(https:\/\/|mailto:|tel:)/i.test(a.href ?? '') ? a : {} }) },
  });
}
function relation(value) { return typeof value === 'string' ? value : typeof value === 'object' && value ? value.slug : undefined; }
function select(doc, names) { return Object.fromEntries(names.filter(k => doc[k] !== undefined && doc[k] !== null && doc[k] !== '').map(k => [k, doc[k]])); }
const safeLink = value => {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Lien externe HTTPS requis');
  return value;
};
const safeImage = value => {
  if (!/^\/media\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(value)) throw new Error('Image publique invalide');
  return value;
};
export function projectContent(bundle, now = new Date()) {
  const output = {};
  for (const slug of ['mentions-legales','confidentialite','accessibilite']) {
    if (!bundle.pages?.some(p => p.slug === slug && active(p,now) && p.validationLegale === true)) {
      throw new Error(`Rubrique réglementaire publiée et validée requise : ${slug}`);
    }
  }
  for (const name of collections) {
    if (!Array.isArray(bundle[name])) throw new Error(`Collection absente : ${name}`);
    const seen = new Set();
    output[name] = bundle[name].filter(d => active(d, now)).map(d => {
      if (!validSlug.test(d.slug) || seen.has(d.slug)) throw new Error(`Identifiant invalide ou doublon : ${name}`);
      seen.add(d.slug);
      const doc = { id: d.slug, ...select(d, [...fields[name], 'imageAlt','imageCredit','photoAlt','photoCredit']), bodyHtml: cleanHTML(d.bodyHtml), visible: true, archive: false, ordre: d.ordre ?? 99 };
      if (name === 'professionnels') {
        doc.lieux = (d.lieux ?? []).map(relation);
        doc.domaines = (d.domaines ?? []).map(x => x.libelle);
        doc.activites = (d.activites ?? []).map(x => x.libelle);
        doc.horairesParLieu = (d.horairesParLieu ?? []).map(x => ({lieu: relation(x.lieu), horaires: x.horaires}));
      }
      if (name === 'lieux') {
        doc.adresseVerifiee = d.coordonneesVerifiees === true;
        // Address is the only source for directions; never keep a stale custom URL.
        doc.itineraireUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${d.adresse}, ${d.codePostal} ${d.ville}`)}`;
        doc.photos = (d.photos ?? []).map(x => ({image: x.image, legende: x.legende ?? '', imageAlt:x.imageAlt ?? '', imageCredit:x.imageCredit ?? ''}));
      }
      if (name === 'actualites') doc.draft = false;
      if (['activites','innovations','pages'].includes(name)) doc.liens = (d.liens ?? []).map(x => select(x,['libelle','url']));
      return doc;
    });
  }
  const locations = new Set(output.lieux.map(d => d.id));
  for (const d of output.professionnels) {
    if (d.lieux.some(id => !locations.has(id)) || d.horairesParLieu.some(x => !locations.has(x.lieu) || !d.lieux.includes(x.lieu))) {
      throw new Error(`Lieu absent/non publié ou horaires incohérents pour ${d.id}`);
    }
  }
  const info = bundle.informations?.find(d => active(d, now));
  if (!info) throw new Error('Informations générales publiées requises');
  output.site = {
    nom: info.nom, nomCourt: info.nomCourt || info.nom, baseline: info.baseline || '', description: info.description || '',
    url: process.env.SITE_URL || 'https://santinnovation.fr', ville: info.ville || '', secteurs: (info.secteurs ?? []).map(x => x.libelle),
    contactsVerifies: info.contactsVerifies === true,
    contact: { general: info.contactsVerifies ? info.contact?.general || info.email || '' : '', secretariat: info.contactsVerifies ? info.contact?.secretariat || '' : '', coordination: info.contactsVerifies ? info.contact?.coordination || '' : '' },
    telephone: info.contactsVerifies ? info.telephone || '' : '', adresse: info.adresse || '', horaires: info.horaires || '',
    liens: (info.liens ?? []).map(x => select(x,['libelle','url'])),
  };
  output.doctolib = { etablissement: info.doctolibUrl || '' };
  const rdv = new URL(safeLink(output.doctolib.etablissement));
  if (!['doctolib.fr','www.doctolib.fr'].includes(rdv.hostname)) throw new Error('Lien Doctolib établissement requis');
  output.partenaires = (bundle.partenaires ?? []).filter(d => active(d, now)).map(d => {
    const p = select(d, ['nom','description','url','logo','logoAlt','logoCredit']);
    if (p.url) p.url = safeLink(p.url);
    if (p.logo) p.logo = safeImage(p.logo);
    return p;
  });
  for (const link of output.site.liens) link.url = safeLink(link.url);
  return output;
}
