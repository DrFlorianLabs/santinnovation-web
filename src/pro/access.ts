/**
 * Matrice de capacités par rôle — contrat d'autorisation de la GED.
 *
 * Remplace la logique « liste acces[] par document » par une politique
 * explicite : chaque rôle déclare ce qu'il PEUT faire, action par action.
 * En V1.5, cette matrice est évaluée CÔTÉ SERVEUR, par ressource, et
 * chaque décision est journalisée (cf. ADR 0002 et SECURITY.md).
 * En V0, elle ne sert qu'à la démonstration /pro.
 */

import type { Role } from "./ged";

/** Actions possibles sur une ressource documentaire. */
export const CAPABILITIES = [
  "read", // consulter un document autorisé
  "download", // télécharger une copie locale
  "deposit", // déposer un nouveau document
  "update", // mettre à jour / versionner un document existant
  "validate", // valider un document avant diffusion
  "manage_users", // gérer les comptes et les rôles
  "admin", // administration complète (paramètres, rétention, purge)
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  read: "Consulter",
  download: "Télécharger",
  deposit: "Déposer",
  update: "Mettre à jour",
  validate: "Valider",
  manage_users: "Gérer les utilisateurs",
  admin: "Administrer",
};

/** Politique d'accès : pour chaque rôle, l'ensemble de ses capacités. */
export type AccessPolicy = Record<Role, Readonly<Record<Capability, boolean>>>;

/** Intention de chaque rôle, en une ligne. */
export const ROLE_INTENTS: Record<Role, string> = {
  admin: "Exploite la plateforme : comptes, paramètres, rétention — pas un super-lecteur métier.",
  coordination: "Anime l'équipe : dépose, met à jour et valide les documents d'organisation.",
  professional: "Professionnel de la MSP : consulte et dépose dans son périmètre de soin.",
  replacement: "Remplaçant : consulte les protocoles et guides utiles à sa mission, sans dépôt.",
  external_partner: "Partenaire externe : lecture seule des documents de partenariat partagés.",
  read_only: "Compte d'observation (audit, découverte) : lecture sans aucune écriture.",
};

const cap = (...granted: Capability[]): Readonly<Record<Capability, boolean>> =>
  Object.freeze(
    Object.fromEntries(
      CAPABILITIES.map((c) => [c, granted.includes(c)]),
    ) as Record<Capability, boolean>,
  );

/**
 * Matrice de référence. Lecture : ACCESS_POLICY[role][capability].
 * La sensibilité du document (interne/restreint/sensible) reste un filtre
 * complémentaire appliqué par ressource, côté serveur en V1.5.
 */
export const ACCESS_POLICY: AccessPolicy = {
  admin: cap("read", "download", "deposit", "update", "validate", "manage_users", "admin"),
  coordination: cap("read", "download", "deposit", "update", "validate"),
  professional: cap("read", "download", "deposit"),
  replacement: cap("read", "download"),
  external_partner: cap("read"),
  read_only: cap("read"),
};

/** Un rôle possède-t-il une capacité ? */
export function hasCapability(role: Role, capability: Capability): boolean {
  return ACCESS_POLICY[role][capability];
}
