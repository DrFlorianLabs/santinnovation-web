# ADR 0001 — Séparation front/back et hébergement OVH

- **Statut :** accepté
- **Date :** 2026-07-04
- **Décideurs :** Florian Sibille (structure), équipe technique
- **Références :** AUD-004, AUD-010, AUD-019, AUD-021 (`docs/AUDIT_TECHNIQUE_2026-07-03.md`)

## Contexte

Le site public Sant'Innovation est un projet **Astro en sortie statique (SSG)**. L'espace
`/pro` est une **démonstration produit** (GED simulée côté client), pas un backend.
L'audit du 3 juillet 2026 a relevé :

- l'absence de décision formelle sur l'architecture V1.5 (Astro vs Next.js, frontière public/pro) ;
- des en-têtes de sécurité non versionnés, et un mécanisme (`public/_headers`) qui ne
  s'appliquerait qu'à Cloudflare/Netlify alors que l'hébergement cible est **OVH mutualisé (Apache)** ;
- aucune frontière de code entre le site public et ce qui préfigure le backend pro.

## Décision

1. **Hébergement cible : OVH.** Le front public est 100 % statique : le contenu de `dist/`
   est déployé sur un hébergement mutualisé OVH (Apache) par SFTP ou CI. L'URL canonique
   reste `https://santinnovation.fr`.
2. **En-têtes de sécurité via `public/.htaccess`** (copié tel quel dans `dist/` par Astro) :
   redirection HTTPS, HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`, anti-framing, compression et cache des assets.
   Un fichier `public/_headers` **équivalent** est conservé pour le cas où un déploiement
   Cloudflare Pages resterait utilisé en prévisualisation : sur OVH seul `.htaccess`
   s'applique, sur Cloudflare Pages seul `_headers` s'applique. Les deux fichiers doivent
   rester synchronisés (mêmes politiques).
3. **Frontière front/back explicite dans le dépôt :**
   - le site public (`src/pages`, `src/components`, `src/content`, `src/data`, `src/lib`,
     `src/styles`, `src/layouts`, `src/scripts`) reste **sans aucune dépendance serveur** ;
   - tout ce qui préfigure le backend pro (types GED, contrats d'authentification,
     matrice de permissions, configuration OIDC Pro Santé Connect **sans secret**) vit dans
     **`src/pro/`** (alias `@pro/*`). Ce dossier est importable côté front pour la démo
     `/pro`, mais il est écrit comme un futur paquet de contrats (`pro-contracts`)
     destiné à migrer vers l'application serveur ;
   - `src/pro/` ne contient **aucune logique d'exécution serveur**, aucun secret, aucune
     donnée réelle : uniquement des types, des constantes de démonstration et de la
     documentation de cible.
4. **Le backend pro (GED réelle, auth) est un projet séparé**, non construit dans ce dépôt.
   Cible V1.5 : application serveur distincte (sous-domaine dédié), authentification forte
   (Pro Santé Connect + 2FA TOTP, cf. ADR 0002), RBAC côté serveur, journal d'audit
   immuable, et **qualification HDS** avant tout dépôt de document lié au soin.

## Alternatives considérées

- **Astro SSR (adaptateur Node) dans ce dépôt** : rejeté pour la V1.5 — mélange les cycles
  de vie public/pro, augmente la surface d'attaque du site vitrine, et l'hébergement
  mutualisé OVH ne fait pas tourner de processus Node persistant.
- **Migration globale Next.js** : rejetée — aucune valeur pour un site vitrine statique,
  coût de migration élevé, perte des acquis (perf, Content Collections). Interdit par le
  cadrage courant.
- **Cloudflare Pages comme cible principale** : écarté au profit d'OVH (choix
  d'hébergeur contractuel de la structure) ; `_headers` reste maintenu en miroir.

## Conséquences

- Le déploiement se résume à `npm run build` puis upload de `dist/` (SFTP/CI) — documenté
  dans le README, section « Déploiement OVH ».
- Reproductibilité : `.nvmrc` (Node LTS) et champ `engines` dans `package.json`.
- Toute évolution de la politique d'en-têtes doit être reportée dans **les deux** fichiers
  (`.htaccess` et `_headers`).
- La page `/pro` (et toute page pro future) reste `noindex`, hors sitemap et hors
  navigation publique principale.
