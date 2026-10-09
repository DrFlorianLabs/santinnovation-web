# Livraison Sant’Innovation — corrections après audit Claude

**9 octobre 2026 — prototype GitHub Pages déployé et vérifié ; administration et exploitation testées sur macOS et Linux.**

Le périmètre initial limité aux commits locaux a été remplacé par l’autorisation utilisateur de pousser sur `main` et de conserver GitHub Pages pour présenter le prototype. La mise en production OVH et la publication de contenus institutionnels réels restent distinctes.

## Révision exacte

| Référence | Valeur |
| --- | --- |
| Branche de préparation | `codex/corrections-audit-2026-10-09` |
| Base auditée par Claude | `a50140b6a525b1a0d2d134a07ea36fc13355c032` |
| **Commit exact du code corrigé et testé** | **`8fb575d88592c25943c56f75eeec0526234d0c87`** |
| GitHub / Pages | Push sur `main` et [CI 37920073993](https://github.com/DrFlorianLabs/santinnovation-web/actions/runs/37920073993) réussis ; déploiement terminé le 9 octobre à 12 h 57 (Paris). |
| Prototype public | [drflorianlabs.github.io/santinnovation-web](https://drflorianlabs.github.io/santinnovation-web/) |
| Révision distante relue | `8fb575d88592c25943c56f75eeec0526234d0c87`, via `prototype.json`, à 12 h 58 (Paris). |

Ce document est ajouté après le commit de code, afin d’éviter une référence circulaire. Ce commit documentaire ne déclenche pas un nouveau déploiement : les trois fichiers de preuve sont exclus du déclenchement automatique, sans changement du code livré. La livraison précédente reste consultable dans l’historique Git à la base auditée. Les preuves du premier candidat sont préservées ; les résultats des corrections sont identifiés séparément.

## Changements livrés

- Publication : retour arrière maintenu même après build échoué ou export indisponible ; reprise après interruption, délais maximaux, état fiable et avertissement si le worker s’arrête ; lieux et professionnels contrôlés avant publication/retrait.
- Administration : transactions avec confirmation réelle du COMMIT, refus sans faux succès et connexions isolées après conflit ; récupération par e-mail explicitement désactivée, absence d’énumération par cette route, API de permissions privée, changement du mot de passe propre sans élévation de rôle, initialisation production sans fichier d’identifiants.
- Exploitation : sauvegarde chiffrée de la base, médias, secret et site ; restauration vérifiée dans un dossier neuf sans activation ; retour arrière avec contrôle des empreintes, maintien de la version choisie et rétention explicite à blanc.
- Prototype : base fictive neuve, bandeau de démonstration et `noindex`, canonical GitHub correct, aucun CMS ni `/pro`, liens de rendez-vous/e-mail/itinéraire neutralisés.
- Git : références réparées ; 72 copies FUSE retirées du suivi tout en conservant les fichiers locaux. Aucun changement de visibilité du dépôt.

## Validation

Les [résultats structurés](docs/recette/corrections-resultats-2026-10-09.json) et le [rapport de corrections](docs/recette/CORRECTIONS_AUDIT_2026-10-09.md) donnent les commandes, la couverture et la réponse aux anomalies.

Localement, Node 24 et données synthétiques : **36 scénarios CMS en production**, **28 tests de projection/publication/sauvegarde**, **7 cas de chaîne CMS → Astro**, **8 groupes navigateur public**, **8 contrôles du prototype** et **4 parcours d’administration** réussis. Worker observé en 65 secondes ; états du tableau de bord et alerte d’inactivité éprouvés. Typage Astro/CMS réussi et zéro avis signalé par les deux audits de dépendances. La restauration a retrouvé comptes, versions, brouillons, médias et projection publique identique. Aucun contenu réel n’a servi aux tests.

La CI Linux a réussi : **35 scénarios CMS HTTP, 36 en production, 28 tests de contenu/publication/exploitation**, typage, formulaire natif du compte éditeur, tests navigateur et audits de dépendances. Les deux premières CI avaient révélé une écriture non persistée après conflit ; la cause et la correction sont documentées dans le rapport, avec de vraies régressions transactionnelles.

Le prototype distant a ensuite passé **8 contrôles Chromium** sur quatre parcours aux largeurs 320 et 1440 px, sans échec de ressources ni violation Axe détectée. Le bandeau, `noindex`, canonical et commit ont été relus ; sept chemins privés, dont `/admin`, `/api/users` et `/pro`, répondent 404. Aucun CMS ni brouillon n’a été transféré à Pages.

## Limites à lever avant mise en service

L’abonnement confirmé est **OVHcloud Hébergement Web Pro**, et non un VPS. Le site Astro statique peut y être hébergé ; l’exécution persistante du CMS Payload/Next et du worker n’y est pas établie. Aucun déploiement OVH, changement DNS ou achat complémentaire n’a été effectué. L’architecture d’administration compatible avec cet abonnement reste à résoudre : [ADR 0004](docs/adr/0004-prototype-github-et-ovh-pro.md).

L’administration distante, VPN/MFA, TLS, services Linux, alertes et sauvegardes hors machine restent non déployés et non testés. L’effacement définitif des fiches et versions CMS reste ouvert, malgré les outils de rétention livrés. Les autres remarques mineures de l’audit non traitées sont listées dans le rapport. Les contenus réels, horaires, coordonnées, images et mentions légales doivent encore être validés par la MSP. Aucun audit RGAA complet, Safari/Firefox, appareil physique ou test d’intrusion n’est revendiqué.

## Guides et retour arrière

- [Publier une actualité et administrer le site](GUIDE_ADMINISTRATION_SANTINNOVATION.md).
- [Maintenance](docs/MAINTENANCE.md).
- [Sauvegarder et restaurer](ops/README.md).
- [Déployer et revenir à une version précédente](docs/DEPLOIEMENT_RETOUR_ARRIERE.md).

Le rollback vérifie une release avant de la sélectionner ; la restauration ne remplace aucune donnée existante et n’active rien. Pour GitHub Pages, rejouer un commit vérifié contenant le mode prototype synthétique, puis contrôler son `prototype.json`. Ne pas remettre aveuglément l’ancien prototype institutionnel non validé en ligne.

**Candidat réauditable par Claude. Ce prototype public n’est pas un site de soins mis en service.**
