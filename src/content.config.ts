import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * URLs durcies : HTTPS obligatoire + allowlist de domaines.
 * Le contenu (futur CMS compris) est traité comme non fiable : un lien
 * javascript:, data: ou vers un domaine inattendu fait échouer le build.
 */
const httpsUrl = (hosts: readonly string[]) =>
  z
    .string()
    .url()
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" && hosts.includes(url.hostname);
        } catch {
          return false;
        }
      },
      {
        message: `URL refusée : HTTPS obligatoire et domaine limité à ${hosts.join(", ")}`,
      },
    );

const DOCTOLIB_HOSTS = ["www.doctolib.fr", "doctolib.fr"] as const;
const ITINERAIRE_HOSTS = [
  "www.google.com",
  "maps.google.com",
  "www.openstreetmap.org",
] as const;

/**
 * Catégories de profession affichables. Pilote les filtres du trombinoscope.
 * "a-confirmer" est un état de transition pour les fiches en attente de validation.
 */
export const PROFESSIONS = [
  "medecin-generaliste",
  "infirmier",
  "kinesitherapeute",
  "pharmacien",
  "coordination",
  "autre",
  "a-confirmer",
] as const;

const professionnels = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/professionnels" }),
  schema: z.object({
    prenom: z.string(),
    nom: z.string(),
    /** Libellé affiché tel quel, ex. "Dr Florian Sibille". */
    titreAffiche: z.string(),
    profession: z.enum(PROFESSIONS),
    /** Libellé lisible de la profession, ex. "Médecin généraliste". */
    professionLabel: z.string(),
    /** Slugs de lieux (collection "lieux") où le pro exerce. */
    lieux: z.array(z.string()).default([]),
    domaines: z.array(z.string()).default([]),
    /** Lien Doctolib individuel si disponible (HTTPS, domaine Doctolib). */
    doctolibUrl: httpsUrl(DOCTOLIB_HOSTS).optional(),
    photo: z.string().optional(),
    accepteNouveauxPatients: z.boolean().default(false),
    soinsADomicile: z.boolean().default(false),
    /** Ordre d'affichage dans le trombinoscope (croissant). */
    ordre: z.number().default(99),
    visible: z.boolean().default(true),
  }),
});

const lieux = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lieux" }),
  schema: z.object({
    nom: z.string(),
    adresse: z.string(),
    codePostal: z.string().default("25000"),
    ville: z.string().default("Besançon"),
    /** Secteur / quartier (Palente, Les Cras, Les Orchamps…). Optionnel. */
    secteur: z.string().optional(),
    accesTransport: z.string().optional(),
    accesPMR: z.boolean().optional(),
    horaires: z.string().optional(),
    /** URL d'itinéraire (HTTPS, Google Maps ou OpenStreetMap). */
    itineraireUrl: httpsUrl(ITINERAIRE_HOSTS).optional(),
    photo: z.string().optional(),
    ordre: z.number().default(99),
  }),
});

const actualites = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/actualites" }),
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    resume: z.string(),
    categorie: z.string().default("Actualité"),
    image: z.string().optional(),
    epingle: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { professionnels, lieux, actualites };
