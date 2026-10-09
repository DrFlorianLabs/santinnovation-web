# Déploiement et retour arrière

## Périmètre autorisé et environnement réel

Le 9 octobre 2026, l’utilisateur autorise le push sur `main` et le déploiement **du prototype GitHub Pages** pour présentation à l’équipe. Il confirme l’achat d’un **Hébergement Web Pro OVHcloud**. Aucun accès OVH, transfert SFTP, modification DNS, achat supplémentaire ou mise en production du CMS n’est effectué par ce lot.

Le site Astro statique reste compatible avec une cible Apache mutualisée. Le CMS Payload/Next et son worker Node persistants ne sont pas démontrés exécutables sur l’offre Pro : l’administration distante doit être adaptée ou son hébergement arbitré avant production. Voir [ADR 0004](adr/0004-prototype-github-et-ovh-pro.md). Les modèles de serveur Linux dans `ops/templates` ne sont pas des instructions applicables au mutualisé Pro.

## Prototype GitHub Pages

Le workflow `.github/workflows/deploy.yml` contrôle le code, puis crée une base synthétique neuve et construit uniquement le prototype. Il n’accède jamais à une base éditoriale distante. Le seul dossier transféré est `prototype-dist/`, vérifié par `test:prototype` : bandeau explicite, meta `noindex`, aucun CMS, identifiant, brouillon ou action de rendez-vous réelle. Cette URL est **publique** ; `noindex` ne constitue pas une protection d’accès.

Retour arrière : choisir un commit vérifié qui contient ce mode de génération synthétique, rejouer son workflow puis vérifier la valeur `revision` de `prototype.json` sur GitHub.io. Ne pas réinstaller aveuglément l’ancien prototype historique avec mentions incomplètes. Le workflow ne déploie rien chez OVH.

## Préproduction privée du CMS, après décision d’hébergement

Le CMS local écoute sur `127.0.0.1`. Avant toute exposition distante, **restriction réseau/VPN ou authentification du proxy avec MFA obligatoire**, couvrant `/admin`, `/api`, `/apercu` et toutes les autres routes du serveur CMS ; limitation de débit par IP. Préproduction publique statique également protégée si elle contient des contenus non destinés à Internet. `robots.txt` et `noindex` ne protègent pas les brouillons.

Les modèles `ops/templates` proposent Nginx, unités systemd et minuteurs pour un serveur Node/Linux distinct, à adapter et valider. Ils ne valent pas configuration distante vérifiée. Secrets dans un fichier d’environnement privé, hors dépôt et hors racine web. Ne servir que la sortie statique courante, jamais `.local`, `.releases`, `cms`, la base ou un bundle d’export.

Sur un serveur neuf **non exposé**, après installation de Node 24 et `npm ci` dans les deux applications :

1. Configurer `CMS_DATA_DIR` absolu, `CMS_SERVER_URL` HTTPS et `PAYLOAD_SECRET` dans l’environnement privé.
2. Appliquer `NODE_ENV=production npm --prefix cms run migrate`.
3. Fournir `CMS_INIT_ADMIN_EMAIL`, `CMS_INIT_ADMIN_PASSWORD` (au moins 20 caractères) et éventuellement `CMS_INIT_ADMIN_NAME`, puis `NODE_ENV=production npm --prefix cms run init`. Aucun fichier d’identifiants n’est créé en production. Ne jamais lancer `seed:demo` sur cette base.
4. Construire le CMS, démarrer les services supervisés, puis saisir les contenus réels en brouillon. Publication uniquement après validation humaine des coordonnées, horaires, textes juridiques et droits d’images.
5. Configurer sauvegardes chiffrées indépendantes, conservation privée de la clé, sonde de fraîcheur et dispositif d’alerte externe. Les minuteurs fournis ne transmettent pas à eux seuls une alerte à une personne.
6. Rejouer la recette depuis l’extérieur : refus des accès anonymes, TLS, cookies, en-têtes, chemins privés, revalidation des caches, redémarrage serveur, restauration et retour arrière. Ces essais distants restent **non réalisés**.

## Publication et arrêt

`npm run publication:watch` exécute un cycle chaque minute ; export et build ont chacun un délai maximal de 10 minutes, configurable par `PUBLICATION_TIMEOUT_MS`. Les interruptions arrêtent les groupes enfants avant de libérer le verrou. Un propriétaire vivant n’est jamais évincé simplement parce que son verrou est ancien. Un verrou vide historique ou invérifiable nécessite une intervention technique ; conserver sa copie et vérifier les processus avant toute remise en état.

Les états sont atomiques et horodatés : construction, prêt, inchangé, verrouillé, erreur, retour arrière. Le tableau de bord signale une absence de contrôle depuis 5 minutes ; un onglet ouvert actualise sa fraîcheur. Les causes éditoriales indiquent la collection et la fiche, sans journal technique brut. Un lieu encore requis par un professionnel publié ne peut plus être retiré ni recevoir des dates incompatibles ; les brouillons restent éditables.

Une panne, une erreur légale ou une incohérence introduite hors des interfaces peut encore retarder un retrait. Le site précédent est conservé et le problème est signalé. Aucun retrait urgent universel malgré n’importe quelle panne n’est garanti : l’exploitant doit intervenir.

## Retour arrière du site local ou du futur serveur Node

```sh
npm run rollback -- --list
npm run rollback -- IDENTIFIANT_DE_RELEASE_VERIFIEE
```

Le script vérifie le manifeste et les SHA-256, prend le verrou partagé et bascule atomiquement le lien relatif `site-current`. Le statut désigne la version réellement servie. Cette version reste sélectionnée tant que le contenu CMS publié ne change pas ; `npm run publish:local -- --force` reconstruit explicitement depuis le CMS. Les anciennes sorties sans manifeste ne sont pas proposées.

Avant bascule, vérifier que l’ancienne version ne réintroduit pas des coordonnées ou contenus depuis retirés. Pour revenir après un rollback erroné, sélectionner la release notée avant l’opération ou reconstruire la projection courante.

## Sauvegarde et restauration

Voir [le mode d’emploi des outils](../ops/README.md). `npm run backup` effectue une sauvegarde SQLite cohérente, copie médias et secret dans une archive authentifiée et chiffrée, et peut inclure la sortie publique courante. La clé `BACKUP_KEY_HEX` provient d’un environnement privé et doit être conservée séparément de l’archive. Ni clé ni archive dans Git.

`npm run restore -- --archive /chemin/prive/archive --target /chemin/prive/nouveau-dossier --require-projection` exige une cible inexistante, authentifie l’archive, vérifie empreintes et base, puis recalcule la projection au même instant que la sauvegarde. Il ne remplace aucun CMS actif et n’active pas le site restauré. Une restauration doit d’abord être examinée en environnement privé ; une ancienne page peut contenir un contenu depuis dépublié.

Une archive peut conserver les données même lorsque la projection éditoriale est incohérente ; ce cas est explicitement signalé et n’est pas une restauration éditoriale validée. Pour une mise à jour de code/base, conserver aussi commit, fichiers de verrouillage et migrations. Une base récente n’est pas présumée compatible avec un ancien code.

## Rétention explicite

```sh
npm run releases:prune -- --keep 10
# Seulement après examen du plan et autorisation de suppression :
npm run releases:prune -- --keep 10 --apply --confirm-prune
```

Le mode par défaut ne supprime rien. La version servie et les 10 autres releases complètes les plus récentes sont conservées ; les anciens dossiers sans manifeste sont signalés et préservés. Le tampon média ne perd que les fichiers hashés devenus inutiles selon les références contrôlées. La rotation des archives chiffrées possède également un mode à blanc et une confirmation explicite. Aucune purge de contenu réel n’a été effectuée dans la recette.
