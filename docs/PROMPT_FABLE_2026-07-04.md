# Prompt Claude Code (Fable 5) — Durcissement technique, ergonomie, GED, cybersécurité/RGPD

> À coller tel quel dans Claude Code (VS Code), à la racine du dépôt `santinnovation-web`.
> Le dépôt est déjà un projet **Astro (SSG statique)**. Ne pas repartir de zéro, ne pas migrer vers Next.js.

---

Tu es ingénieur full-stack senior + expert front-end + référent sécurité, sur le site **Maisons de Santé Pluriprofessionnelles Sant'Innovation** (Besançon). Le dépôt est un site **Astro en sortie statique (SSG)**, TypeScript strict, Tailwind v4, contenu typé en Content Collections (Zod), carte Leaflet + fond CARTO. Aucune donnée patient, RDV délégué à Doctolib. L'espace `/pro` est une **GED simulée** (teaser produit), pas un backend réel.

## 0. Avant de coder

1. Lis d'abord : `docs/VISION.md`, `docs/PLAN_ACTION.md`, `docs/AUDIT_TECHNIQUE_2026-07-03.md`, `README.md`, puis `src/data/pro.ts`, `src/components/SiteMap.astro`, `src/scripts/interactions.ts`, `src/styles/global.css`, `astro.config.mjs`, `public/`.
2. **Propose d'abord** un plan d'exécution court (arborescence cible, décisions d'archi, ADR) et un ou deux ADR dans `docs/adr/`. N'implémente les gros déplacements de fichiers qu'après avoir posé l'ADR.
3. Travaille par petits lots cohérents. Après chaque lot : `npm run check` puis `npm run build` doivent passer. Aucune régression d'accessibilité.

## Garde-fous permanents (non négociables)

- TypeScript **strict**, pas de `any` inutile, pas de secret en dur, aucune donnée patient/RIB réelle.
- Toute animation reste derrière `prefers-reduced-motion: no-preference` **et** `(hover: hover) and (pointer: fine)`, sans dépendance de contenu (inerte au clavier/tactile).
- Contrastes AA, focus visibles, HTML sémantique, `/pro` reste `noindex` et hors sitemap/nav publique.
- Séparation stricte **public ↔ pro**. Le pro reste une simulation clairement étiquetée.

---

## Lot 1 — Séparation back/front & préparation hébergement OVH

Objectif : rendre le déploiement OVH simple et la frontière front/back nette.

1. **Cible d'hébergement = OVH.** Le front public est 100 % statique (`dist/`), déployable sur OVH hébergement mutualisé (Apache) ou OVH via CI. Le futur backend pro (GED, auth) est un **projet séparé**, non construit ici, mais documenté.
2. **Corrige le mécanisme d'en-têtes de sécurité :** OVH mutualisé = Apache et **n'interprète pas `public/_headers`** (spécifique Cloudflare/Netlify). Crée `public/.htaccess` (Apache) portant : redirection HTTPS, HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`/`X-Frame-Options`, compression + cache des assets. Conserve `public/_headers` en parallèle si un déploiement Cloudflare reste possible, et documente lequel s'applique où.
3. **Frontière front/back explicite :** structure le dépôt pour que le public (`src/pages`, `src/components`, `src/content`, `src/data`, `src/lib`, `src/styles`) soit sans dépendance serveur. Isole tout ce qui préfigure le backend (types GED, contrats d'auth) dans un dossier dédié `src/pro/` (ou `packages/pro-contracts/`) importable côté front pour la démo mais pensé pour migrer vers une app serveur distincte. Documente ce découpage dans un ADR `docs/adr/0001-separation-front-back-ovh.md`.
4. **Reproductibilité :** ajoute `.nvmrc` (Node LTS), champ `engines` dans `package.json`, et une section « Déploiement OVH » dans le `README.md` (build → upload `dist/` par SFTP/CI, rôle du `.htaccess`).
5. Mets à jour `astro.config.mjs` (`site`) et la doc si l'URL/hébergeur changent.

## Lot 2 — Ergonomie : supprimer les renvois à la ligne parasites

1. **Boutons d'itinéraire (`src/components/SiteMap.astro`) :** les 4 modes (Transports, À pied, Vélo, **Voiture**) sont en `flex flex-wrap` et « Voiture » retombe seul à la ligne. Remplace par une **grille 2×2 régulière** (`grid grid-cols-2 gap-2`) — ou une rangée unique si tout tient proprement — pour un pavé homogène. Ajoute `whitespace-nowrap` sur les libellés. Vérifie le rendu à 320/390 px et en desktop.
2. **Audit global des débordements/retours à la ligne disgracieux** (header nav, badges, cartes pro, CTA icône+texte) : applique `whitespace-nowrap` là où un libellé court ne doit jamais se couper, et corrige tout débordement horizontal mobile (le test `scrollWidth === clientWidth` doit tenir à 390 px — cf. AUD-013).
3. Reste sobre : pas de nouvelle mise en page, on lisse l'existant.

## Lot 3 — Animations 3D : plus discrètes, mais perceptibles

1. **Réduis l'angle des tuiles :** dans `src/scripts/interactions.ts`, `MAX_TILT_DEG = 5` est trop marqué → passe à **~2.5–3°**. Adoucis aussi la carte isométrique de `SiteMap.astro` (`rotateX(24deg)` → ~14–16°) pour un basculement plus subtil au repos.
2. **Ajoute des micro-animations 3D discrètes mais perceptibles** par un visiteur attentif, jamais gênantes :
   - léger flottement/parallaxe lent des couches de profondeur du hero (aurora, grille en perspective, champ de points) ;
   - respiration très lente des marqueurs de carte / du logo ;
   - profondeur au scroll (translation Z douce ou parallaxe faible sur 1–2 éléments clés) ;
   - reflet (`.tilt-glare`) conservé mais atténué.
   Amplitudes faibles, durées longues (≥ 6 s pour les boucles), 60 fps, `will-change` maîtrisé, tout coupé sous `prefers-reduced-motion`. Objectif : « ça vit » sans distraire.

## Lot 4 — GED : préparer 2FA + Pro Santé Connect, affiner les profils

Ne construis **pas** d'auth réelle. Prépare proprement le terrain (types, contrats, UI de démo étiquetée).

1. **Modèle d'authentification (dans `src/pro/` ou `src/data/pro.ts`) :** ajoute des types `AuthMethod = "password" | "totp_2fa" | "pro_sante_connect"`, un état MFA, une `Session` simulée, et une identité **Pro Santé Connect** (OIDC : `subject`, `idNat`/RPPS, code profession/spécialité, `loa`/niveau de garantie). Prévois des **placeholders de configuration OIDC PSC** (issuer, scopes `openid`, endpoints) **sans aucun secret**.
2. **Affine les profils/permissions :** transforme les rôles `admin | coordination | professional | replacement | external_partner | read_only` en une **matrice de capacités** explicite par action (`read | download | deposit | update | validate | manage_users | admin`) via un objet `AccessPolicy` typé, plutôt que la seule liste `acces[]` par document. Documente en une ligne l'intention de chaque rôle.
3. **UI de démonstration :** crée `/pro/login` (page `noindex`, `chrome="pro"`) montrant, clairement marqués « démonstration » : bouton **« S'identifier avec Pro Santé Connect »**, étape **2FA (code TOTP)**, et rappel que l'accès réel exigera auth forte côté serveur. Aucune vraie soumission.
4. Documente la cible (PSC OIDC + 2FA TOTP + RBAC serveur par ressource + journal immuable + qualification **HDS** avant tout dépôt lié au soin) dans `SECURITY.md`.

## Lot 5 — Cybersécurité & conformité RGPD

1. **En-têtes de sécurité** (via `.htaccess` OVH du Lot 1) : CSP stricte adaptée aux sources réellement utilisées (self, CARTO tiles, Leaflet), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, protection anti-framing.
2. **Durcissement des données (Zod, `src/content.config.ts`) :** contraindre les URLs (Doctolib, partenaires) au protocole **HTTPS** + allowlist de domaines. **Échapper/sanitiser** le HTML injecté dans les marqueurs Leaflet de `SiteMap.astro` (`${s.court}` inséré brut = risque d'injection) — encoder ou construire via DOM.
3. **Dépendances :** monter **Astro** vers une version corrigée (XSS haute signalée), `npm audit`, activer/mentionner Dependabot + secret scanning ; recette de non-régression après montée.
4. **Carte & tiers :** documenter CARTO comme sous-traitant, chargement au besoin, pas de cookie tiers avant consentement ; trancher la nécessité d'un bandeau cookies dans la doc.
5. **RGPD / pages légales :** structure (sans inventer de personnes réelles — laisse des champs à compléter balisés `À COMPLÉTER`) `mentions-legales`, `confidentialite` (art. 13 : finalités, bases légales, destinataires, durées, droits, DPO, sous-traitants **OVH/Doctolib/CARTO**, transferts) et `accessibilite` (trame déclaration RGAA). Crée/complète `SECURITY.md` et `ARCHITECTURE.md`.

## Lot 6 — Mettre à jour les documents de cadrage & la stack

1. **Purge les technologies inadaptées** des docs : `VISION.md`, `README.md` et toute référence à **Next.js / App Router / Prisma / PostgreSQL / S3** comme stack *actuelle* → la stack réelle est **Astro SSG + Tailwind v4 + TS strict + Content Collections + Leaflet/CARTO**, hébergement **OVH**. Reformule les briques serveur (Prisma/Postgres/objet) uniquement comme **cible V1.5 du backend pro séparé**, pas comme l'existant.
2. Mets à jour la **liste des technologies utilisées** (README) et l'hébergeur (OVH, plus Cloudflare Pages par défaut).
3. Reporte l'avancement dans `docs/PLAN_ACTION.md` (coche/actualise les items traités : `.htaccess`/en-têtes, Zod URLs, Leaflet escaping, Astro upgrade, SECURITY/ARCHITECTURE, séparation front/back, sitemap `/pro`).

---

## Méthode de livraison

1. Plan + ADR d'abord (attends confirmation implicite via commits atomiques nommés par lot).
2. Un commit par lot, message clair en français.
3. `npm run check` + `npm run build` verts après chaque lot ; vérifie 320/390 px et `prefers-reduced-motion`.
4. Termine par un récapitulatif : fichiers créés/modifiés, décisions d'archi, points restant à valider côté métier/juridique (DPO, hébergeur contractuel, RPPS).

**Interdits :** migrer vers Next.js, introduire une vraie auth/base de données, publier des données patient/secrets, casser l'accessibilité ou le rendu mobile.
