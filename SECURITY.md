# Politique de sécurité — Sant'Innovation Web

## Périmètre

Ce dépôt contient le **site public statique** (Astro SSG) et une **démonstration**
d'espace professionnel (`/pro`, `/pro/login`) sans authentification réelle.
Aucune donnée patient, aucun secret, aucune donnée réelle sensible n'y est admise.

## Signaler une vulnérabilité

Écrire à **coordination@santinnovation.fr** (À COMPLÉTER : adresse de contact
sécurité dédiée une fois confirmée). Merci de ne pas ouvrir d'issue publique
pour une faille exploitable. Accusé de réception visé sous 7 jours.

## Règles applicables à ce dépôt (V0)

- **Interdits absolus** : document patient, donnée de santé identifiante, RIB,
  mot de passe, clé d'API, secret OIDC. Les placeholders (`A_COMPLETER_*`)
  sont volontairement non fonctionnels.
- L'espace `/pro` est une **simulation côté client**, clairement étiquetée.
  Il ne doit jamais être présenté ni utilisé comme une GED réelle.
- Pages pro : `noindex`, exclues du sitemap, hors navigation publique principale.
- En-têtes de sécurité versionnés : `public/.htaccess` (OVH/Apache, production)
  et `public/_headers` (Cloudflare Pages, prévisualisation) — mêmes politiques,
  à modifier ensemble. CSP stricte : aucun script inline
  (cf. `astro.config.mjs`), tuiles CARTO seules sources externes (images).
- Contenus : URLs contraintes à HTTPS + allowlist de domaines (schémas Zod),
  aucun HTML non échappé injecté depuis le contenu (marqueurs Leaflet construits
  par DOM).
- Dépendances : `npm audit` avant release ; Dependabot + secret scanning à
  activer sur le dépôt GitHub (paramètres du dépôt, non versionnables ici).

## Cible V1.5 — GED professionnelle (application serveur séparée)

Décisions actées dans `docs/adr/0002-authentification-ged-psc-2fa.md` :

1. **Authentification forte obligatoire, côté serveur** :
   - **Pro Santé Connect** (OIDC ANS) pour les professionnels de santé
     (identité RPPS/idNat, niveau de garantie `loa`) ;
   - **2FA TOTP** pour les comptes non éligibles PSC ;
   - jamais de mot de passe seul.
2. **Autorisation par ressource, côté serveur** : matrice de capacités
   (`src/pro/access.ts` : `read | download | deposit | update | validate |
   manage_users | admin`) évaluée à chaque requête, complétée par le niveau
   de sensibilité du document. Aucune décision d'accès côté client.
3. **Journal d'audit immuable** (append-only) de toutes les décisions d'accès,
   dépôts, mises à jour et refus.
4. **Qualification HDS avant tout dépôt lié au soin** : si des documents
   relevant de l'article L.1111-8 CSP entrent dans le périmètre, hébergement
   certifié HDS obligatoire, avec classification, rétention, chiffrement,
   antivirus au dépôt, sauvegardes testées.
5. Sessions serveur (cookies httpOnly/Secure/SameSite, expiration courte),
   anti-CSRF, limitation de débit, modèle de menace écrit avant le build.
