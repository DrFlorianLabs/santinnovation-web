import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";
import { resolve } from "node:path";

// CMS snapshots contain only the published projection. Source Markdown is kept
// as a reviewable historical fallback; production builds require a CMS snapshot.
const snapshot = process.env.CMS_CONTENT_DIR;
const loader = (name: string) => snapshot
  ? file(resolve(snapshot, `${name}.json`))
  : glob({ pattern: "**/*.{md,mdx}", base: `./src/content/${name}` });
const httpsUrl = (hosts?: readonly string[]) => z.url().refine((value) => {
  const u = new URL(value);
  return u.protocol === "https:" && !u.username && !u.password && (!hosts || hosts.includes(u.hostname));
}, "Lien HTTPS vers un domaine autorisé requis");
const image = z.string().regex(/^\/media\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/, "Image locale exportée par le CMS requise");
const body = { bodyHtml: z.string().optional(), imageAlt: z.string().optional(), imageCredit: z.string().optional(), photoAlt: z.string().optional(), photoCredit: z.string().optional() };
const date = z.coerce.date().optional();
const publication = { visible: z.boolean().default(true), archive: z.boolean().default(false), debutAffichage: date, finAffichage: date };
export const PROFESSIONS = ["medecin-generaliste", "infirmier", "kinesitherapeute", "pharmacien", "coordination", "autre", "a-confirmer"] as const;
const professionnels = defineCollection({ loader: loader("professionnels"), schema: z.object({
  ...body, ...publication, prenom: z.string(), nom: z.string(), titreAffiche: z.string(),
  profession: z.enum(PROFESSIONS), professionLabel: z.string(), lieux: z.array(z.string()).default([]),
  domaines: z.array(z.string()).default([]), activites: z.array(z.string()).default([]),
  doctolibUrl: httpsUrl(["www.doctolib.fr", "doctolib.fr"]).optional(), photo: image.optional(),
  telephone: z.string().optional(), email: z.email().optional(),
  horairesParLieu: z.array(z.object({ lieu: z.string(), horaires: z.string() })).default([]),
  accepteNouveauxPatients: z.boolean().default(false), soinsADomicile: z.boolean().default(false), ordre: z.number().default(99),
}) });
const lieux = defineCollection({ loader: loader("lieux"), schema: z.object({
  ...body, ...publication, nom: z.string(), adresse: z.string(), codePostal: z.string().default("25000"), ville: z.string().default("Besançon"),
  secteur: z.string().optional(), accesTransport: z.string().optional(), accesPMR: z.boolean().optional(), accessibilite: z.string().optional(),
  horaires: z.string().optional(), telephone: z.string().optional(), email: z.email().optional(), infosPratiques: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), adresseVerifiee: z.boolean().default(false),
  itineraireUrl: httpsUrl(["www.google.com", "maps.google.com", "www.openstreetmap.org"]).optional(),
  photo: image.optional(), photos: z.array(z.object({ image, legende: z.string().optional(), imageAlt: z.string().optional(), imageCredit: z.string().optional() })).default([]), ordre: z.number().default(99),
}) });
const actualites = defineCollection({ loader: loader("actualites"), schema: z.object({
  ...body, ...publication, titre: z.string(), date: z.coerce.date(), resume: z.string(), categorie: z.string().default("Actualité"),
  image: image.optional(), epingle: z.boolean().default(false), draft: z.boolean().default(false), debutEvenement: date, finEvenement: date,
}) });
const editorial = z.object({ ...body, ...publication, titre: z.string(), resume: z.string().default(""), ordre: z.number().default(99), image: image.optional(), url: httpsUrl().optional(), liens: z.array(z.object({ libelle: z.string(), url: httpsUrl() })).default([]) });
const pages = defineCollection({ loader: loader("pages"), schema: editorial });
const activites = defineCollection({ loader: loader("activites"), schema: editorial });
const innovations = defineCollection({ loader: loader("innovations"), schema: editorial });
export const collections = { professionnels, lieux, actualites, pages, activites, innovations };
