/**
 * Données globales de l'organisation. Source de vérité non éditoriale.
 */
export const site = {
  nom: "Maisons de Santé Pluriprofessionnelles Sant'Innovation",
  nomCourt: "Sant'Innovation",
  baseline: "Soins coordonnés · Recherche · Innovation utile",
  description:
    "Organisation pluriprofessionnelle multisite à Besançon. Médecine générale, soins infirmiers, kinésithérapie et pharmacie, coordonnés autour des parcours de soins.",
  url: "https://santinnovation.fr",
  ville: "Besançon",
  secteurs: ["Palente", "Les Cras", "Les Orchamps"],
  contact: {
    general: "contact@santinnovation.fr",
    secretariat: "secretariat@santinnovation.fr",
    coordination: "coordination@santinnovation.fr",
  },
} as const;

export type Site = typeof site;
