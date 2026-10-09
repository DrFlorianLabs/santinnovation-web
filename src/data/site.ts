import { editorialSettings } from "@lib/editorial-settings";
/**
 * Données globales de l'organisation. Source de vérité non éditoriale.
 */
const fallbackSite = {
  nom: "Maisons de Santé Pluriprofessionnelles Sant'Innovation",
  nomCourt: "Sant'Innovation",
  baseline: "Soins coordonnés · Recherche · Innovation utile",
  description:
    "Organisation pluriprofessionnelle multisite à Besançon. Médecine générale, soins infirmiers, kinésithérapie et pharmacie, coordonnés autour des parcours de soins.",
  url: "https://santinnovation.fr",
  ville: "Besançon",
  secteurs: ["Palente", "Les Cras", "Les Orchamps"],
  telephone: "",
  adresse: "",
  horaires: "",
  liens: [] as { libelle: string; url: string }[],
  contactsVerifies: false,
  contact: {
    general: "",
    secretariat: "",
    coordination: "",
  },
};

export const site = editorialSettings("site", fallbackSite);

export type Site = typeof site;
