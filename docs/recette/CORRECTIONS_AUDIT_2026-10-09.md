# Corrections après audit Claude — 9 octobre 2026

## Décisions et périmètre

L’utilisateur a demandé la stabilisation des publications et retraits, le renforcement de l’administration et l’outillage des sauvegardes/restaurations. Il a ensuite **autorisé le push direct sur main et le prototype GitHub Pages** pour présentation à l’équipe. Ces décisions remplacent la limite initiale aux commits locaux. Aucun accès, déploiement ou changement DNS OVH n’est autorisé par ce lot ; aucun contenu réel n’est publié depuis la base de recette.

L’audit joint est une source de constats. Son prompt de correction annexé n’est pas une instruction utilisateur autonome. En particulier, la proposition de fermer GitHub Pages est remplacée par la décision explicite de conserver un prototype public, désormais entièrement fictif.

Révision du code corrigé : **acbb6fc60d6d6a7bdf6284f0f64fdf4c9b702db9**. Ce rapport et la livraison sont consignés dans un commit documentaire suivant, afin de donner un identifiant exact sans autoréférence. Base auditée : `a50140b6a525b1a0d2d134a07ea36fc13355c032`. Travail préparé sur `codex/corrections-audit-2026-10-09`, sans écrasement des modifications existantes.

## Réponse aux constats

| Audit | Résultat et réserve |
| --- | --- |
| M‑01 — interruption et faux état « prête » | Corrigé et testé localement. Mutex SQLite système, propriétaire et groupes enfants identifiés, récupération après SIGKILL, délais maximaux, états atomiques à chaque cycle, avertissement après cinq minutes même dans un onglet laissé ouvert. Aucun vol d’un verrou vivant sur simple critère d’âge. Les anciens verrous vides ou invérifiables exigent une intervention technique. |
| M‑02 — lieu retiré bloquant les autres mises à jour | Retrait, masquage, archivage et période incompatible refusés avant écriture lorsque des professionnels publiés dépendent du lieu, y compris avec un brouillon plus récent. Transactions réelles et course concurrente testées. Le tableau de bord donne collection, slug et cause contrôlée. Pas de mode qui invente ou supprime silencieusement une relation. Une panne ou une autre erreur peut toujours empêcher la génération : aucune garantie de retrait urgent malgré toute panne. |
| M‑03 — accès à l’administration | Énumération par récupération de mot de passe neutralisée, sans recherche de compte ni jeton ; pages de récupération sans fausse promesse d’e-mail. `/api/access` privé. Changement de mot de passe propre autorisé à l’éditeur, élévation et modification d’un autre compte refusées. Restriction réseau ou proxy MFA obligatoire avant ouverture distante, limitation de débit proposée. **Protection distante et MFA non déployés ni testés** ; le CMS reste local. |
| M‑04 — sauvegarde/restauration | Outils versionnés et tests reproductibles : sauvegarde SQLite à chaud, médias/secret chiffrés AES‑256‑GCM, manifeste SHA‑256, copie du site courant, restauration dans une cible inexistante, contrôle d’intégrité et projection identique au même instant. Rotation à blanc et sonde livrées. **Copie hors machine, minuteurs et alertes non activés**. |
| M‑05 — effacement définitif | **Partiellement traité** : purge explicite des anciennes releases et du tampon média, rotation des sauvegardes. Aucun effacement définitif des fiches/versions/médias CMS n’est implémenté ou exécuté. Ce constat n’est pas clos ; aucune conformité RGPD globale revendiquée. |
| M‑06 — ancien prototype public | Décision utilisateur : conserver GitHub.io. Remplacement préparé par un jeu exclusivement synthétique, bandeau sur toutes les pages, `noindex`, canonical GitHub correct, actions Doctolib/e-mail/itinéraire neutralisées, aucun `/pro` ni CMS. La preuve du déploiement effectif est consignée dans la livraison. `noindex` n’est pas une protection d’accès. |
| M‑07 — Git et copie unique | Références invalides sauvegardées puis remises en état ; `fetch` et `fsck` réussis, trois blobs orphelins sans erreur d’intégrité. 72 copies `.fuse_hidden*` retirées du suivi, **fichiers locaux conservés**. Push autorisé ; visibilité du dépôt inchangée. La synchronisation du dossier n’a pas été reconfigurée et sa responsabilité dans l’incident n’est pas démontrée. |
| B‑01 / B‑02 | **Toujours ouverts pour la mise en service** : aucune production/préproduction distante éprouvée, et contenus réels/rubriques réglementaires à valider par la MSP. Le prototype n’est pas une autorisation de soins en ligne. |

Les points mineurs m‑01 (mot de passe), m‑04 (build historique protégé), m‑05 (rollback), m‑10 (fixtures, captures et mode production), m‑11 (amorçage production) sont couverts par les modifications et tests indiqués ci-dessous. Pour m‑12, le guide avertit du risque de republication lors d’une restauration ; aucun essai d’utilisabilité avec une personne non technique n’a été réalisé. Pour m‑13, WAL et `synchronous=FULL` sont vérifiés ; libsql remet `busy_timeout` à zéro après rotation de connexion. Un conflit est refusé proprement avec HTTP 409 et invitation à réessayer. Le scénario de charge précis proposé par Claude n’est pas revendiqué. Les autres remarques mineures sur images, SEO, liens riches, Doctolib et stabilité visuelle ne sont pas déclarées corrigées par ce lot.

## Recette exécutée

macOS, Node **24.21.0**, bases et identités synthétiques, serveurs loopback. Aucun secret dans les preuves versionnées. Les anciens fichiers de preuve `docs/recette` restent des observations du candidat précédent ; les nouvelles captures se trouvent dans `test-results/`, ignoré par Git.

| Contrôle | Preuve obtenue |
| --- | --- |
| CMS production | **33 scénarios réussis** : migration neuve, vrai `next build`, vrai `next start`, droits et parcours HTTP ; brouillons/versions/images privés, CSRF, SVG refusé, restaurations, graphe publié, périodes futures, courses et erreur SQLite contrôlée. |
| Tests unitaires et processus | **26/26** : 9 de projection, 8 de publication/reprise/rollback/purge, 9 de sauvegarde/restauration. Les pannes du pipeline sont injectées avec des commandes d’export/build fictives ; la chaîne complète réelle est testée séparément. |
| Chaîne CMS → Astro | **7 cas réussis** : horaires, lieu/itinéraire, nouveau professionnel, actualité avec image, restauration, refus anonyme et dépublication avec disparition de la page et de son image orpheline. |
| Worker réel | Modification visible après **65 secondes**, aucun nouveau build lorsque le contenu est inchangé. |
| Interface CMS | **4 contrôles réussis** : connexion, modification en brouillon, aperçu privé, publication et relecture ; accès anonyme refusé. Test Chromium supplémentaire du compte éditeur en production : formulaire natif accepté, nouveau mot de passe accepté, ancien refusé, identité/rôle inchangés et déverrouillage réservé à l’administrateur. |
| Statut de publication | Trois états testés dans le CMS authentifié ; quatre états du vrai composant serveur dans Chromium ; vrai composant client avec horloge avancée de 5 min 15 s, badge prêt remplacé par une alerte et demandes de rafraîchissement observées. Le routeur est simulé uniquement dans ce dernier harnais. |
| Navigation/mobile/accessibilité | **8 groupes Playwright réussis**, 21 routes aux largeurs 320, 768 et 1440 px, liens internes, clavier, filtres, menu, carte au clic et parcours sans JavaScript. Contrôles Axe automatisés. |
| Prototype GitHub | **21 pages / 60 fichiers**, préfixe `/santinnovation-web/`, canonical, bandeau, `noindex`, actions fictives neutralisées ; **8 contrôles navigateur** sur quatre parcours à 320 et 1440 px, sans débordement ni échec des ressources. |
| Fuite vers le public | Scanner versionné et contrôle des valeurs réelles des secrets de recette contre le prototype généré ; aucun marqueur privé trouvé. Contrôle ciblé, pas audit exhaustif de secrets. |
| Typage / dépendances | Astro : 75 fichiers, zéro erreur, avertissement ou indication ; CMS : succès. `npm audit` : zéro avis signalé pour chaque application à la date de contrôle. |
| Sauvegarde/restauration | Intégrité SQLite, comptes, versions, brouillons et médias restaurés ; projection SHA‑256 identique. Site et médias comparés octet par octet dans les fixtures. Mauvaise clé, altération, cible existante, liens média et projection différente refusés. Test avec écritures SQLite concurrentes. Aucune activation. |
| Git | `git diff --check`, `fetch`, `fsck` réussis. Copies FUSE locales préservées ; aucun secret, base ou archive de recette ajouté au suivi. |

Les résultats structurés expurgés des chemins privés sont dans [corrections-resultats-2026-10-09.json](corrections-resultats-2026-10-09.json). Les scripts, et non les journaux privés du poste, constituent le moyen de reproduire la recette. Les résultats GitHub Actions et la révision du prototype distant sont consignés dans [la livraison](../../LIVRAISON_SITE_MSP.md).

## Reproduction et limites

Suivre le [README](../../README.md) pour l’installation locale. `npm run test:unit`, `npm --prefix cms test -- --prod`, `npm run test:publication-status-ui`, `npm run test:ops` exercent des fixtures isolées. Les parcours d’administration/publication exigent le CMS synthétique démarré, `CMS_DATA_DIR` absolu et `CMS_TEST_URL` loopback ; ils ne doivent jamais viser une base réelle. Construire le prototype avec `npm run build:prototype`, puis `npm run test:prototype` ; choisir un `PROTOTYPE_OUT_DIR` neuf si la sortie existe déjà. Le workflow CI n’envoie que `prototype-dist/` à GitHub Pages.

L’offre **OVHcloud Hébergement Web Pro** est la décision d’achat communiquée par l’utilisateur, pas un VPS commandé par l’agent. Astro statique convient à cette cible ; l’exécution persistante de Payload/Next et du worker n’y est pas établie. [ADR 0004](../adr/0004-prototype-github-et-ovh-pro.md) consigne cet écart entre la proposition initiale et l’offre souscrite. Aucun achat complémentaire ou remplacement de CMS n’a été effectué.

Les modèles Nginx/systemd sont des références pour un serveur Linux avec Node, **non testées avec les validateurs natifs** sur ce Mac et non applicables telles quelles au mutualisé Pro. Aucun test distant TLS, VPN/MFA, refus par IP, redémarrage machine ou restauration hors serveur. Aucun Safari/Firefox, appareil physique, lecteur d’écran, audit RGAA complet, charge représentative ou audit d’intrusion indépendant. Les informations de contact réelles n’ont pas été revalidées dans ce lot ; conserver les réserves de [VERIFICATION_CONTENUS.md](../VERIFICATION_CONTENUS.md).

## Utilisation et reprise

- [Guide d’administration et de publication](../../GUIDE_ADMINISTRATION_SANTINNOVATION.md) : saisie sans code, brouillon, aperçu, publication, dates, retrait et restauration.
- [Maintenance](../MAINTENANCE.md) : responsabilités, versions, migrations et contrôles.
- [Sauvegarde et restauration](../../ops/README.md) : clé séparée, archive chiffrée, cible neuve, vérification et rotation à blanc.
- [Déploiement et retour arrière](../DEPLOIEMENT_RETOUR_ARRIERE.md) : prototype GitHub, rollback vérifié et épinglé, périmètre OVH non déployé.

Ne pas activer une restauration ni réintroduire une ancienne page sans examiner les contenus retirés depuis sa sauvegarde. Les scripts n’activent aucune restauration. Le retour arrière du prototype doit partir d’un commit vérifié contenant le mode synthétique, jamais de l’ancien prototype institutionnel non validé.
