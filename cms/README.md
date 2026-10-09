# Administration éditoriale Sant’Innovation

Application **Payload 3.90.2 / Next 16.4.0**, distincte du site Astro et de l’ancienne démonstration `/pro`. Elle ne contient aucune fonction de soins, dossier patient, formulaire médical ou GED.

## Démarrage de la recette locale

Depuis la racine du dépôt :

```sh
npm ci --prefix cms
npm run init --prefix cms
npm run seed:demo --prefix cms
npm run dev --prefix cms
```

L’administration écoute seulement sur `http://127.0.0.1:3001/admin`. `init` conserve les comptes existants. Lors du premier lancement, il génère un secret et un mot de passe aléatoires dans `cms/.local/`, ignoré par Git, avec permissions privées. Lire `cms/.local/identifiants-locaux.json` localement pour se connecter ; ne jamais joindre ce fichier à un audit, une capture ou un commit. Les fixtures `seed:demo` sont fictives, refusent une base qui contient déjà du contenu et conservent les modifications aux lancements suivants.

La publication publique est assurée par le service local documenté à la racine. Le CMS enregistre le contenu, le service exporte uniquement les versions publiées puis reconstruit Astro. Une prévisualisation privée d’une fiche est accessible par le bouton d’aperçu après enregistrement. Elle présente le contenu et ses horaires, mais n’est pas un rendu identique au site public final. Le tableau de bord montre le dernier état de génération confirmé par le service.

## Modèle éditorial

- Professionnels : identité, profession, domaines, activités, présentation, photo, coordonnées, lieux multiples, horaires par lieu, Doctolib, masquage, archivage.
- Établissements : adresse, téléphone/courriel, horaires, transports, accessibilité, coordonnées GPS, images et itinéraire. Modifier l’adresse ou la position invalide la confirmation préalable ; enregistrer le brouillon, vérifier, confirmer puis publier.
- Actualités : catégorie, résumé, texte mis en forme, image, mise en avant, dates d’affichage et d’événement.
- Activités, recherche/innovation, partenaires, rubriques éditoriales et informations générales.
- Les pages légales exigent une validation administrateur après modification. L’identité d’une rubrique est fixe après sa création, y compris en brouillon : une page légale ne peut pas être déplacée vers une rubrique courante pour contourner la validation. Les rubriques correspondent à une liste fermée de routes ; aucun code, paramètre de sécurité ou navigation technique n’est éditable.

Les images sont limitées à JPEG, PNG et WebP, 5 Mo. Elles sont immuables : pour remplacer une image ou corriger son texte alternatif, créer une nouvelle image puis la choisir dans un brouillon et publier. Cela évite de modifier publiquement une image utilisée ailleurs sans publication du contenu. Tous les fichiers source et leurs métadonnées sont privés dans le CMS. Les images d’un contenu publié sont copiées dans la nouvelle version statique avec un nom SHA-256.

Le fuseau de l’administration et de l’aperçu est Europe/Paris. Les dates sont stockées en UTC. L’heure d’affichage dépend du prochain cycle réussi du service de publication, pas d’un traitement d’arrière-plan du CMS.

## Droits et protection

Deux rôles natifs : `admin` et `editor`. Les éditeurs administrent les contenus courants ; seuls les administrateurs gèrent les comptes, informations générales et validation réglementaire. Pas de compte individuel professionnel en V1. La suppression est désactivée pour les contenus et images : utiliser masquage ou archivage. Les administrateurs peuvent révoquer un compte.

Toutes les API de contenu, versions, médias et tous les aperçus exigent une authentification réelle. GraphQL est désactivé. Sessions de deux heures, cookie HttpOnly natif, SameSite Strict et Secure en production. Verrouillage après cinq échecs de connexion pendant quinze minutes. Aucun mot de passe, cookie ou jeton n’est écrit dans les logs applicatifs. L’envoi de courriel et la récupération par courriel sont explicitement désactivés. Un administrateur peut modifier le mot de passe d’un autre compte.

Les mises à jour API des professionnels, établissements, informations générales et pages réglementaires doivent préciser une action de statut (`_status`) ou le mode brouillon (`draft=true`). Une omission ne doit ni contourner une validation ni dépublier implicitement un contenu protégé. Les éditeurs peuvent proposer un brouillon réglementaire ; seuls les administrateurs peuvent publier ou dépublier ces pages.

Un établissement utilisé par un professionnel publié ne peut pas être dépublié, masqué, archivé ou doté d’une période incompatible. Publier d’abord le déplacement ou le retrait des relations dans les fiches professionnelles concernées. Un brouillon professionnel plus récent ne change pas ces dépendances : seule la version réellement publiée compte. Les périodes futures doivent aussi être cohérentes ; une dépendance dont la période est terminée ne bloque plus le retrait. Les mêmes contrôles s’appliquent aux restaurations. Enregistrer un brouillon reste possible sans modifier le site.

Un éditeur peut changer son propre mot de passe dans son compte ; son identité, son adresse électronique, son rôle et le déverrouillage forcé restent du ressort d’un administrateur. Le formulaire natif renvoie aussi une confirmation de mot de passe et les métadonnées du compte : la confirmation doit être identique au nouveau mot de passe, les métadonnées doivent être inchangées, puis ces champs sont retirés avant l’écriture. Les endpoints de récupération et de réinitialisation par courriel retournent une réponse neutre identique pour tous les comptes et ne créent aucun jeton. Le endpoint `/api/access` exige lui aussi une authentification. L’installation ultérieure d’un transport de courriel ne réactive pas implicitement la récupération : elle nécessite une modification et une recette explicites de cette politique.

Les versions conservent les 50 dernières révisions par fiche. Une restauration peut remplacer la version publiée par action explicite. Pour une adresse ou des mentions légales modifiées, choisir **restaurer comme brouillon**, vérifier à nouveau puis publier. Les validations précédentes ne sont pas réutilisées aveuglément. Payload 3.90.2 ne transmet pas l’option `draft` de sa méthode Local API `restoreVersion` à l’opération ; les restaurations comme brouillon doivent passer par l’interface/REST native, qui la transmet correctement. Les tests utilisent l’opération native exportée, comme le gestionnaire REST.

## Export et séparation des responsabilités

```sh
npm run export --prefix cms -- /chemin/prive/bundle.json /chemin/version-neuve/public/media
```

L’export n’est accessible ni au navigateur ni via un endpoint. C’est une commande serveur locale, autorisée à lire la base. Elle impose `_status=published`, `visible=true`, absence d’archivage et plage temporelle admissible. Elle lit `draft:false` pour conserver la dernière version publiée même si un brouillon plus récent existe. Les relations sont résolues exclusivement dans le même ensemble publié. Un professionnel lié à un lieu non publiable bloque la génération ; retirer la relation ou masquer le professionnel avant de dépublier le lieu.

Le graphe complet des versions publiées, y compris celles à affichage futur, est contrôlé avant l’export. En cas d’incohérence, la commande échoue avec un marqueur `PUBLICATION_ERROR_JSON` destiné au service de publication : code, collection, identifiant de fiche et message contrôlé, sans données personnelles. L’API locale `exportSnapshot` accepte un quatrième argument numérique `snapshotAt` pour reproduire exactement les mêmes filtres temporels lors d’un test de restauration.

Le bundle est un **intermédiaire privé**. La projection publique et l’assainissement HTML sont effectués par `scripts/project-content.mjs` à la racine ; ne jamais servir directement le bundle. Le dossier d’images intermédiaire reste privé. Le service racine copie uniquement les noms référencés par sa projection dans une sortie publique entièrement neuve. Sa commande ne nettoie jamais un ancien dossier, afin de ne pas supprimer les sources ou une version précédente.

## Provisionnement serveur (proposition, non déployée)

L’hébergement mutualisé Apache du site statique ne peut pas exécuter cette application. Prévoir un service Node persistant, par exemple un VPS OVH administré, et une base/stockage hors racine web. L’exposition exige préalablement HTTPS, protection d’accès de la préproduction, sauvegardes, exploitation et décision d’hébergement. Les commandes `dev` et `start` restent liées à l’interface loopback et supposent un reverse proxy pour toute exposition validée.

Configurer `CMS_DATA_DIR` absolu, `CMS_SERVER_URL` et `PAYLOAD_SECRET` côté serveur (voir `.env.example`). Pour l’initialisation, injecter aussi `CMS_INIT_ADMIN_EMAIL` et `CMS_INIT_ADMIN_PASSWORD` (au moins 20 caractères), et éventuellement `CMS_INIT_ADMIN_NAME`, depuis le gestionnaire de secrets retenu. Ne pas saisir de secret dans une commande conservée dans l’historique. Puis :

```sh
NODE_ENV=production npm run migrate --prefix cms
NODE_ENV=production npm run init --prefix cms
npm run build --prefix cms
npm run start --prefix cms
```

Initialiser le premier compte **avant toute exposition réseau**. En production, `init` exige ces variables et n’écrit aucun fichier de secret ni d’identifiants ; il conserve les comptes déjà présents et ne réinitialise pas leurs mots de passe. Retirer les variables `CMS_INIT_ADMIN_*` après cette opération, conserver `PAYLOAD_SECRET` dans la configuration privée du service. Ne jamais lancer `seed:demo` sur une base de production réelle. Le schéma de production utilise les migrations versionnées, pas `push`. Après modification du modèle, générer et relire une nouvelle migration sur une copie de la base, tester migration et restauration avant déploiement. Sauvegarder la base SQLite de façon cohérente avec ses journaux (outil SQLite de sauvegarde ou arrêt du service), les médias et le secret avant toute mise à jour. La procédure générale de déploiement/retour arrière est à la racine.

Les écritures utilisent les transactions natives SQLite activées explicitement, avec WAL et `synchronous=FULL`. Une collision entre écritures est refusée et l’API retourne une réponse 409 invitant à recharger puis réessayer ; le contrôle des dépendances ne laisse pas valider deux changements incompatibles. L’option officielle `busyTimeout: 5000` s’applique à la connexion initiale. Limite vérifiée de libsql dans cette version : après rotation de connexion transactionnelle, `busy_timeout` redevient 0 ; ce paramètre ne garantit donc pas une attente de cinq secondes pour chaque écriture. Aucun correctif non officiel du pilote ni relance aveugle des écritures n’a été ajouté.

## Contrôles

```sh
npm run check --prefix cms
npm run build --prefix cms
npm test --prefix cms
npm test --prefix cms -- --http
npm test --prefix cms -- --prod
npm run test:account-ui --prefix cms
npm audit --prefix cms
```

Les tests créent une nouvelle base synthétique sous `.local/tests/`. Ils ne réinitialisent pas la base courante. Le mode HTTP lance un serveur loopback sur 3111 avec compilation isolée `.next-test`, puis l’arrête. Le mode `--prod` applique les migrations sur une base neuve, compile Next dans `.next-test-production`, lance `next start` puis exerce la même recette HTTP, avec les options de production. Il vérifie aussi l’initialisation sans fichier d’identifiants, les retraits/restaurations liés, les périodes futures, les conflits SQLite et le changement de mot de passe. Les assertions de concurrence peuvent produire un log `SQLITE_BUSY` attendu sur la base fictive. Le rapport sans identifiants est `.local/last-test-report.json`. Les comptes, secrets et pièces de recette restent ignorés par Git. Un serveur de recette supplémentaire peut choisir `CMS_DIST_DIR=.next-root-test` pour isoler sa compilation ; seule une valeur locale `.next-` suivie de lettres, chiffres ou tirets est admise.

Le verrouillage npm contient des overrides de sécurité pour `sass`, `undici`, `dompurify` et `esbuild`. Ils corrigent les avis détectés dans les dépendances transitives de Payload ; vérifier de nouveau audit, typage, compilation et tests avant leur évolution.

`test:account-ui` s’exécute après `test -- --prod` et réutilise sa compilation fraîche. Il nécessite les dépendances Playwright de la racine et Chromium. Il crée une autre base synthétique, ouvre réellement `/admin/account` avec un éditeur fictif, soumet le formulaire natif, puis vérifie le nouveau mot de passe, le refus de l’ancien et la conservation de l’identité. Aucun identifiant, mot de passe ou capture n’est enregistré dans son rapport `.local/account-ui-report.json`. Ne pas exécuter simultanément deux recettes utilisant le port3111.
