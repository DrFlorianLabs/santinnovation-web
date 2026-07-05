# Sant'Innovation — site public

Site vitrine des **Maisons de Santé Pluriprofessionnelles Sant'Innovation**, organisation pluriprofessionnelle multisite à Besançon.

Site statique, sobre et premium, sans données patients, sans prise de rendez-vous interne : la prise de rendez-vous redirige vers **Doctolib**.

## Stack

- **Astro 7** (sortie statique SSG) + **MDX**
- **Tailwind CSS v4** (design tokens dans `src/styles/global.css`)
- **TypeScript strict**
- Contenu typé en **Content Collections** (Zod — URLs contraintes HTTPS + allowlist)
- **Leaflet** bundlé + fond de carte **CARTO** (seul appel tiers du site)
- Polices auto-hébergées via **Fontsource** (Sora, Inter, IBM Plex Mono) — pas de CDN tiers, conforme RGPD
- Hébergement : **OVH** (mutualisé Apache — voir « Déploiement OVH » et `docs/adr/0001`)

Voir `ARCHITECTURE.md` (frontières, invariants) et `SECURITY.md` (politique de sécurité).

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build statique -> dist/
npm run preview  # prévisualise le build
npm run check    # vérification de types Astro
```

Version de Node : voir `.nvmrc` (`nvm use`). Le champ `engines` de `package.json` fixe le minimum supporté.

## Déploiement OVH

Le site est 100 % statique : le déploiement consiste à publier le contenu de `dist/`
sur l'hébergement mutualisé OVH (Apache).

1. `npm ci && npm run build` — la sortie complète est dans `dist/`.
2. Uploader le **contenu** de `dist/` à la racine web du site (`www/`) par SFTP,
   ou via CI (GitHub Actions + SFTP/rsync).
3. Le fichier `public/.htaccess` (copié dans `dist/`) porte la configuration Apache :
   redirection HTTPS, HSTS, CSP et autres en-têtes de sécurité, compression, cache.
   **C'est lui qui s'applique sur OVH.**
4. `public/_headers` porte la même politique pour un éventuel déploiement
   Cloudflare Pages (prévisualisation) ; il est ignoré par Apache. Les deux fichiers
   doivent rester synchronisés (cf. `docs/adr/0001-separation-front-back-ovh.md`).

Après chaque mise en production : vérifier les en-têtes (`curl -I https://santinnovation.fr`)
et l'absence de régression sur les pages clés.

## Frontière front / back

Le site public est sans dépendance serveur. Tout ce qui préfigure le backend pro
(types GED, contrats d'authentification) vit dans **`src/pro/`** (alias `@pro/*`),
pensé pour migrer vers une application serveur distincte en V1.5 — voir
`src/pro/README.md` et les ADR `docs/adr/`.

## Structure

```
src/
├── components/      Composants UI réutilisables (.astro)
├── layouts/         BaseLayout (SEO, header, footer, accessibilité)
├── pages/           Routage par fichier
├── content/         Contenu éditorial (professionnels, lieux, actualités)
├── content.config.ts  Schémas Zod des collections
├── data/            Données globales (site, navigation, doctolib, partenaires)
├── lib/             Helpers (format, itinéraires)
├── pro/             Contrats du futur backend pro (types GED, auth) — cf. src/pro/README.md
├── scripts/         interactions.ts (tilt, reveal, parallaxe)
└── styles/          Design system (tokens, base, composants CSS)
public/              Fichiers statiques (.htaccess, _headers, favicon, robots.txt)
docs/                VISION.md, PLAN_ACTION.md, ADR (docs/adr/)
```

## Design « Depth » (v2)

Refonte 3D du design system (`src/styles/global.css` + `src/scripts/interactions.ts`) :

- **Élévations** : ombres multi-couches teintées bleu (`--shadow-e1` → `--shadow-e4`), lumière venant du haut (liserés clairs).
- **Surfaces** : `.surface` (cartes élevées), `.glass` / `.glass-dark` (panneaux de verre avec flou).
- **Tilt 3D** : les cartes `.tilt` s'inclinent vers le pointeur avec reflet (`.tilt-glare`) et parallaxe interne (`.tilt-pop`). Désactivé au clavier, au tactile et avec `prefers-reduced-motion`.
- **Profondeur d'arrière-plan** : nappes aurora, grille en perspective, champ de points.
- **Révélations au scroll** : IntersectionObserver + fallback complet sans JavaScript (`html.no-js`).

## Espace professionnel (démonstration GED)

- `/pro` et `/pro/login` : **démonstration produit** de la future bibliothèque
  documentaire — **noindex**, hors sitemap et hors navigation publique,
  chrome séparé (`chrome="pro"`).
- `src/pro/` : contrats typés de la cible V1.5 — modèle documentaire
  (`ged.ts` : rôles, sensibilités, journal), authentification
  (`auth.ts` : Pro Santé Connect, 2FA TOTP, session — aucun secret) et
  matrice de capacités (`access.ts` : `AccessPolicy`).
- Contrôle d'accès **simulé côté client** (bandeau explicite). Aucun document
  patient, aucun secret, aucune donnée réelle.
- La GED réelle sera une **application serveur séparée** (V1.5) : auth forte
  (PSC + TOTP), RBAC serveur par ressource, journal immuable, qualification
  HDS avant tout document lié au soin. Les briques serveur (base de données,
  stockage objet chiffré) relèvent de ce futur projet, pas de ce dépôt.
  Voir `docs/adr/0002` et `SECURITY.md`.

## Modifier le contenu

- **Un professionnel** : ajouter / éditer un fichier dans `src/content/professionnels/`.
- **Un site** : `src/content/lieux/`.
- **Une actualité** : `src/content/actualites/`.
- **Liens & contacts** : `src/data/`.

Les champs disponibles et leur validation sont décrits dans `src/content.config.ts`.
Une intégration CMS (Decap / Sveltia) est prévue en V1.5 pour éditer ces contenus sans toucher au code.

## Principes

- Aucune donnée patient, aucun formulaire médical, aucune messagerie médicale sur le site.
- Prise de rendez-vous : redirection vers Doctolib uniquement.
- Accessibilité (contrastes AA, navigation clavier, focus visible, `prefers-reduced-motion`).
- SEO local (métadonnées, Open Graph, JSON-LD `MedicalOrganization`, sitemap).

## État

Prototype V0 durci (juillet 2026) : pages principales + carte + démo pro,
en-têtes de sécurité versionnés, pages légales structurées (champs
« À COMPLÉTER » en attente de validation juridique). Suivi d'avancement :
`docs/PLAN_ACTION.md` ; cadrage : `docs/VISION.md`.
