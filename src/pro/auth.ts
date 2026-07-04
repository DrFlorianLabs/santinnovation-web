/**
 * Contrats d'authentification de l'espace professionnel — CIBLE V1.5.
 *
 * V0 : aucun de ces types n'est branché sur une authentification réelle.
 * Ils décrivent la cible (Pro Santé Connect + 2FA TOTP, cf. ADR 0002) et
 * alimentent la maquette /pro/login, clairement étiquetée démonstration.
 *
 * AUCUN SECRET ICI : les identifiants OIDC réels (client_id, client_secret)
 * sont de la configuration d'environnement de la future application serveur.
 */

import type { Role } from "./ged";

/** Méthodes d'authentification prévues. Le mot de passe seul ne suffit jamais. */
export type AuthMethod = "password" | "totp_2fa" | "pro_sante_connect";

export const AUTH_METHOD_LABELS: Record<AuthMethod, string> = {
  password: "Mot de passe (premier facteur uniquement)",
  totp_2fa: "Code à usage unique (TOTP)",
  pro_sante_connect: "Pro Santé Connect",
};

/** État du second facteur au cours d'une connexion. */
export type MfaState =
  | "not_enrolled" // aucun second facteur enregistré (accès refusé en V1.5)
  | "pending" // premier facteur validé, code TOTP attendu
  | "verified"; // authentification forte complète

/**
 * Identité fournie par Pro Santé Connect (OIDC, issuer ANS).
 * Champs alignés sur les claims PSC ; valeurs de démo uniquement en V0.
 */
export interface ProSanteConnectIdentity {
  /** Claim `sub` : identifiant technique stable chez PSC. */
  subject: string;
  /** Identifiant national (idNat / RPPS). À COMPLÉTER en production. */
  idNat: string;
  /** Code profession (ex. « 10 » médecin) — référentiel ANS. */
  codeProfession: string;
  /** Code savoir-faire / spécialité, si applicable. */
  codeSpecialite?: string;
  /** Niveau de garantie de l'identification (loa : eidas1..3). */
  loa: "eidas1" | "eidas2" | "eidas3";
  /** Nom d'exercice affiché. */
  nomExercice: string;
}

/**
 * Session simulée (V0). En V1.5 la session est côté serveur : cookie
 * httpOnly + Secure + SameSite, expiration courte, révocation.
 */
export interface Session {
  utilisateur: string;
  role: Role;
  methode: AuthMethod;
  mfa: MfaState;
  /** Identité PSC si la connexion est passée par Pro Santé Connect. */
  psc?: ProSanteConnectIdentity;
  ouverteLe: string; // ISO datetime
  expireLe: string; // ISO datetime
  /** Toujours true en V0 : rien n'est réel. */
  simulee: true;
}

/**
 * Placeholders de configuration OIDC Pro Santé Connect.
 * Endpoints publics documentés par l'ANS (bac à sable) — aucun secret.
 * Les valeurs définitives vivront dans l'environnement serveur (V1.5).
 */
export const PSC_OIDC_CONFIG = {
  /** Issuer bac à sable ANS ; production : wallet.esw.esante.gouv.fr. */
  issuer: "https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet",
  /** À COMPLÉTER : client_id attribué par l'ANS lors de l'enrôlement. */
  clientId: "A_COMPLETER_CLIENT_ID_PSC",
  scopes: ["openid", "scope_all"],
  authorizationEndpoint:
    "https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/auth",
  tokenEndpoint:
    "https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/token",
  userinfoEndpoint:
    "https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/userinfo",
  /** URI de retour de la future app serveur. À COMPLÉTER. */
  redirectUri: "https://A_COMPLETER.santinnovation.fr/auth/psc/callback",
} as const;
