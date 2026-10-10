# Sant’Innovation — site public et administration

Astro fournit le site statique ; Payload fournit une administration réelle séparée. Aucun compte patient, formulaire médical, GED ni automatisation de réseaux sociaux. Depuis la validation du 10 octobre 2026, le prototype public GitHub Pages présente les textes et les coordonnées professionnelles approuvés dans `content/approved/`, avec un bandeau discret et `noindex`. Le CMS, les brouillons et les documents internes restent privés. Les tests utilisent une base synthétique distincte.

## Démarrer la recette synthétique

Node 24 LTS recommandé (`.nvmrc`). Deux installations indépendantes et verrouillées :

```sh
npm ci
npm --prefix cms ci
npm --prefix cms run init
npm --prefix cms run seed:demo
npm --prefix cms run dev
```

Le CMS ouvre `http://127.0.0.1:3001/admin`. Les identifiants générés sont dans `cms/.local/identifiants-locaux.json`, avec permissions privées, jamais affichés dans les journaux. Ce compte ne doit pas être utilisé sur un serveur distant. Le seed ne publie que des données **fictives dans la base locale** ; il refuse une base contenant déjà du contenu.

Dans d’autres terminaux :

```sh
npm run publish:local
npm run serve:local
npm run publication:watch
```

Le public local est `http://127.0.0.1:4321`. Le worker vérifie chaque minute la projection publique ; une sauvegarde de brouillon ne change pas cette projection. Il génère une sortie neuve puis bascule le lien local seulement si tout réussit. Statut visible dans le tableau de bord CMS. Aucun push, transfert externe ou déploiement n’est effectué par ces commandes.

`npm run build` refuse désormais de fonctionner sans snapshot. `ALLOW_HISTORICAL_BUILD=1 npm run build` conserve un mode historique explicitement marqué et non indexable ; `npm run dev` reste un examen local de ces sources. **Ce mode ne doit pas être déployé.** `npm run publish:local` exige les informations générales publiées et les trois rubriques réglementaires publiées et validées dans le CMS. La production utilise ce chemin contrôlé, après validation.

## Administration quotidienne

[Guide médecin / coordination](GUIDE_ADMINISTRATION_SANTINNOVATION.md) : professionnels, lieux, actualités, activités, innovation, partenaires, informations, rubriques, images, aperçu, versions, dates et accès. Ni Markdown ni Git nécessaires.

## Contrôles

```sh
npm run test:unit
npm run check
npm run publish:local
npm --prefix cms run check
npm --prefix cms run build
npm --prefix cms test -- --http
npm run publish:local
npx playwright install chromium
npm run test:browser
# CMS local démarré sur 3001 et fixtures synthétiques uniquement :
npm run test:admin-ui
npm run test:publication
npm run test:worker
npm audit
npm --prefix cms audit
```

Les tests CMS utilisent une base neuve synthétique à chaque exécution. Les tests navigateur utilisent la release locale synthétique. La CI contrôle le code et les deux modes de prototype avant de déployer les seuls contenus approuvés sur GitHub Pages, après un push autorisé vers `main`. Aucun déploiement OVH ni accès à un CMS distant dans ce workflow.

## Fichiers faisant autorité

- `cms/src/collections.ts` : formulaires, champs, statuts, validations, droits.
- `cms/src/lib/access.ts` : autorisations ; `cms/src/payload.config.ts` : serveur et stockage privé.
- `cms/scripts/export.ts` : sélection locale du publié et des médias référencés.
- `scripts/project-content.mjs` : projection de champs autorisés, validation des relations et nettoyage HTML.
- `src/content.config.ts` : schémas Astro de la projection publique.
- `scripts/release.mjs` : construction/bascule locale ; `scripts/watch-publication.mjs` : actualisation.
- `src/pages`, `src/components`, `src/styles` : présentation Astro.
- `src/content` et les valeurs de repli `src/data` : historique à vérifier, jamais source éditoriale quotidienne du CMS.
- `src/pro/demo` : sources préservées de la démo GED, absentes des routes générées.

## Documents

[Architecture](ARCHITECTURE.md) · [Sécurité](SECURITY.md) · [Choix CMS](docs/adr/0003-administration-payload-astro.md) · [Vérification des contenus](docs/VERIFICATION_CONTENUS.md) · [Maintenance](docs/MAINTENANCE.md) · [Déploiement et retour arrière](docs/DEPLOIEMENT_RETOUR_ARRIERE.md) · [Livraison](LIVRAISON_SITE_MSP.md).

L’utilisateur a confirmé l’achat d’un **Hébergement Web Pro OVHcloud** le 9 octobre 2026. Cette offre reste la cible du site public statique. Payload et son worker nécessitent un environnement Node persistant : leur fonctionnement sur cette offre mutualisée n’est pas établi et les modèles VPS fournis ne s’y appliquent pas. Aucun achat supplémentaire ni déploiement OVH n’est engagé. Le choix d’une administration compatible avec l’offre souscrite doit être résolu avant la mise en production complète. Voir [la décision actualisée](docs/adr/0004-prototype-github-et-ovh-pro.md).

## Prototype approuvé et reprise après incident

`npm run build:approved-prototype` construit les seuls neuf fichiers JSON de `content/approved/` ; `npm run test:approved-prototype` vérifie la projection, les liens, l’absence de routes privées, le bandeau, `noindex` et le manifeste. La source est volontairement fixe, les champs sont strictement limités et le HTML nettoyé. Aucun export automatique d’une base éditoriale n’alimente GitHub Pages. Les rubriques réglementaires y exposent les limites de cette présentation : elles ne sont pas déclarées validées pour la production.

La publication locale du CMS et ce prototype GitHub sont deux circuits distincts : le bouton Publier du CMS ne met pas automatiquement GitHub à jour. Les modifications du prototype doivent être approuvées puis intégrées au snapshot. Le guide sans code du CMS demeure applicable au circuit local ; son hébergement distant avec OVH Pro reste à résoudre.

Le mode synthétique est conservé pour la recette :

`npm run build:prototype` crée une base fictive neuve et une sortie `prototype-dist/` ; `npm run test:prototype` vérifie le bandeau, les liens, l’absence de routes privées et de marqueurs de brouillon. Pour conserver une sortie précédente, choisir un dossier neuf avec `PROTOTYPE_OUT_DIR`. La commande refuse d’écraser un dossier existant.

Publication robuste, retour arrière, sauvegardes chiffrées et restauration sont documentés dans [la maintenance](docs/MAINTENANCE.md), [les outils d’exploitation](ops/README.md) et [le rapport de corrections](docs/recette/CORRECTIONS_AUDIT_2026-10-09.md). Les opérations destructives restent explicites ; une restauration ne remplace jamais une base existante.
