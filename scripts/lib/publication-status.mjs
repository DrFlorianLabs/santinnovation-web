/** Minimal display DTO: no paths, owner details, logs or arbitrary error text. */
export function publicationView(status, now = Date.now()) {
  const updated = status?.checkedAt || status?.updatedAt || status?.builtAt;
  const time = updated ? Date.parse(updated) : NaN;
  const stale = !Number.isFinite(time) || now - time > 300_000 || time > now + 60_000;
  const labels = {
    ready: 'Dernière génération du site prête.',
    unchanged: 'Site à jour : aucun changement de contenu publié.',
    building: 'Génération du site en cours…',
    locked: 'Publication bloquée : une opération est active ou son verrou doit être contrôlé.',
    error: 'La dernière génération a échoué. Le site précédent est conservé.',
    rolledBack: 'Version antérieure restaurée. Maintenue jusqu’au prochain changement de contenu publié.',
  };
  const causeLabels = {
    LOCATION_REFERENCED: 'Un établissement reste référencé. Réaffecter les professionnels concernés avant son retrait.',
    LOCATION_UNAVAILABLE: 'Un professionnel référence un établissement non publiable. Corriger cette fiche ou la masquer.',
    PUBLICATION_INTERVAL_INVALID: 'Les périodes d’affichage du professionnel et de son établissement sont incompatibles.',
    LEGAL_VALIDATION_REQUIRED: 'Publier et valider les trois rubriques réglementaires avant une nouvelle génération.',
    GENERAL_INFORMATION_REQUIRED: 'Publier les informations générales validées avant une nouvelle génération.',
    TIMEOUT: 'Le délai maximal de génération est dépassé. Contacter le responsable technique.',
    LOCK_CHILD_ACTIVE: 'Un processus de génération est encore actif. Reprise différée.',
    LOCK_UNVERIFIABLE: 'Le propriétaire du verrou ne peut pas être vérifié. Contacter le responsable technique.',
  };
  const error = status?.error;
  const collection = ['professionnels','lieux','actualites','pages','informations','medias','activites','innovations','partenaires'].includes(error?.collection) ? error.collection : '';
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(error?.slug || '') && error.slug.length <= 120 ? error.slug : '';
  return { label: stale ? 'Service de publication inactif ou dernier contrôle trop ancien.' : (labels[status?.state] || 'Aucune génération du site confirmée. Le service de publication doit être actif.'),
    stale, updated: Number.isFinite(time) ? new Date(time).toISOString() : null,
    cause: ['error','locked'].includes(status?.state) ? causeLabels[error?.code] || 'Contacter le responsable technique si ce blocage persiste.' : null,
    reference: collection && slug ? `${collection} / ${slug}` : null };
}
