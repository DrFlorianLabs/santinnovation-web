import { editorialSettings } from "@lib/editorial-settings";
export interface Partenaire {
  nom: string;
  logo?: string;
  logoAlt?: string;
  logoCredit?: string;
  /** URL officielle — HTTPS imposé par le type. */
  url?: `https://${string}`;
  /** Description courte (title / aria). */
  description?: string;
}

/**
 * Partenaires affichés sur le site public.
 * URLs vérifiées le 03/07/2026. Logos à confirmer avant publication (autorisations).
 */
const fallbackPartenaires: Partenaire[] = [
  {
    nom: "Digital Medical Hub",
    url: "https://www.digitalmedicalhub.com/",
    description: "Évaluation et développement d'outils de santé numérique",
  },
  {
    nom: "CPTS CaPaciTéS Besançon & Métropole",
    url: "https://www.cpts-capacites-bm.fr/",
    description: "Communauté professionnelle territoriale de santé du Grand Besançon",
  },
  {
    nom: "FeMaSCo-BFC",
    url: "https://www.femasco-bfc.fr/",
    description: "Fédération des maisons de santé et de l'exercice coordonné BFC",
  },
  {
    nom: "AVECsanté",
    url: "https://avecsante.fr/",
    description: "Avenir des équipes coordonnées — fédération nationale",
  },
  {
    nom: "ARS Bourgogne-Franche-Comté",
    url: "https://www.bourgogne-franche-comte.ars.sante.fr/",
    description: "Agence régionale de santé",
  },
  {
    nom: "GIRCI Est",
    url: "https://girci-est.fr/",
    description: "Groupement interrégional de recherche clinique et d'innovation",
  },
];

export const partenaires = editorialSettings<Partenaire[]>("partenaires", fallbackPartenaires);
