# Sant’Innovation — site public et administration

Candidat local à la recette indépendante. Astro est conservé ; Payload fournit une administration réelle séparée. Aucun compte patient, formulaire médical, GED ni automatisation de réseaux sociaux. Aucun déploiement effectué.

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

`npm run dev` / `npm run build` sans snapshot restent disponibles pour examiner les sources historiques : **ce mode n’est pas une livraison de contenu validée**. `npm run publish:local` exige les informations générales publiées et les trois rubriques réglementaires publiées et validées dans le CMS. La production utilise ce chemin contrôlé, après validation.

## Administration quotidienne

[Guide médecin / coordination](GUIDE_ADMINISTRATION_SANTINNOVATION.md) : professionnels, lieux, actualités, activités, innovation, partenaires, informations, rubriques, images, aperçu, versions, dates et accès. Ni Markdown ni Git nécessaires.

## Contrôles

```sh
npm run test:unit
npm run check
npm run build
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

Les tests CMS utilisent une base neuve synthétique à chaque exécution. Les tests navigateur utilisent la release locale synthétique. Le CI ne déploie rien.

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

L’hébergement OVHcloud est privilégié mais non commandé/configuré. Payload et le worker nécessitent un serveur Node persistant : le mutualisé statique seul ne suffit pas. Les contenus réels, mentions légales, accès, budget et ouverture publique restent soumis à validation.
