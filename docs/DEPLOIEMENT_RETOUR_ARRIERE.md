# Déploiement et retour arrière — candidat à auditer

Aucun serveur distant n’a été configuré ni publié. L’offre OVHcloud, le domaine, les comptes, les accès et le budget restent à approuver. La configuration historique GitHub Pages est remplacée par une CI de contrôle sans déploiement.

## Architecture à approuver

Un VPS Linux OVHcloud avec Node 24 LTS, reverse proxy HTTPS et stockage persistant. Le public est du HTML Astro ; le CMS Payload reste un processus distinct, avec sa base SQLite et ses images privées. Deux noms d’hôtes : site public et administration. Le CMS et le worker écoutent/accèdent uniquement localement ; le reverse proxy est seul exposé. L’édition quotidienne se fait dans le navigateur, sans accès terminal au serveur.

Le mutualisé Apache peut servir la sortie Astro, mais ne sait pas lancer Payload ni le worker. Ajouter un transfert SFTP vers un mutualisé est possible mais n’est **pas** livré ni testé ici. La cible opérationnelle proposée est le VPS unique, avec responsabilité d’exploitation désignée.

## Préproduction protégée

Le candidat local est lié à `127.0.0.1` : aucune écoute réseau externe. Le CMS exige une session réelle. Pour une préproduction distante, créer un hôte séparé avec protection HTTP du reverse proxy **sur toutes les routes et médias**, TLS et `X-Robots-Tag: noindex`. `robots.txt`/`noindex` ne sont pas des protections d’accès. Tester depuis un navigateur non authentifié. Ne jamais exposer `.local`, `.releases`, `cms`, la base ou le dépôt : seule la cible `site-current` est racine publique.

## Installation technique après accord

1. Choisir l’offre, la sauvegarde indépendante et les noms d’hôtes. Préparer utilisateurs système non privilégiés, pare-feu, TLS et mises à jour automatiques de sécurité. Ne pas placer la racine Git dans une racine web.
2. Installer le commit validé, Node 24 LTS et exécuter `npm ci` puis `npm --prefix cms ci`. Configurer les secrets hors Git et les répertoires persistants protégés. Ne jamais réutiliser les comptes synthétiques.
3. Sur une base neuve encore protégée, avec les variables serveur et le secret déjà définis, appliquer `NODE_ENV=production npm --prefix cms run migrate`, puis amorcer le CMS avec `NODE_ENV=production npm --prefix cms run init`. Le script crée un compte initial à identité fictive : le convertir dans l’interface en compte nominatif avec une adresse réelle et un nouveau mot de passe avant toute ouverture des accès ; créer ensuite les autres comptes nécessaires. Ne pas exécuter `seed:demo` sur ce serveur. Conserver le secret de session dans le gestionnaire de secrets retenu. Configurer `CMS_SERVER_URL` HTTPS. Préparer les migrations de base avant démarrage production selon le guide CMS.
4. Construire le CMS (`npm --prefix cms run build`) et démarrer `npm --prefix cms start` sous un superviseur. Configurer le proxy pour transmettre les cookies et l’hôte sans cache sur l’administration, `/api` et `/apercu`. Limiter l’accès réseau à l’administration si possible (VPN ou restriction du proxy).
5. Importer ou saisir les contenus réels **en brouillon**, vérifier les coordonnées, droits photos, lieux, horaires, liens et textes juridiques. Publication par responsable autorisé seulement.
6. Installer le worker `NODE_ENV=production npm run publication:watch` comme service supervisé (redémarrage sur panne). Il vérifie les contenus chaque minute et construit seulement si la projection publique change. Sur échec, il conserve la dernière version ; le tableau de bord signale l’erreur. Prévoir alerte de service et surveillance du dernier contrôle, espace disque et sauvegardes.
7. La racine web est `.local/site-current`, lien atomique vers une sortie complète. Le proxy/serveur web doit revalider HTML et images (pas de cache conservant des contenus dépubliés). Pas de CDN/service worker en V1. Transposer les en-têtes de `public/.htaccess` au proxy choisi.
8. Effectuer la recette A–F, navigateur, droits, dates, images et restauration sur cette préproduction. Vérifier TLS, cookies Secure/HttpOnly/SameSite, CSP et refus anonymes depuis l’extérieur. Aucun de ces contrôles distants n’est établi par les tests locaux.

Le délai éditorial nominal est un cycle de 60 secondes plus la construction. Une panne bloque l’actualisation et peut laisser visible la version précédente, y compris une actualité arrivée à échéance : le statut et l’alerte d’exploitation sont indispensables. Les dates sont des instants UTC, affichés en heure de Paris. Ne pas présenter la planification comme une garantie pendant une panne.

## Retour arrière

- **Contenu** : ouvrir la fiche dans Payload → Versions → restaurer la version voulue → contrôler l’aperçu → Publier. Le worker reconstruit le site. Les trois rubriques réglementaires doivent avoir une version publiée et validée ; sinon la génération est refusée. Les pages légales demandent à nouveau une validation administrateur si le texte change.
- **Version du site** : arrêter le worker, noter la cible actuelle du lien `.local/site-current`, choisir une sortie antérieure vérifiée dans `.releases/<date>/site`, créer un lien temporaire puis le renommer atomiquement vers `site-current`. Recontrôler le site avant reprise. Une ancienne sortie peut contenir un contenu depuis dépublié : ne jamais choisir aveuglément une ancienne release.
- **Code/base** : avant une mise à jour, sauvegarder ensemble la base SQLite, tous les médias et le secret ; conserver le commit/package-lock et la release publique correspondants. Restaurer d’abord en préproduction, appliquer la migration inverse uniquement si elle existe, puis basculer. Une base récente n’est pas présumée compatible avec un code ancien.
- **Sauvegarde** : arrêter CMS et worker pendant une copie cohérente SQLite (ou utiliser l’API de sauvegarde SQLite prévue par l’exploitant) ; sauvegarder hors VPS avec chiffrement, accès restreint et rétention validée. Tester la restauration. Les 50 versions natives par fiche ne remplacent pas les sauvegardes.

Aucune suppression automatique des anciennes releases n’est activée. Prévoir une rétention et une purge approuvées ; surveiller l’espace disque. Les sorties intermédiaires et bundles sont privés et ne doivent pas être archivés dans un dépôt public.
