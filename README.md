# Sant'Innovation — site public

Site vitrine des **Maisons de Santé Pluriprofessionnelles Sant'Innovation**, organisation pluriprofessionnelle multisite à Besançon.

Site statique, sobre et premium, sans données patients, sans prise de rendez-vous interne : la prise de rendez-vous redirige vers **Doctolib**.

## Stack

- **Astro** (sortie statique) + **MDX**
- **Tailwind CSS v4** (design tokens dans `src/styles/global.css`)
- **TypeScript strict**
- Polices auto-hébergées via **Fontsource** (Sora, Inter, IBM Plex Mono) — pas de CDN tiers, conforme RGPD
- Contenu typé en **Content Collections** (Zod)
- Hébergement cible : **Cloudflare Pages**

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build statique -> dist/
npm run preview  # prévisualise le build
npm run check    # vérification de types Astro
```

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
└── styles/          Design system (tokens, base, composants CSS)
public/              Fichiers statiques (favicon, robots.txt, images)
docs/                VISION.md et documentation projet
```

## Design « Depth » (v2)

Refonte 3D du design system (`src/styles/global.css` + `src/scripts/interactions.ts`) :

- **Élévations** : ombres multi-couches teintées bleu (`--shadow-e1` → `--shadow-e4`), lumière venant du haut (liserés clairs).
- **Surfaces** : `.surface` (cartes élevées), `.glass` / `.glass-dark` (panneaux de verre avec flou).
- **Tilt 3D** : les cartes `.tilt` s'inclinent vers le pointeur avec reflet (`.tilt-glare`) et parallaxe interne (`.tilt-pop`). Désactivé au clavier, au tactile et avec `prefers-reduced-motion`.
- **Profondeur d'arrière-plan** : nappes aurora, grille en perspective, champ de points.
- **Révélations au scroll** : IntersectionObserver + fallback complet sans JavaScript (`html.no-js`).

## Espace professionnel (préfiguration GED)

- `/pro` : portail de démonstration de la bibliothèque documentaire interne — **noindex**, séparé du site public (`chrome="pro"`).
- `src/data/pro.ts` : contrat de types de la GED (rôles `admin | coordination | professional | replacement | external_partner | read_only`, badges de sensibilité `interne | restreint | sensible`, documents, journal d'audit). Pensé pour être porté tel quel vers Prisma/PostgreSQL + stockage S3 en V1.5.
- Contrôle d'accès **simulé côté client** (bandeau explicite) : changement de rôle, accès refusé, journal d'accès, avertissements au dépôt. Aucun document patient, aucun secret, aucune donnée réelle.

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

Prototype V0 — squelette + page d'accueil. Voir `docs/VISION.md` pour l'arborescence complète et le plan de développement.
