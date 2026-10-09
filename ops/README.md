# Sauvegarde, restauration et exploitation

Ces outils locaux sauvegardent le CMS et, lorsqu’elle existe, la release publique courante. La restauration crée une copie contrôlée dans un **répertoire neuf** ; elle ne remplace jamais le CMS actif et ne remet jamais d’anciennes pages en ligne.

L’offre achetée est **OVHcloud Web Pro, hébergement mutualisé**. Les modèles Nginx/systemd de ce dossier supposent un serveur Linux administrable avec Node persistant : ils constituent une référence pour une éventuelle autre architecture, **pas une configuration compatible ou déployée sur Web Pro**. La solution d’exploitation définitive reste à valider sans présumer un achat supplémentaire.

## Prérequis privés

- Node 24 LTS, dépendances racine et `cms/` installées depuis les fichiers de verrouillage, migrations CMS appliquées ; lancer les commandes depuis la racine du dépôt.
- `CMS_DATA_DIR` : chemin absolu de la base `cms.sqlite` et du dossier privé `media/`.
- `PAYLOAD_SECRET` : secret effectif du CMS, injecté par l’environnement. Pour les anciennes installations locales, le fichier privé `CMS_DATA_DIR/secret` est accepté en secours.
- `BACKUP_DIR` : répertoire privé, vide au premier usage, hors racine publique. L’outil y crée un marqueur d’appartenance ; il refuse d’adopter un répertoire non vide sans marqueur.
- `BACKUP_KEY_HEX` : 32 octets aléatoires, soit exactement 64 caractères hexadécimaux. Générer et injecter cette clé par le gestionnaire de secrets de l’opérateur ; ne pas la mettre dans une commande enregistrée, dans Git ou dans un journal. La conserver séparément des archives, avec une copie de récupération contrôlée. Une clé perdue rend les archives inutilisables.

Les commandes ci-dessous supposent ces variables déjà chargées. Aucun exemple ne contient de secret. Les archives sont créées en mode `0600`, les répertoires privés en `0700`. Les copies temporaires en clair restent dans un répertoire privé `0700`, puis sont supprimées à la fin. Prévoir l’espace libre nécessaire à plusieurs copies de la base, des médias et du site ; utiliser un disque chiffré pour limiter les traces sur le stockage. Aucun effacement physique sécurisé du disque n’est revendiqué.

## Créer une sauvegarde

```sh
node ops/backup.mjs
```

Par défaut, le site est cherché dans `PUBLICATION_ROOT/.local/site-current` (`PUBLICATION_ROOT` vaut le dépôt si absent). Options :

```sh
node ops/backup.mjs --data-dir /chemin/prive/cms-data --backup-dir /chemin/prive/backups --site-dir /chemin/release/site --require-projection
node ops/backup.mjs --without-site
```

Le fichier `.santbackup` contient, dans un conteneur authentifié AES-256-GCM :

- une copie cohérente obtenue par l’API de sauvegarde SQLite, même pendant des écritures concurrentes ; la connexion à la base source est ouverte en lecture seule ;
- tous les médias référencés par la table CMS, y compris ceux de contenus privés, et le secret CMS effectif ; les fichiers média doivent rester immuables et leur changement pendant la copie provoque un refus ;
- les utilisateurs, droits, brouillons et versions conservés dans la base ; aucune donnée CMS n’est publiée par cette opération ;
- un manifeste SHA-256 pour chaque fichier, une preuve de projection publique recalculée sur cette copie à un instant figé, le commit Git connu, l’état modifié ou non du dépôt et des empreintes de fichiers de vérification ;
- le HTML, les ressources et, si présent, le manifeste de la release statique sélectionnée.

Le site public et la base sont deux instantanés distincts : une publication peut être en retard sur le CMS. Le manifeste le précise ; aucune identité entre ces deux états n’est inventée. Le lien de release est résolu une fois avant copie. Un site incomplet ou un fichier modifié durant sa copie fait échouer la sauvegarde.

Le code source et les dépendances, certificats TLS, configuration d’hébergement, DNS, boîte mail et clés externes ne sont pas inclus. Conserver le commit correspondant et les fichiers de verrouillage ; un dépôt modifié lors de la sauvegarde nécessite de préserver aussi ses modifications. Le secret Payload est inclus uniquement **dans l’archive chiffrée** ; la clé de déchiffrement n’y figure jamais.

Si un contenu éditorial empêche l’export, le mode normal préserve quand même les données chiffrées avec `state: warning`, `projectionVerified: false` et un **code de sortie 2**. Il ne déclare pas une preuve réussie. `--require-projection` refuse au contraire de produire cette archive dégradée. Une erreur de copie ou de chiffrement rend le code 1. Le statut privé `backup-status.json` indique un échec survenu après l’ouverture du magasin et rappelle la dernière archive connue ; un échec préalable (clé ou source absente) reste signalé par le code de sortie et la fraîcheur du statut précédent. Les sorties des sous-processus CMS ne sont pas journalisées.

`BACKUP_TIMEOUT_MS` borne chaque sous-processus (180 000 ms par défaut). Aucun envoi hors machine n’est configuré : copier **les archives chiffrées** vers une destination distincte approuvée, puis comparer leurs SHA-256. Une sauvegarde uniquement sur le même disque ne protège pas contre sa perte. Ne jamais déposer le répertoire restauré, la base ou les médias privés dans une racine Web.

## Restaurer et vérifier, sans activer

Choisir un chemin qui n’existe pas, même vide. Son dossier parent doit déjà exister.

```sh
node ops/restore.mjs --archive /chemin/prive/backups/archive.santbackup --target /chemin/prive/restauration-neuve --require-projection
```

L’outil authentifie **tout** le conteneur avant extraction, contrôle chemins et SHA-256, exécute `PRAGMA integrity_check`, puis reproduit la projection sur une seconde copie indépendante à l’instant archivé. Les fichiers finalement restaurés gardent exactement les octets authentifiés. Une clé erronée, une archive altérée, une destination existante ou une projection différente échouent sans écraser de données. Si la vérification nécessite le code d’une ancienne version, préparer ce commit et ses dépendances dans un espace isolé avant de réessayer ; ne pas migrer la copie archivée en place pour contourner un échec.

Résultat attendu : `projectionVerified: true`, `activated: false`. Le dossier neuf contient `cms.sqlite`, `secret`, `media/`, `proof/projection.json`, `backup-manifest.json` et éventuellement `site/` et `site-release.json`. Le secret restauré reste privé. L’opérateur peut le réinjecter dans son système de secrets lors d’une reprise validée ; ne jamais l’afficher dans les logs.

Une archive enregistrée sans preuve peut être restaurée **sans** `--require-projection` : l’intégrité du conteneur et des fichiers reste vérifiée, mais la sortie vaut 2, `projectionVerified: false`. Il s’agit d’une récupération de données à examiner, pas d’une reprise validée. Si `siteRestored: false`, il faut reconstruire le site depuis le CMS restauré avec le code compatible ; aucune copie HTML historique n’est alors disponible.

Pour préparer la reprise : contrôler la copie dans un environnement isolé avec accès restreint, vérifier comptes, brouillons, médias et pages, puis présenter le résultat et le retour arrière à l’administrateur. Le démarrage d’un CMS restauré, le changement de variables de production, le remplacement de `site-current` et la remise en ligne d’anciennes pages sont des actions séparées nécessitant validation. Le retour arrière de cette préparation consiste simplement à laisser les services actifs inchangés ; le script n’y touche pas.

## Rotation des archives

```sh
node ops/rotate-backups.mjs --keep 10 --dry-run
```

La simulation est aussi le comportement par défaut. Elle authentifie les archives avec la clé chargée et ne sélectionne que celles appartenant au magasin identifié. Les fichiers sans nom reconnu, archives altérées, chiffrées par une autre clé ou provenant d’un autre magasin restent intouchés. Examiner les noms `retained`, `candidates` et `untouched` avant toute décision. Cette sélection conserve les N archives reconnues les plus récentes ; elle ne constitue pas une politique complète de rétention mensuelle/annuelle.

La suppression nécessite **les deux** options explicites ci-dessous, après validation du plan et de la disponibilité d’une autre copie :

```sh
node ops/rotate-backups.mjs --keep 10 --apply --confirm-rotate
```

Cette commande n’a été exercée que sur des sauvegardes synthétiques jetables. Aucun `--apply` sur les données de l’utilisateur n’a été exécuté. La rotation de sauvegardes n’est pas l’effacement complet d’une fiche, de ses versions et de tous ses dérivés ; cette procédure (audit M05) reste à définir. Aucune conformité RGPD globale n’est déduite de ces outils.

## Sonde locale

```sh
node ops/check-health.mjs
```

La sonde contrôle `CMS_DATA_DIR/publication-status.json` et, si `BACKUP_DIR` est fourni, `BACKUP_DIR/backup-status.json`. Elle échoue si un statut manque, est en erreur/verrouillé, a une date incohérente ou devient trop ancien. Seuils : 5 minutes pour le worker, 26 heures pour la sauvegarde ; surcharge par `PUBLICATION_STALE_MS` et `BACKUP_STALE_MS`. Une archive sans preuve est un avertissement qui rend la sonde négative. Le code de sortie et le JSON sont utilisables par la supervision de l’opérateur. Aucun e-mail, SMS ni service d’alerte externe n’est installé ou testé.

## Modèles Linux à adapter et auditer

Les fichiers `templates/` sont **NON TESTÉS sur Linux**. Ni Nginx ni `systemd-analyze` ne sont disponibles sur le Mac de validation ; leur syntaxe n’est donc pas certifiée par les validateurs natifs. Les tests Node locaux ne valent pas un essai de ces services, du réseau, du TLS ou d’un redémarrage machine. Ne pas installer ni activer ces fichiers tels quels.

Le modèle utilise un compte système dédié commun `santinnovation` pour le CMS, le worker, le serveur statique, la sauvegarde et la sonde. Il est compatible avec les répertoires privés `0700` réellement créés par le code. Il fournit une **séparation logique des services, sans isolation de sécurité par UID entre eux**. Nginx garde son propre compte ; il relaie le site vers `127.0.0.1:4321`, dont l’unique racine est `.local/site-current`, sans lire directement les répertoires privés. Le serveur statique ne reçoit pas le fichier d’environnement CMS. Une isolation plus forte demanderait une architecture et des essais supplémentaires.

Préparer sous ce compte les dossiers privés CMS, sauvegardes, `.local`, `.releases` et les caches mentionnés par les unités. Les chemins du dépôt et les exécutables doivent correspondre à l’installation réelle ; les répertoires listés dans `ReadWritePaths` doivent exister avant le lancement. Les fichiers `/etc/santinnovation/cms.env` et `backup.env` sont privés, fournis hors Git et lisibles uniquement par l’administrateur système qui lance systemd. Le service de sauvegarde autorise l’accès en écriture au répertoire CMS pour la coordination des fichiers SQLite WAL/SHM ; son code ouvre la base source en lecture seule. Ses fichiers de travail sont dans le répertoire temporaire privé du service.

Le CMS Next écoute seulement sur `127.0.0.1:3001`. L’administration Nginx reste liée au loopback et refusée par défaut hors adresses autorisées. Toute ouverture exige une restriction réseau validée (VPN ou IP d’opérateurs) ou un proxy SSO avec MFA couvrant **toutes** les routes `/admin`, `/api`, `/apercu` et les ressources du framework. TLS, certificat et noms `example.invalid` sont à configurer par l’opérateur. Les limitations de débit des connexions et de l’API, les en-têtes et le cache sont explicités dans le modèle. Nginx masque les en-têtes upstream qu’il remplace, applique le cache long aux seuls fichiers Astro nommés par empreinte et exige une revalidation des autres ressources publiques ; le CMS reste `no-store`.

Le modèle inclut une sauvegarde quotidienne avec décalage aléatoire et une sonde chaque minute ; il ne déclenche aucune rotation destructive automatique. Avant activation réelle, contrôler les unités avec `systemd-analyze verify`, la configuration complète avec `nginx -t`, puis tester refus d’accès non autorisé, TLS, cache, restauration synthétique et redémarrage dans une préproduction protégée. Ces contrôles de serveur restent à faire.

## Preuves automatisées

```sh
node --test tests/ops*.test.mjs
```

Les neuf tests créent uniquement des données synthétiques dans des répertoires temporaires qui leur appartiennent : chiffrement et restauration exacte, sauvegarde pendant des transactions concurrentes, clé absente/erronée, altération, cible existante, liens symboliques média, divergence de projection, export éditorial refusé, statut d’échec, rotation avec archives étrangères, traversée de chemins, fraîcheur et délai maximal. L’intégration initialise un vrai CMS Payload de test, applique ses migrations, restaure comptes/versions/brouillons/médias et compare la projection publique au même instant. Elle ne publie rien et n’active aucune restauration.
