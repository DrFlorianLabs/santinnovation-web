# Architecture — Sant'Innovation Web

## Vue d'ensemble

Site vitrine **Astro en sortie statique (SSG)** : le build produit `dist/`,
servi tel quel par l'hébergement mutualisé **OVH** (Apache). Aucun serveur
applicatif, aucune base de données, aucun secret d'exécution.

```
Navigateur ── HTTPS ──> OVH (Apache + .htaccess : HTTPS, HSTS, CSP…)
                          └── dist/ (HTML/CSS/JS statiques, fontes auto-hébergées)
Navigateur ── HTTPS ──> *.basemaps.cartocdn.com (tuiles de carte, images seulement)
Navigateur ── HTTPS ──> doctolib.fr (prise de rendez-vous, site tiers)
```

## Stack

- **Astro 7** (SSG) + **TypeScript strict** (`noUncheckedIndexedAccess`, etc.)
- **Tailwind CSS v4** — design tokens dans `src/styles/global.css`
- **Content Collections** validées par **Zod** (`src/content.config.ts`) :
  URLs contraintes à HTTPS + allowlist de domaines
- **Leaflet** (bundlé, pas de CDN) + fond **CARTO** ; marqueurs construits en
  DOM (`textContent`), jamais par interpolation HTML
- Fontes auto-hébergées (**Fontsource** : Sora, Inter, IBM Plex Mono)
- Aucun analytics, aucun cookie

## Arborescence

```
public/            .htaccess (OVH/Apache — s'applique en prod), _headers
                   (miroir Cloudflare Pages), robots.txt, favicon
src/
├── pages/         Routage fichier ; /pro/* = démo GED (noindex, hors sitemap)
├── layouts/       BaseLayout (SEO, JSON-LD, skip-link, chrome public|pro)
├── components/    UI publique réutilisable
├── content/       Contenu éditorial (professionnels, lieux, actualités)
├── content.config.ts  Schémas Zod durcis
├── data/          Données globales non éditoriales (site, nav, doctolib…)
├── lib/           Helpers purs
├── scripts/       interactions.ts (tilt, reveal, parallaxe — reduced-motion)
├── styles/        global.css (tokens + composants CSS)
└── pro/           FRONTIÈRE FRONT/BACK : contrats de la future app serveur
    ├── ged.ts     Modèle documentaire + données de démonstration
    ├── auth.ts    Contrats Pro Santé Connect / 2FA TOTP (aucun secret)
    └── access.ts  Matrice de capacités par rôle (AccessPolicy)
docs/adr/          Décisions d'architecture (0001 OVH/frontière, 0002 auth GED)
```

## Frontières et invariants

1. **Public ↔ pro** : le site public n'importe jamais `src/pro/*` ; seules les
   pages `/pro/*` (démo étiquetée) le font. La GED réelle (V1.5) sera une
   **application serveur séparée** (sous-domaine, dépôt, cycle de déploiement
   propres) — cf. `docs/adr/0001`.
2. **Aucune donnée réelle sensible** dans le dépôt : ni patient, ni RIB, ni
   secret (cf. `SECURITY.md`).
3. **CSP sans inline** : `astro.config.mjs` force les styles et scripts en
   fichiers externes (`inlineStylesheets: "never"`, `assetsInlineLimit: 0`).
   Toute modification de la politique d'en-têtes se fait dans `.htaccess`
   **et** `_headers`.
4. **Contenu non fiable** : tout ce qui vient de `src/content/` est validé par
   Zod et ne doit jamais être interpolé en HTML brut (préparation CMS V1.5).
5. **Animations** : uniquement sous `prefers-reduced-motion: no-preference`
   et, pour les effets 3D/parallaxe, `(hover: hover) and (pointer: fine)` ;
   aucun contenu n'en dépend.

## Build & déploiement

- `npm run check` (types) et `npm run build` (SSG) doivent être verts.
- Node : voir `.nvmrc` ; `engines` dans `package.json`.
- Déploiement : upload du contenu de `dist/` sur OVH (SFTP/CI) — voir README,
  section « Déploiement OVH ».
