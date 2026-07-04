# ADR 0002 — Authentification et autorisations cibles de la GED pro

- **Statut :** accepté (cible V1.5 ; V0 = simulation clairement étiquetée)
- **Date :** 2026-07-04
- **Références :** AUD-002, AUD-006, AUD-008 (`docs/AUDIT_TECHNIQUE_2026-07-03.md`), ADR 0001

## Contexte

La V0 de l'espace `/pro` est une démonstration : rôles simulés côté client, aucune
authentification, aucun document réel. L'audit a montré que ce théâtre de sécurité doit
être requalifié, et que la V1.5 (GED réelle) exige une conception d'authentification et
d'autorisations décidée **avant** tout développement serveur.

## Décision

### Authentification (cible V1.5, côté serveur uniquement)

1. **Pro Santé Connect (PSC)** comme méthode d'identification principale des
   professionnels de santé : OIDC (issuer ANS), identité portant `subject`, identifiant
   national (`idNat` / RPPS), code profession/spécialité et niveau de garantie (`loa`).
2. **2FA TOTP** comme second facteur pour les comptes non éligibles PSC
   (coordination administrative, partenaires externes) et comme renforcement optionnel.
3. Le mot de passe seul n'est **jamais** suffisant pour accéder à un document.
4. Les paramètres OIDC (issuer, client_id, scopes, endpoints) sont de la **configuration
   d'environnement serveur** ; aucun secret dans ce dépôt. `src/pro/auth.ts` ne contient
   que les **types** et des placeholders de configuration non sensibles.

### Autorisations

5. Les rôles (`admin | coordination | professional | replacement | external_partner |
   read_only`) sont projetés sur une **matrice de capacités** explicite
   (`read | download | deposit | update | validate | manage_users | admin`) via un objet
   `AccessPolicy` typé (`src/pro/access.ts`). La liste `acces[]` par document reste un
   affichage de démo ; la source de vérité cible est la matrice + le contrôle serveur
   **par ressource**.
6. Chaque décision d'accès est journalisée dans un **journal d'audit immuable**
   (append-only) côté serveur.

### Frontière V0 / V1.5

7. En V0, aucune vraie soumission : `/pro/login` est une **maquette étiquetée
   « démonstration »** (bouton PSC inerte, étape TOTP factice). Aucun cookie de session,
   aucun stockage d'identifiant.
8. Aucun dépôt de document lié au soin avant hébergement **certifié HDS**
   (art. L.1111-8 CSP) et analyse de qualification des données.

## Conséquences

- `src/pro/` devient le contrat partagé : types d'identité PSC, session, méthodes d'auth,
  matrice de capacités — réutilisables par la future application serveur.
- `SECURITY.md` documente la cible complète (PSC + TOTP + RBAC serveur + audit immuable +
  HDS) et les règles applicables à la V0.
- Toute UI de démo doit rendre la simulation impossible à confondre avec un accès réel.
