/**
 * Espace professionnel — modèle de données de la GED (V0 simulée).
 *
 * V0 : données statiques typées, aucune authentification réelle, aucun
 * document patient, aucun secret. Le contrôle d'accès est SIMULÉ côté
 * client à des fins de démonstration produit.
 *
 * V1.5 : ces types servent de point de départ aux contrats de la future
 * application serveur séparée (cf. docs/adr/0001). Le contrôle d'accès
 * réel sera décidé côté serveur, par ressource (cf. src/pro/access.ts).
 */

/** Rôles simulés de l'espace professionnel. */
export const ROLES = [
  "admin",
  "coordination",
  "professional",
  "replacement",
  "external_partner",
  "read_only",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  coordination: "Coordination",
  professional: "Professionnel de santé",
  replacement: "Remplaçant",
  external_partner: "Partenaire externe",
  read_only: "Lecture seule",
};

/** Niveaux de sensibilité documentaire (badges). */
export const SENSITIVITIES = ["interne", "restreint", "sensible"] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

export const SENSITIVITY_LABELS: Record<Sensitivity, string> = {
  interne: "Interne",
  restreint: "Restreint",
  sensible: "Sensible",
};

export type DocCategory =
  | "protocole"
  | "gouvernance"
  | "recherche"
  | "partenariat"
  | "administratif";

export const CATEGORY_LABELS: Record<DocCategory, string> = {
  protocole: "Protocole",
  gouvernance: "Gouvernance",
  recherche: "Recherche & innovation",
  partenariat: "Partenariat",
  administratif: "Administratif",
};

export interface GedDocument {
  id: string;
  titre: string;
  categorie: DocCategory;
  sensibilite: Sensitivity;
  /** Rôles autorisés en lecture. */
  acces: readonly Role[];
  version: string;
  majLe: string; // ISO date
  proprietaire: string;
  format: "pdf" | "docx" | "xlsx" | "md";
}

/**
 * Bibliothèque de démonstration. Titres réalistes, contenus fictifs.
 * Aucun document patient, aucun RIB, aucun secret.
 */
export const documents: GedDocument[] = [
  {
    id: "doc-001",
    titre: "Protocole soins non programmés — orientation et créneaux dédiés",
    categorie: "protocole",
    sensibilite: "interne",
    acces: ["admin", "coordination", "professional", "replacement", "read_only"],
    version: "2.3",
    majLe: "2026-06-12",
    proprietaire: "Coordination",
    format: "pdf",
  },
  {
    id: "doc-002",
    titre: "Protocole plaies chroniques — coopération IDE / médecin",
    categorie: "protocole",
    sensibilite: "interne",
    acces: ["admin", "coordination", "professional", "replacement", "read_only"],
    version: "1.8",
    majLe: "2026-05-28",
    proprietaire: "Équipe IDE",
    format: "pdf",
  },
  {
    id: "doc-003",
    titre: "Guide d'accueil remplaçants — sites et organisation",
    categorie: "administratif",
    sensibilite: "interne",
    acces: ["admin", "coordination", "professional", "replacement"],
    version: "3.1",
    majLe: "2026-06-30",
    proprietaire: "Coordination",
    format: "docx",
  },
  {
    id: "doc-004",
    titre: "Compte rendu — réunion de concertation pluriprofessionnelle (trame vierge)",
    categorie: "gouvernance",
    sensibilite: "restreint",
    acces: ["admin", "coordination", "professional"],
    version: "1.0",
    majLe: "2026-06-18",
    proprietaire: "Coordination",
    format: "md",
  },
  {
    id: "doc-005",
    titre: "Statuts et règlement intérieur de la structure",
    categorie: "gouvernance",
    sensibilite: "restreint",
    acces: ["admin", "coordination", "professional"],
    version: "4.0",
    majLe: "2026-04-02",
    proprietaire: "Bureau",
    format: "pdf",
  },
  {
    id: "doc-006",
    titre: "Projet Digital Medical Hub — convention cadre (extraits partageables)",
    categorie: "partenariat",
    sensibilite: "restreint",
    acces: ["admin", "coordination", "external_partner"],
    version: "0.9",
    majLe: "2026-06-25",
    proprietaire: "Dr F. Sibille",
    format: "pdf",
  },
  {
    id: "doc-007",
    titre: "Protocole recherche soins primaires — synopsis (relecture GIRCI Est)",
    categorie: "recherche",
    sensibilite: "sensible",
    acces: ["admin", "coordination"],
    version: "0.4",
    majLe: "2026-07-01",
    proprietaire: "Dr F. Sibille",
    format: "docx",
  },
  {
    id: "doc-008",
    titre: "Indicateurs ACI — tableau de suivi annuel",
    categorie: "administratif",
    sensibilite: "sensible",
    acces: ["admin", "coordination"],
    version: "2026.2",
    majLe: "2026-06-29",
    proprietaire: "Coordination",
    format: "xlsx",
  },
];

export interface AuditLogEntry {
  horodatage: string;
  acteur: string;
  role: Role;
  action: "consultation" | "depot" | "mise_a_jour" | "acces_refuse";
  cible: string;
}

/** Journal d'accès simulé (démonstration de traçabilité). */
export const auditLog: AuditLogEntry[] = [
  {
    horodatage: "2026-07-02T17:42:00",
    acteur: "F. Sibille",
    role: "professional",
    action: "mise_a_jour",
    cible: "doc-007",
  },
  {
    horodatage: "2026-07-02T14:10:00",
    acteur: "Coordination",
    role: "coordination",
    action: "depot",
    cible: "doc-008",
  },
  {
    horodatage: "2026-07-02T09:35:00",
    acteur: "Remplaçant (démo)",
    role: "replacement",
    action: "acces_refuse",
    cible: "doc-005",
  },
  {
    horodatage: "2026-07-01T18:20:00",
    acteur: "P. Vuattoux",
    role: "professional",
    action: "consultation",
    cible: "doc-001",
  },
];

export const ACTION_LABELS: Record<AuditLogEntry["action"], string> = {
  consultation: "Consultation",
  depot: "Dépôt",
  mise_a_jour: "Mise à jour",
  acces_refuse: "Accès refusé",
};
