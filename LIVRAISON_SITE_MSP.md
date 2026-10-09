# Livraison Sant’Innovation — corrections après audit Claude

**9 octobre 2026 — prototype pour l’équipe, administration et exploitation vérifiées localement.**

Le périmètre initial limité aux commits locaux a été remplacé par l’autorisation utilisateur de pousser sur `main` et de conserver GitHub Pages pour présenter le prototype. La mise en production OVH et la publication de contenus institutionnels réels restent distinctes.

## Révision exacte

| Référence | Valeur |
| --- | --- |
| Branche de préparation | `codex/corrections-audit-2026-10-09` |
| Base auditée par Claude | `a50140b6a525b1a0d2d134a07ea36fc13355c032` |
| **Commit exact du code corrigé et testé** | **`acbb6fc60d6d6a7bdf6284f0f64fdf4c9b702db9`** |
| GitHub / Pages | Preuve de push et de déploiement à consigner après réussite de la CI distante. |

Ce document est ajouté après le commit de code, afin d’éviter une référence circulaire. La livraison précédente reste consultable dans l’historique Git à la base auditée. Les preuves du premier candidat sont préservées ; les résultats des corrections sont identifiés séparément.

## Changements livrés

- Publication : reprise après interruption, délais maximaux, état fiable et avertissement si le worker s’arrête ; lieux et professionnels contrôlés avant publication/retrait.
- Administration : récupération par e-mail explicitement désactivée, absence d’énumération par cette route, API de permissions privée, changement du mot de passe propre sans élévation de rôle, initialisation production sans fichier d’identifiants.
- Exploitation : sauvegarde chiffrée de la base, médias, secret et site ; restauration vérifiée dans un dossier neuf sans activation ; retour arrière avec contrôle des empreintes, maintien de la version choisie et rétention explicite à blanc.
- Prototype : base fictive neuve, bandeau de démonstration et `noindex`, canonical GitHub correct, aucun CMS ni `/pro`, liens de rendez-vous/e-mail/itinéraire neutralisés.
- Git : références réparées ; 72 copies FUSE retirées du suivi tout en conservant les fichiers locaux. Aucun changement de visibilité du dépôt.

## Validation

Les [résultats structurés](docs/recette/corrections-resultats-2026-10-09.json) et le [rapport de corrections](docs/recette/CORRECTIONS_AUDIT_2026-10-09.md) donnent les commandes, la couverture et la réponse aux anomalies.

Localement, Node 24 et données synthétiques : **33 scénarios CMS en production**, **26 tests de projection/publication/sauvegarde**, **7 cas de chaîne CMS → Astro**, **8 groupes navigateur public**, **8 contrôles du prototype** et **4 parcours d’administration** réussis. Worker observé en 65 secondes ; états du tableau de bord et alerte d’inactivité éprouvés. Typage Astro/CMS réussi et zéro avis signalé par les deux audits de dépendances. La restauration a retrouvé comptes, versions, brouillons, médias et projection publique identique. Aucun contenu réel n’a servi aux tests.

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
