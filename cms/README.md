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

Toutes les API de contenu, versions, médias et tous les aperçus exigent une authentification réelle. GraphQL est désactivé. Sessions de deux heures, cookie HttpOnly natif, SameSite Strict et Secure en production. Verrouillage après cinq échecs de connexion pendant quinze minutes. Aucun mot de passe, cookie ou jeton n’est écrit dans les logs applicatifs. L’envoi de courriel est explicitement désactivé : le lien de récupération ne peut pas délivrer de courriel tant qu’un transport n’a pas été installé et autorisé. Un administrateur peut modifier le mot de passe d’un autre compte.

Les mises à jour API des professionnels, établissements, informations générales et pages réglementaires doivent préciser une action de statut (`_status`) ou le mode brouillon (`draft=true`). Une omission ne doit ni contourner une validation ni dépublier implicitement un contenu protégé. Les éditeurs peuvent proposer un brouillon réglementaire ; seuls les administrateurs peuvent publier ou dépublier ces pages.

Les versions conservent les 50 dernières révisions par fiche. Une restauration peut remplacer la version publiée par action explicite. Pour une adresse ou des mentions légales modifiées, choisir **restaurer comme brouillon**, vérifier à nouveau puis publier. Les validations précédentes ne sont pas réutilisées aveuglément. Payload 3.90.2 ne transmet pas l’option `draft` de sa méthode Local API `restoreVersion` à l’opération ; les restaurations comme brouillon doivent passer par l’interface/REST native, qui la transmet correctement. Les tests utilisent l’opération native exportée, comme le gestionnaire REST.

## Export et séparation des responsabilités

```sh
npm run export --prefix cms -- /chemin/prive/bundle.json /chemin/version-neuve/public/media
```

L’export n’est accessible ni au navigateur ni via un endpoint. C’est une commande serveur locale, autorisée à lire la base. Elle impose `_status=published`, `visible=true`, absence d’archivage et plage temporelle admissible. Elle lit `draft:false` pour conserver la dernière version publiée même si un brouillon plus récent existe. Les relations sont résolues exclusivement dans le même ensemble publié. Un professionnel lié à un lieu non publiable bloque la génération ; retirer la relation ou masquer le professionnel avant de dépublier le lieu.

Le bundle est un **intermédiaire privé**. La projection publique et l’assainissement HTML sont effectués par `scripts/project-content.mjs` à la racine ; ne jamais servir directement le bundle. Le dossier d’images intermédiaire reste privé. Le service racine copie uniquement les noms référencés par sa projection dans une sortie publique entièrement neuve. Sa commande ne nettoie jamais un ancien dossier, afin de ne pas supprimer les sources ou une version précédente.

## Provisionnement serveur (proposition, non déployée)

L’hébergement mutualisé Apache du site statique ne peut pas exécuter cette application. Prévoir un service Node persistant, par exemple un VPS OVH administré, et une base/stockage hors racine web. L’exposition exige préalablement HTTPS, protection d’accès de la préproduction, sauvegardes, exploitation et décision d’hébergement. Les commandes `dev` et `start` restent liées à l’interface loopback et supposent un reverse proxy pour toute exposition validée.

Configurer `CMS_DATA_DIR` absolu, `CMS_SERVER_URL` et `PAYLOAD_SECRET` côté serveur (voir `.env.example`), puis :

```sh
NODE_ENV=production npm run migrate --prefix cms
NODE_ENV=production npm run init --prefix cms
npm run build --prefix cms
npm run start --prefix cms
```

Initialiser le premier compte **avant toute exposition réseau**, changer son identité locale fictive et son mot de passe, puis garder le fichier d’identifiants hors service web. Ne jamais lancer `seed:demo` en production. Le schéma de production utilise les migrations versionnées, pas `push`. Après modification du modèle, générer et relire une nouvelle migration sur une copie de la base, tester migration et restauration avant déploiement. Sauvegarder la base SQLite de façon cohérente avec ses journaux (outil SQLite de sauvegarde ou arrêt du service), les médias et le secret avant toute mise à jour. La procédure générale de déploiement/retour arrière est à la racine.

## Contrôles

```sh
npm run check --prefix cms
npm run build --prefix cms
npm test --prefix cms
npm test --prefix cms -- --http
npm audit --prefix cms
```

Les tests créent une nouvelle base synthétique sous `.local/tests/`. Ils ne réinitialisent pas la base courante. Le mode HTTP lance un serveur loopback sur 3111 avec compilation isolée `.next-test`, puis l’arrête. Le rapport sans identifiants est `.local/last-test-report.json`. Les comptes, secrets et pièces de recette restent ignorés par Git.

Le verrouillage npm contient des overrides de sécurité pour `sass`, `undici`, `dompurify` et `esbuild`. Ils corrigent les avis détectés dans les dépendances transitives de Payload ; vérifier de nouveau audit, typage, compilation et tests avant leur évolution.
