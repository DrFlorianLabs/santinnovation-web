# `src/pro/` — contrats de l'espace professionnel (frontière front/back)

Ce dossier isole **tout ce qui préfigure le backend pro** (GED, authentification) du
site public. Voir `docs/adr/0001-separation-front-back-ovh.md` et
`docs/adr/0002-authentification-ged-psc-2fa.md`.

Règles :

- **Types, constantes et données de démonstration uniquement.** Aucune logique serveur,
  aucun secret, aucune donnée réelle (patient, RIB, identifiant).
- Importable côté front (démo `/pro`) via l'alias `@pro/*`, mais écrit comme un futur
  paquet de contrats (`pro-contracts`) destiné à migrer vers l'application serveur
  distincte (V1.5).
- Le site public (`src/pages`, `src/components`, `src/data`, `src/lib`, `src/styles`)
  ne doit **jamais** dépendre de ce dossier, à l'exception des pages `/pro/*` (démo).

Contenu :

- `ged.ts` — modèle documentaire (rôles, sensibilités, documents, journal d'audit) +
  bibliothèque de démonstration.
- `auth.ts` — contrats d'authentification cible : méthodes (`password`, `totp_2fa`,
  `pro_sante_connect`), état MFA, session simulée, identité Pro Santé Connect (OIDC),
  placeholders de configuration PSC sans secret.
- `access.ts` — matrice de capacités par rôle (`AccessPolicy`).
