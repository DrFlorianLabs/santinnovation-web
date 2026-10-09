# Maintenance de Sant’Innovation

Candidat local du 9 octobre 2026, à auditer avant exploitation. Aucune commande de ce guide n’autorise un push, une fusion, une souscription ou un déploiement. La cible proposée est un VPS OVHcloud ; aucune offre n’est contractée. Voir [ADR 0003](adr/0003-administration-payload-astro.md) et [déploiement / retour arrière](DEPLOIEMENT_RETOUR_ARRIERE.md).

## Répartition des responsabilités

Le médecin et la coordination éditent les contenus dans Payload selon le [guide d’administration](../GUIDE_ADMINISTRATION_SANTINNOVATION.md). Ils vérifient les horaires, contacts, droits d’images et liens, puis autorisent la publication. Ils n’ont pas à modifier le code, utiliser Git ou administrer Linux pour ces opérations.

Un responsable technique identifié maintient Node, le CMS, le système, les sauvegardes, les migrations, le service de génération et le domaine. Le logiciel libre ne supprime pas cette charge d’exploitation. Le site et le CMS n’accueillent aucune donnée patient, aucun formulaire médical et aucune GED réelle. Les comptes d’administration sont nominatifs et constituent des données à protéger.

## Composants à préserver

| Élément | Rôle et précaution |
| --- | --- |
| Node **24 LTS** (`.nvmrc`) | Version de référence de l’environnement. Respecter aussi les moteurs déclarés dans les deux `package.json`. |
| Racine du dépôt | Astro : construit uniquement la sortie publique. `package-lock.json` fixe les dépendances reproductibles. |
| `cms/` | Application Payload/Next distincte, avec son propre verrou de dépendances. Les routes `/admin`, `/api` et `/apercu` sont privées selon leurs droits. |
| `CMS_DATA_DIR` | Répertoire persistant privé : `cms.sqlite`, `media/`, secret local éventuel et `publication-status.json`. Par défaut `cms/.local`, jamais racine web. |
| `PAYLOAD_SECRET` | Secret de session aléatoire d’au moins 32 caractères, conservé hors Git. Ne pas l’inscrire dans les journaux ni les documents. |
| `.local/export-buffer` et `.releases/` | Travail intermédiaire privé et historiques de générations. Ne jamais servir le bundle brut, la base, les sources ou ces répertoires directement. |
| `.local/site-current` | Lien vers une sortie publique complète construite avec la liste des champs autorisés et les seules images référencées. C’est la cible du serveur public. |

Les environnements de test, de préproduction et de production doivent avoir des bases, médias, secrets, comptes et répertoires séparés. Ne jamais exécuter les fixtures ou les tests contre la base de production, ni réinitialiser une base existante. L’amorçage d’une base de production neuve, après migrations et accord de déploiement, suit la procédure dédiée ci-dessous. `seed:demo` est exclusivement destiné à une installation locale synthétique ; il ne prépare pas des contenus institutionnels validés.

`npm --prefix cms run init` conserve les comptes existants et génère, s’il n’en existe aucun, un compte d’amorçage avec une identité fictive et des identifiants dans un fichier local privé. Ces identifiants ne doivent jamais être copiés dans la documentation, une capture, un journal ou Git. Sur un serveur neuf encore protégé, après migrations, convertir ce compte en compte nominatif avec une adresse réelle et un nouveau mot de passe avant toute ouverture des accès. Cette initialisation ne remplace pas la préparation des comptes réels et migrations d’un serveur.

## Génération et surveillance

Le service `npm run publication:watch` examine la projection publique toutes les 60 secondes. Les documents doivent être publiés, visibles, non archivés et dans leur période d’affichage. Les brouillons, versions internes, comptes et médias non référencés ne sont pas destinés à la sortie publique. Le worker reconstruit lorsque le contenu projeté change ; les générations utilisent un nouveau répertoire puis une bascule de lien atomique.

L’édition d’un brouillon n’a pas à modifier la version publique. La nouvelle publication, la dépublication et les échéances ont besoin du worker actif. Sur erreur, l’ancienne sortie reste servie, y compris un éventuel contenu arrivé à échéance. Superviser séparément CMS et worker, leur disponibilité, le dernier contrôle, la dernière construction réussie, l’espace disque et les sauvegardes. L’encart **Publication du site** renseigne l’éditeur ; il ne remplace pas une alerte d’exploitation.

Le CMS et le worker doivent partager le même `CMS_DATA_DIR` et le même secret. Les ports locaux ne doivent pas être exposés directement. En préproduction distante, protéger toutes les pages et médias par le reverse proxy et tester le refus depuis une session anonyme. En production, HTTPS est requis pour les cookies sécurisés ; ne pas mettre en cache `/admin`, `/api` ou `/apercu`. Configurer la revalidation des sorties publiques pour que le cache ne prolonge pas une dépublication. Les en-têtes Apache ne s’appliquent pas automatiquement à un autre proxy.

Une panne ou interruption brutale peut laisser `.local/publication.lock`. Vérifier d’abord qu’aucune publication ne tourne, conserver les traces utiles, puis confier sa remise en état au responsable technique. Ne pas contourner le verrou en lançant plusieurs workers.

Les dates sont stockées comme instants UTC, avec l’heure de Paris comme référence de l’administration et de l’affichage public. Vérifier la saisie, l’aperçu, la sortie et le passage heure d’été/hiver en recette. Un changement de fuseau serveur ne doit pas déplacer un événement.

## Sauvegarde et restauration

Les **50 versions par fiche ne sont pas une sauvegarde** : elles résident dans la même base, leur nombre est limité et elles ne réparent pas la perte du stockage ou du secret. Les images sont immuables dans l’interface pour éviter une modification publique implicite ; leur historique dépend de la conservation des fichiers.

Avant toute mise à jour, sauvegarder de manière cohérente la base SQLite et ses médias, le secret nécessaire à l’installation, la configuration privée et le commit/verrou de dépendances correspondant. Arrêter CMS et worker le temps d’une copie cohérente, ou utiliser un mécanisme de sauvegarde SQLite validé par l’exploitant. Une copie isolée de `cms.sqlite` pendant une écriture n’est pas une procédure suffisante.

Prévoir une copie chiffrée hors VPS, une rétention convenue, des accès restreints et des essais réguliers de restauration dans un environnement privé distinct. Conserver la preuve de ces essais sans contenu sensible. Les anciennes releases peuvent contenir un article depuis dépublié : leur remise en ligne demande un contrôle éditorial. Aucune purge automatique de releases ou de médias n’est livrée ; faire approuver la politique de rétention avant suppression.

Pour une erreur éditoriale, privilégier **Versions → Restaurer comme brouillon**, contrôle puis publication. Pour une panne de code, base ou serveur, utiliser la [procédure de retour arrière](DEPLOIEMENT_RETOUR_ARRIERE.md). Revenir au code ancien sans traiter la compatibilité de la base n’est pas un retour arrière complet.

## Mise à jour technique, sur copie isolée

Lire les notes de version et les règles de `cms/AGENTS.md`. Utiliser Node 24, installer les dépendances avec `npm ci` dans chaque application et conserver les fichiers de verrouillage. Réexaminer les dérogations `overrides` de `cms/package.json` lors d’une mise à jour ; elles ne dispensent pas d’évaluer les versions réellement installées.

Contrôles disponibles depuis la racine :

```bash
npm ci
npm --prefix cms ci
npm run verify
npm run test:browser
npm --prefix cms run check
npm --prefix cms run test
npm --prefix cms run test -- --http
npm --prefix cms run build
npm audit
npm --prefix cms audit
```

Les tests CMS créent des bases synthétiques isolées. Les contrôles HTTP nécessitent que le port de recette soit libre ; le navigateur exige son runtime Playwright et le serveur prévu par sa configuration. Les constructions CMS nécessitent un secret local valide selon la configuration. Ne pas publier les journaux bruts sans vérifier leur contenu. Consigner les commandes exécutées, résultats, versions et limites dans le rapport de recette. Ces commandes ne prouvent pas une recette distante, tous les navigateurs, ni une conformité réglementaire d’accessibilité.

Un `npm audit` est un état des avis connus au moment du contrôle, avec accès au registre nécessaire. Analyser les chemins affectés, la portée production/développement et le correctif proposé ; ne pas lancer `npm audit fix --force` sans revue de compatibilité. Répéter après changement de dépendance ou nouvel avis pertinent. Les scénarios essentiels sont : droits anonymes/éditeur/administrateur, brouillons et versions, médias privés, publication/dépublication et absence des médias retirés dans la sortie neuve, restauration, dates et références entre lieux et professionnels. La V1 est uniquement en français.

## Migrations et préparation d’un serveur

En développement, l’adaptateur SQLite peut synchroniser le schéma ; en `NODE_ENV=production`, `push` est désactivé. **Ne pas compter sur une création ou modification automatique des tables en production.** La migration initiale est versionnée dans `cms/src/migrations` et a été testée sur une base vide. Pour les évolutions suivantes, générer et relire la migration avec la version Payload retenue puis la tester sur une restauration privée avant démarrage. Leur exécution et leur éventuel retour arrière doivent figurer dans le lot à approuver.

Les outils et API de migration sont ceux de [Payload — migrations](https://payloadcms.com/docs/database/migrations). Vérifier leur documentation contre la version épinglée avant exécution. Les types et l’import map de l’administration se régénèrent avec les commandes `generate:types` et `generate:importmap` du CMS après changement de schéma ou de composant. Relire les modifications produites.

Après migration, reconstruire CMS et site, tester une session réelle et la matrice de droits, publier seulement une fixture en préproduction, vérifier son retrait et la restauration. Ne pas utiliser l’API locale Payload sans examiner `overrideAccess` : les opérations applicatives liées à un utilisateur doivent explicitement appliquer les contrôles d’accès. Les scripts de maintenance privilégiés sont réservés à l’exploitant et ne doivent pas devenir des routes publiques.

Point de vigilance de Payload 3.90.2 : l’implémentation locale de `payload.restoreVersion` ne transmet pas l’option `draft` à l’opération native, alors que son type l’accepte. Ne pas s’en servir pour garantir une restauration en brouillon. L’interface/route REST transmet cette option ; les tests de restauration doivent couvrir ce chemin et vérifier le statut obtenu avant toute publication. Réévaluer cette restriction lors d’une mise à jour de Payload.

La messagerie du CMS est volontairement désactivée : aucun courriel de récupération n’est garanti. Un administrateur réinitialise les accès dans l’interface selon une procédure d’identification de la personne. Le second facteur n’est pas intégré dans cette livraison ; un éventuel contrôle supplémentaire au proxy ou à l’identité doit être conçu et testé avant d’être annoncé. Contrôler les comptes actifs et retirer les accès devenus inutiles selon validation explicite.

Avant ouverture, valider aussi les contacts, droits de diffusion, mentions légales, responsabilités d’exploitation, sauvegardes, budget, domaine et hébergement. Les faits encore non confirmés restent dans [Vérification des contenus](VERIFICATION_CONTENUS.md). La livraison locale ne vaut ni accord de publication, ni contrat OVHcloud, ni audit de sécurité indépendant.
