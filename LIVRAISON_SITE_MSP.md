# Livraison Sant’Innovation — candidat local pour audit Claude

**9 octobre 2026 — prêt pour audit technique indépendant, sans autorisation de mise en production.**

Le site Astro et son administration Payload fonctionnent localement avec des données synthétiques. Les parcours, la publication, les droits et la restauration ont été testés selon la couverture ci-dessous. Aucun contenu réel n’a été publié par le CMS de recette sur Internet. Aucun push, fusion sur `main`, achat, ouverture d’accès distant ou déploiement n’a été réalisé.

## Révision exacte à auditer

| Référence | Valeur |
| --- | --- |
| Dépôt local | `/Users/floriansibille/Documents/GitHub/santinnovation-web` |
| Branche de travail | `codex/finalisation-administration-msp` |
| Base et `main` conservée | `2a11e7fe9c98815f4bf62feffc5e48052c0c4650` |
| Commit CMS | `f068567b6885164ae82ba27a91eee25b1cd060be` |
| **Commit complet du code, tests, guides et preuves à auditer** | **`a5bdf8d64d69b25bc7d3cd97061da178e3a7386f`** |

Ce rapport est ajouté dans un commit documentaire suivant. La révision ci-dessus contient l’intégralité de l’implémentation testée ; elle évite toute ambiguïté d’autoréférence du commit contenant le rapport. `git log -3 --oneline` montre les trois lots. Le dépôt était propre avant les travaux ; les documents internes ignorés ont été préservés. Les deux sources de démonstration `/pro` ont été déplacées sans modification, avec reconnaissance Git à 100 %.

## Périmètre livré

| Besoin | Réalisation locale |
| --- | --- |
| Trouver un professionnel | Annuaire filtrable par profession et lieu, fiches détaillées, photographie, contacts et horaires par établissement. Fonctionnement de base sans JavaScript. |
| Rendez-vous et accès | Liens Doctolib, fiches de lieux, itinéraires dérivés de l’adresse commune, carte chargée sur demande. Adresse/position à confirmer avant publication CMS. |
| Identité institutionnelle | Astro et identité visuelle conservés ; accueil, navigation, mobile, projet de santé, soins, innovation, partenaires et rubriques reliés aux contenus éditoriaux. |
| Actualités et événements | Création, texte riche, image avec description/crédit, catégories, dates d’événement et fenêtres d’affichage. Le site demeure la source éditoriale ; relais social manuel facultatif. |
| Administration sans code | Payload 3 : professionnels, établissements, actualités, activités/services, recherche/innovation, partenaires, informations générales et rubriques. Aucun Markdown ou Git pour la maintenance éditoriale courante. |
| Cycle éditorial | Brouillon, aperçu authentifié, publication explicite, modification, dépublication, masquage, archivage et jusqu’à 50 versions. Les médias sont immuables : nouvelle image puis publication de la fiche pour tout remplacement. |
| Droits | Authentification réelle ; éditeur pour les contenus courants, administrateur pour comptes, informations générales et validations réglementaires. API, versions et médias d’origine privés ; GraphQL désactivé. |
| Génération | Worker local toutes les 60 secondes, projection limitée aux champs publics, HTML nettoyé, construction neuve et bascule atomique. Dernière version conservée en cas d’erreur ; statut visible au tableau de bord. |
| Démonstration professionnelle | Sources conservées dans `src/pro/demo`, absentes du routage public. Aucune GED et aucune authentification simulée présentées comme opérationnelles. |

La publication du site exige des informations générales confirmées et les trois rubriques réglementaires publiées et validées. Un changement juridique ou d’adresse invalide sa confirmation précédente. Les relations incohérentes bloquent la génération au lieu de produire une page contradictoire.

## Décisions et faits

- **Demandes utilisateur appliquées** : conserver Astro, privilégier OVHcloud, administration graphique complète, aucune donnée patient, aucun formulaire médical, aucune diffusion multiréseaux automatique, aucun déploiement sans accord.
- **Choix technique réalisé localement** : Payload 3.90.2 / Next 16.4, SQLite, images privées et export vers Astro 7. Comparaison avec Decap/Sveltia, WordPress et Directus dans [ADR 0003](docs/adr/0003-administration-payload-astro.md).
- **Proposition d’hébergement, pas un achat ni un déploiement** : VPS OVHcloud avec Node 24 LTS, reverse proxy HTTPS, stockage persistant et supervision. Le mutualisé statique seul ne suffit pas à exécuter le CMS et le worker.
- **Charge à organiser** : le médecin peut éditer sans code ; système, sauvegardes, mises à jour, migrations et surveillance nécessitent un responsable technique identifié.

## Recette réellement exécutée

Environnement : macOS, Node **24.21.0**, boucles locales, données synthétiques uniquement. Les captures illustrent cette recette et ne sont pas du contenu prêt à publier.

| Contrôle | Résultat et couverture |
| --- | --- |
| Typage Astro | 58 fichiers ; 0 erreur, avertissement ou indication. |
| Construction Astro | Succès ; 21 routes sur le jeu synthétique. `/pro` absent. |
| Typage et construction CMS | Succès sous Node 24 ; routes sensibles dynamiques. |
| Projection publique | **8 tests** : brouillons, fenêtres de dates, masquage, champs exclus, HTML dangereux, références orphelines, liens et verrou réglementaire. |
| CMS et HTTP | **19 scénarios** : rôles, élévation refusée, API/versions/médias privés, brouillons, dates, validations, restauration, CSRF, refus SVG et contournements par PATCH sans statut ou déplacement de rubrique. |
| Navigation/mobile/accessibilité | **8 groupes Playwright** ; 21 routes aux largeurs 320, 768 et 1440 px ; liens internes, débordements, filtres, clavier, menu mobile, carte au clic et absence de JS. Axe WCAG 2 A/AA et 2.1 AA sur le périmètre automatisé. |
| Interface graphique CMS | **4 contrôles** : connexion/tableau de bord, modification d’horaires en brouillon, aperçu authentifié, publication puis relecture ; accès anonyme refusé. Bouton « Aperçu privé » également ouvert et vérifié dans une actualité. |
| Chaîne CMS → pages Astro | **7 cas** : A–F ci-dessous et dépublication avec disparition de la page et de son image devenue orpheline dans la nouvelle sortie. |
| Worker automatique | Modification publiée visible après **68 secondes** sans construction manuelle ; aucun nouveau répertoire de release quand la projection reste identique. |
| Migration | Migration initiale appliquée avec succès sur une base vide en mode production isolé. |
| Sauvegarde/restauration | Sauvegarde SQLite cohérente, copie médias/secret privés, restauration isolée ; projection publique restaurée identique par SHA-256. Données fictives uniquement. |
| Dépendances | `npm audit` : **0 avis de vulnérabilité** rapporté pour le site et le CMS à la date de recette. |
| Fuite de contenu | Inspection de 208 fichiers candidats et 59 fichiers générés : secrets locaux générés absents ; marqueur de brouillon `DRAFT_NEVER_PUBLIC` absent du public. Ce contrôle ciblé n’est pas un audit exhaustif de secrets. |
| Git | Contrôle des espaces réussi ; sources `/pro` préservées ; commits locaux sur branche séparée, `main` inchangée. |

### Scénarios d’acceptation A–F

| Scénario | Preuve obtenue |
| --- | --- |
| A — modifier les horaires | Modification CMS puis relecture des nouveaux horaires dans le HTML Astro. |
| B — changer un lieu | Relation et horaires réaffectés ; lieu et destination d’itinéraire cohérents sur la fiche publique. |
| C — ajouter un professionnel | Nouvelle fiche fictive présente dans l’annuaire et sa page. |
| D — actualité avec image | Brouillon absent du public ; article et image présents seulement après publication. |
| E — restaurer une version | Restauration via le chemin REST natif, contrôle du brouillon, republication ; ancienne valeur relue dans Astro. |
| F — refuser l’accès non autorisé | Anonymes refusés sur API, versions et image source ; aperçu redirigé vers connexion ; brouillon absent de la sortie publique. |

Preuves versionnées : [résultats structurés](docs/recette/resultats.json), [manifest SHA-256 public](docs/recette/manifest-public.json), [accueil](docs/recette/accueil-desktop.png), [annuaire mobile](docs/recette/annuaire-mobile.png), [administration](docs/recette/admin-desktop.png), [tablette](docs/recette/admin-tablette.png), [édition](docs/recette/edition-professionnel.png), [aperçu privé](docs/recette/apercu-prive.png), [actualité](docs/recette/actualite-admin.png). Le manifest décrit la sortie synthétique observée ; les tests qui republient des fixtures peuvent produire ensuite une autre sortie.

## Sources, informations réelles et limites

Le contrôle a couvert les règles du dépôt, ADR et configurations, 7 fiches de professionnels, 3 lieux, contenus globaux/partenaires et extraction textuelle de deux PDF fournis. La [vérification des contenus](docs/VERIFICATION_CONTENUS.md) documente chaque source, divergence et échec d’accès.

Les liens Doctolib individuels consultables ont été vérifiés sans réserver de rendez-vous. Le rattachement historique de Patrick Vuattoux a été corrigé vers Henri Baigue. Les affirmations PMR non étayées ont été retirées ; les contacts électroniques non vérifiés ne sont plus proposés comme contacts confirmés. Les profils historiques insuffisamment validés restent masqués. Les confirmations manquantes n’ont pas été inventées.

Restent à confirmer par la MSP avant toute ouverture : horaires et rattachements actuels, coordonnées géographiques exactes, accessibilité physique, adresses e-mail surveillées, droits des images/logos, partenariats, textes et responsabilités juridiques, état réel des projets. Le lien Doctolib collectif et GIRCI n’ont pas pu être intégralement vérifiés ; ces échecs ne prouvent pas que les liens sont morts. La base CMS livrée pour recette ne contient pas de contenu institutionnel réel validé.

Limites techniques explicites :

- Chromium automatisé uniquement ; aucun test Safari/Firefox ou appareil physique, aucun audit RGAA complet ni audit d’intrusion indépendant.
- Aperçu privé éditorial, distinct de la mise en page Astro finale ; le résultat public se contrôle après génération dans l’environnement protégé.
- Pas de MFA intégré ni récupération de mot de passe par e-mail configurée ; réinitialisation par administrateur. Les renforcements d’accès distants doivent être conçus et testés avant exposition.
- Une panne du worker peut retarder publication, dépublication ou échéance ; l’ancien site reste servi. Supervision et sauvegardes hors serveur à mettre en place.
- Préproduction **locale** liée à `127.0.0.1`. Aucune préproduction distante, configuration TLS/proxy OVH ou restauration distante testée. CI préparée, non exécutée sur GitHub.
- Les résultats ne valent ni validation juridique, ni accord d’hébergement, ni autorisation de diffusion réelle.

## Reprise et audit Claude

Lire [README](README.md), [architecture](ARCHITECTURE.md), [sécurité](SECURITY.md), [ADR 0003](docs/adr/0003-administration-payload-astro.md), puis les règles `cms/AGENTS.md`. Examiner le diff entre la base et le commit exact ci-dessus. Le README donne le démarrage reproductible et les commandes de contrôle ; les secrets, bases et médias de recette sont ignorés, jamais inclus dans les commits.

Priorités d’audit : contrôles d’accès Payload ; publication des rubriques réglementaires, notamment PATCH incomplets ; maintien du publié pendant l’édition d’un brouillon ; immutabilité des médias ; projections de champs et nettoyage HTML ; relations lieux/horaires ; bascule atomique et erreurs du worker ; migrations/restauration et exposition du seul répertoire public. Vérifier aussi les réserves documentées de `payload.restoreVersion` et privilégier l’interface/REST pour restaurer en brouillon.

Livrables d’utilisation et d’exploitation :

- [Guide d’administration et de publication d’une actualité](GUIDE_ADMINISTRATION_SANTINNOVATION.md).
- [Guide de maintenance](docs/MAINTENANCE.md).
- [Déploiement, préproduction protégée et retour arrière](docs/DEPLOIEMENT_RETOUR_ARRIERE.md).

**Point d’arrêt : audit Claude et validation humaine.** Toute ouverture distante, commande d’hébergement, publication réelle, push ou fusion doit faire l’objet d’un accord explicite sur le candidat audité et sa procédure de retour arrière.
