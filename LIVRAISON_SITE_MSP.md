# Livraison Sant’Innovation — compétences, carte et identité

**10 octobre 2026 — retours de relecture intégrés et publication GitHub autorisée.**

| Référence | Valeur |
| --- | --- |
| Branche de réalisation conservée | `codex/competences-carte-identite-2026-10-10` |
| **Commit fonctionnel exact** | **`13f25aeecdbdf33eb9d40a488ea5a65e0e4bf9e2`** |
| **Révision déployée et vérifiée** | **`4fac5e4d741bde0a00542363cf51788e1c8815be`**, incluant la précision documentaire du retour arrière |
| Prototype | [Sant’Innovation sur GitHub Pages](https://drflorianlabs.github.io/santinnovation-web/) |
| Vérification et déploiement | [CI 38055244077](https://github.com/DrFlorianLabs/santinnovation-web/actions/runs/38055244077) réussie ; GitHub Pages déployé à **15 h 26 (Paris)**, révision distante confirmée à 15 h 27. |

## Modifications de cette version

- Recherche sur le nom, la profession, **toutes les compétences et activités**, sans distinction d’accents ou de majuscules ; mots combinables avec les filtres profession et lieu. Les compétences dictées par l’utilisateur sont affichées intégralement. Florence est trouvable comme **Infirmière** et **Coordinatrice**, avec une seule fiche. Arrivée de Mathilde Guillaume–Sage le 01/01/2027 maintenue.
- Boutons principaux : dégradé turquoise–vert du kit, texte marine et ombres conservées ; contraste calculé au minimum 5,097:1. Motif inspiré du logo plus visible, limité à la marge ; texte fixe, défilement natif, préférence de mouvement réduit et absence de JavaScript respectés.
- Carte IGN automatique à l’approche de la rubrique, trois repères et informations pratiques en regard sur ordinateur ; carte au-dessus sur mobile. Aucune géolocalisation demandée. Information de transmission de l’IP à l’IGN affichée. Adresses et **Itinéraire** restent accessibles sans carte ; erreur et nouvelle tentative prévues.
- Retour des fiches TEAM-IC et Digital Medical Hub vers `/#recherche-innovation`, dans la page continue. Logos originaux ajoutés. Partenaires ARS Bourgogne-Franche-Comté, CPTS CaPaciTéS Besançon & Métropole et FeMaSCo-BFC ajoutés selon la demande utilisateur. [Sources et empreintes](docs/VERIFICATION_CONTENUS.md), droits graphiques non présumés.
- Guide d’administration complété : champ **Compétences**, activité **Coordination**, publication locale et instantané GitHub distincts. Aucun changement de schéma CMS ni de droits. Aucun document de recherche, export brut, secret ou fichier privé dans la sortie.

## Contrôles locaux réalisés

- **40 tests unitaires synthétiques réussis**, dont recherche multi-rôle, mots/accentuation, contrôles de contenus, publication/retrait et sauvegarde/restauration.
- **17 tests Chromium synthétiques réussis** : 21 routes à 320/768/1440 px, ancres, clavier, sans JavaScript, recherche sur les deux annuaires, carte automatique, tuiles fictives, échec puis nouvelle tentative et retour d’innovation dans l’accueil.
- Typage Astro **84 fichiers, zéro diagnostic** ; typage CMS réussi. Construction synthétique : 21 pages. Construction approuvée : **28 pages, 9 professionnels, 3 lieux, 76 fichiers**, contrôle de confidentialité réussi.
- Relecture des contenus approuvés, distincte des tests fictifs : **18 combinaisons page/largeur**, zéro violation Axe détectée ; **16 recherches** de compétences conformes, double filtre de Florence vérifié, deux retours d’innovation corrects, trois repères et tuiles IGN reçues. Captures ordinateur, mobile, équipe, carte, recherche et partenaires relues.

Un diagnostic de typage a été corrigé avant les succès ci-dessus. La validation stricte a également refusé treize copies locales suffixées apparues par synchronisation : elles ont été conservées dans un dossier privé avec empreintes, sans suppression ni assouplissement du contrat de publication. Un sélecteur du script de relecture visuelle a été corrigé ; la relecture complète a ensuite réussi.

## Vérification sur GitHub Pages

Les deux jobs de la CI finale sont réussis : vérifications CMS en HTTP et mode production, typage, 40 tests unitaires, constructions synthétique et approuvée, interfaces d’administration et de publication, 17 essais navigateur et audits des dépendances. La première exécution intermédiaire a été arrêtée volontairement au profit du commit comprenant aussi la procédure de retour arrière corrigée ; elle n’est pas comptée comme réussite.

Le manifeste public confirme `4fac5e4d741bde0a00542363cf51788e1c8815be`, `approved:true`, `synthetic:false` et le digest `5f454e5a5dc27f2ad367474b60586beaded6d7e8e9ab9a520ac118084f7e35ea`. Après déploiement, 18 combinaisons page/largeur et 16 recherches de compétences sont relues avec succès ; les deux liens de retour d’innovation reviennent dans l’accueil. Les douze clics d’ancres conservent le document à 390/1440 px. Neuf itinéraires, quatre rendez-vous individuels, trois repères, tuiles IGN reçues, logos chargés ; aucune erreur JavaScript ou ressource en échec observée. Les sept chemins privés ou retirés contrôlés répondent 404. Captures publiques de carte, partenaires et accueil mobile relues.

Les preuves structurées figurent dans `competences_carte_identite_2026_10_10` des [résultats](docs/recette/corrections-resultats-2026-10-09.json). Aucun test fictif ne prend un rendez-vous ni ne publie un contenu médical réel.

## Administration et limites

Avant synchronisation, une sauvegarde privée cohérente de SQLite, des médias et des secrets locaux a été effectuée (intégrité et clés étrangères vérifiées). Six professionnels ont été actualisés et les neuf fiches relues ; quatre partenaires et leurs logos originaux ont été synchronisés. Les informations légales et générales restent en brouillon, ainsi que le texte de confidentialité actualisé. Les autres champs et collections sont conservés. La présentation existante de Florence est gardée dans le CMS ; le snapshot public évite sa répétition avec les compétences. Les horaires, conditions d’accès PMR et contacts généraux non confirmés restent à renseigner. Les compétences sont déclarées par l’utilisateur, sans nouvelle qualification professionnelle déduite. Actualités et soins/parcours restent sans contenu inventé.

Pas de certification RGAA ni de test sur appareils physiques, Safari ou Firefox. Le CMS distant, l’hébergement de son exécution et la production OVH ne sont pas déployés. **Publier dans le CMS local ne met pas automatiquement le prototype GitHub à jour.**

## Retour arrière

Avant cette modification, `main` était `cce881ab5495156bf40e807db885843983dbbfe5` et le site déployé utilisait `c3de708488642d47272d81e92b389f27b90b4bb0`. Préparer un revert du commit fonctionnel `13f25aeecdbdf33eb9d40a488ea5a65e0e4bf9e2`, contrôler le résultat et demander l’autorisation du retour en ligne. Le prototype approuvé précédent serait restauré ; la base CMS resterait intacte. Aucun reset forcé ni rollback effectué.

Guides : [publication](GUIDE_ADMINISTRATION_SANTINNOVATION.md), [maintenance](docs/MAINTENANCE.md), [déploiement et retour arrière](docs/DEPLOIEMENT_RETOUR_ARRIERE.md).

---

## Historique — publication approuvée de l’équipe et de la carte, avant ces retours

# Livraison Sant’Innovation — prototype approuvé, équipe et carte

**10 octobre 2026 — publication des textes et informations professionnelles explicitement validée par l’utilisateur.** La présentation GitHub Pages reste distincte de la future mise en service sur OVH Web Pro.

## Révision actuelle

| Référence | Valeur |
| --- | --- |
| Branche de préparation conservée | `codex/prototype-valide-equipe-carte-2026-10-10` |
| **Commit exact du code livré** | **`c3de708488642d47272d81e92b389f27b90b4bb0`** |
| Push | `main` poussé et accepté par GitHub le 10 octobre 2026. |
| Vérifications / déploiement | [CI 38053039336](https://github.com/DrFlorianLabs/santinnovation-web/actions/runs/38053039336) réussie ; déploiement terminé à 14 h 50 (Paris), révision distante confirmée à 14 h 51. |
| Site public | [Sant’Innovation](https://drflorianlabs.github.io/santinnovation-web/) |

## Modifications

- Neuf professionnels confirmés, trois adresses harmonisées, Magali Saada-Baron retirée du public et conservée archivée dans le CMS privé. Arrivée de Mathilde Guillaume–Sage au 14 rue Henri et Maurice Baigue indiquée **à compter du 1er janvier 2027**. Fonctions de Florence Delay précisées.
- Un bouton général Doctolib pour la MSP et quatre liens individuels vérifiés : Patrick Vuattoux, Serge Mazzucotelli, Florian Sibille et Anaelle Bizet. Aucun lien supposé pour les cinq autres. Itinéraire Google Maps sur chaque fiche et chaque entrée de l’annuaire, calculé depuis l’adresse du lieu.
- Fond **Plan IGN**, API WMTS publique sans clé, trois repères géocodés par IGN/BAN ; chargement après clic, texte d’information, attribution, adresses et itinéraires disponibles sans carte. Erreur de tuiles signalée sans masquer les informations pratiques.
- Textes projet de santé, TEAM-IC et partenariat Digital Medical Hub approuvés et intégrés. Soins et parcours reste vide ; aucune actualité inventée. Documents internes sources et protocoles non diffusés.
- Palette du kit conservée. Les grands décors derrière le texte cèdent la place à un motif fin inspiré du logo, dans la marge, qui apparaît au fil du scroll. Texte immobile, scroll natif, réduction des mouvements et fonctionnement sans JavaScript préservés.
- Publication GitHub fondée sur neuf JSON publics contrôlés : champs autorisés, HTML nettoyé, relations et fichiers vérifiés. Aucun CMS ou export brut dans GitHub Pages. Le mode synthétique reste séparé et utilisé par les tests. Les garde-fous de publication de production restent intacts.

## Contrôles locaux

- Construction approuvée : **28 pages, 9 professionnels, 3 lieux, 69 fichiers** ; bandeau, `noindex`, liens, digest du contenu et absence de marqueurs privés contrôlés. Recherche supplémentaire des identifiants et du secret locaux dans cette sortie : aucun retrouvé.
- **38 tests unitaires synthétiques réussis** : dix cas du nouveau contrat approuvé et vingt-huit contrôles de contenu, publication, sauvegarde, restauration et reprise.
- **14 tests Chromium synthétiques réussis** : 21 routes à 320/768/1440 px, ancres à 390/1440 px, filtres, navigation clavier, sans JavaScript, préférence de mouvement, carte avec tuiles fictives et indisponibilité de la carte. L’absence de remplacement d’un lien individuel manquant est également vérifiée dans la suite finale réussie par la CI.
- Typage Astro : **79 fichiers, zéro erreur, avertissement ou suggestion**.
- Relecture du rendu approuvé : **15 combinaisons page/largeur**, pas de violation Axe détectée, neuf itinéraires, quatre liens individuels, trois repères IGN et tuiles réellement reçues. Captures relues ; cette relecture est distincte des fixtures synthétiques utilisées pour les tests.
- Liens Doctolib contrôlés sur leurs sources et adresses par géocodage officiel : [détail des sources et limites](docs/VERIFICATION_CONTENUS.md).

Un premier lancement navigateur avait utilisé par erreur la projection du prototype fictif, dont les coordonnées sont volontairement neutralisées, et un ancien sélecteur de décor. Il n’est pas compté comme succès ; le bon jeu synthétique et les sélecteurs actuels ont donné les 14 succès ci-dessus. Les erreurs et les résultats corrigés sont conservés localement.

## Vérification après déploiement

Les deux jobs GitHub Actions sont réussis : typage CMS/Astro, scénarios CMS HTTP et production, 38 tests unitaires, modes synthétique et approuvé, interfaces du compte et du statut de publication, 14 tests navigateur et audits de dépendances.

Sur l’URL publique, `prototype.json` confirme exactement `c3de708488642d47272d81e92b389f27b90b4bb0`, `approved:true` et `synthetic:false`. **12 combinaisons page/largeur** (320/1440 px) réussissent les contrôles de rendu et Axe ; **12 ancres** à 390/1440 px conservent le document. Les neuf itinéraires et quatre boutons individuels sont présents. La carte affiche les trois repères et ses tuiles IGN sont reçues en HTTP 200. Sept chemins contrôlés répondent 404, dont administration, API, `/pro`, ancienne fiche et ancienne actualité fictive. Aucune erreur JavaScript ou ressource en échec observée ; captures ordinateur, mobile et carte relues.

Preuves structurées ajoutées sous `approved_prototype_2026_10_10` dans [les résultats](docs/recette/corrections-resultats-2026-10-09.json), sans remplacer l’historique.

## Contenus et administration privés

Une sauvegarde privée du CMS de préparation a été réalisée avant mise à jour ; intégrité SQLite contrôlée. L’export relu contient 9 professionnels, 3 lieux, 6 rubriques, 2 innovations et 1 partenaire publiés. L’ancienne fiche et l’adresse historique sont archivées. Les trois rubriques réglementaires et les informations générales non confirmées restent en brouillon dans le CMS : aucune validation de production n’a été fabriquée. L’administration n’est pas déployée.

Le prototype GitHub est un instantané approuvé. **Le bouton Publier du CMS local ne met pas automatiquement GitHub à jour.** Les retouches du prototype suivent la procédure d’approbation et de construction documentée. Le circuit CMS local conserve son interface sans code ; le choix d’une administration distante compatible avec l’abonnement OVH Web Pro reste à résoudre.

## Limites et retour arrière

Les contacts généraux, horaires, informations d’accès et mentions réglementaires définitives restent à compléter. Absence de lien Doctolib vérifié ne signifie pas absence de fiche. Les coordonnées géographiques ne garantissent pas l’entrée accessible. Pas d’audit RGAA complet, d’essai sur appareils physiques/Safari/Firefox ni de déploiement OVH revendiqué. Aucun résultat de recherche ou recrutement TEAM-IC ouvert n’est annoncé.

Retour arrière : préparer un revert de `c3de708488642d47272d81e92b389f27b90b4bb0`, refaire les contrôles puis pousser après autorisation. Le mode synthétique précédent sera rétabli ; la base CMS demeure intacte. La révision de référence antérieure est `33f6ed2732c0896844dfa86b610f57668411ccaa` (code déployé `e230595ea2fc6ae9a35fea934c497f226fb8e62d`). Aucun rollback réalisé.

Guides : [publication éditoriale](GUIDE_ADMINISTRATION_SANTINNOVATION.md), [maintenance](docs/MAINTENANCE.md), [déploiement et retour arrière](docs/DEPLOIEMENT_RETOUR_ARRIERE.md). Le présent compte rendu est enregistré après le commit fonctionnel pour citer son identifiant exact ; son seul changement ne redéploie pas le site.

---

## Historique — kit graphique du 10 octobre, avant validation des contenus

| Référence | Valeur |
| --- | --- |
| Branche de préparation | `codex/identite-projet-patients-2026-10-10` |
| **Commit exact de cette version historique** | **`e230595ea2fc6ae9a35fea934c497f226fb8e62d`** |
| GitHub / Pages | Push autorisé sur `main` ; [CI 38050692688](https://github.com/DrFlorianLabs/santinnovation-web/actions/runs/38050692688) réussie ; déploiement terminé le 10 octobre à 14 h 09 (Paris). |
| Vérification distante | Même révision relue via `prototype.json` après déploiement ; 8 contrôles navigateur et 12 clics d’ancres réussis. |
| Prototype public | [drflorianlabs.github.io/santinnovation-web](https://drflorianlabs.github.io/santinnovation-web/) |

### Présentation

Retour à la palette du kit fourni : **marine #023250, turquoise #25B1B4, vert #80C167**. Le symbole vectoriel, sa version blanche et son adaptation pour petite taille remplacent les anciennes reproductions du site et du favicon. Les originaux restent conservés dans le kit utilisateur. Les motifs géométriques animés sont rétablis ; les grands cadres sont remplacés par des fonds continus, des séparateurs légers et une présentation éditoriale aérée. Le scroll reste natif ; clavier, ancres et réduction des mouvements sont respectés. La rubrique « Soins et parcours » est volontairement vide. Voir [les choix visuels et le retour arrière](docs/IDENTITE_VISUELLE_2026-10-10.md).

### Contenus réels préparés, non publiés

Le projet de santé de juillet 2025, les dispositions institutionnelles des statuts et le protocole TEAM-IC v4 du 4 septembre 2026 ont servi à préparer une présentation pour les patients. Deux sujets distincts sont prêts : TEAM-IC et le partenariat avec Digital Medical Hub confirmé par l’utilisateur. Aucun résultat de recherche, recrutement ouvert ou validation réglementaire n’est inventé. La liste de dix professionnels est datée et à actualiser ; les horaires et rattachements manquants ne sont pas complétés arbitrairement. L’adresse historique de structure n’est pas présentée comme un lieu actuel de rendez-vous confirmé.

**21 brouillons** ont été enregistrés dans une nouvelle base privée Payload : 6 rubriques, 10 professionnels, 1 adresse historique, 2 présentations recherche/innovation, 1 partenaire et 1 fiche générale. Relecture authentifiée par API, connexion dans l’interface, formulaire et aperçu TEAM-IC vérifiés ; tous les statuts restent `draft`. L’export public est vide dans les huit collections. Aucun worker ni déploiement ne sont raccordés à cette base de préparation ; l’essai fictif précédent est conservé.

Un aperçu graphique privé est disponible localement sur le Mac à `http://127.0.0.1:4325/`, avec authentification pour chaque page et ressource. L’administration de ces brouillons est sur `http://127.0.0.1:3002/admin`. Les identifiants, guide de relecture, textes, captures et documents sources restent hors Git. L’aperçu graphique est un instantané de relecture ; l’aperçu natif Payload reflète les brouillons enregistrés. Ces services ne sont pas configurés pour redémarrer automatiquement.

### Couverture de validation de cette révision

- Construction de 21 pages avec les données synthétiques et typage Astro de 77 fichiers : aucun diagnostic.
- **12 tests Chromium locaux réussis** : 21 routes à 320/768/1440 px, ancres à 390/1440 px, sans JavaScript, menu mobile et changement de préférence de mouvement à chaud. Captures ordinateur et mobile relues.
- CI Linux complète réussie : CMS HTTP et production, typage, tests de publication/sauvegarde/restauration, interface du compte, navigation publique, état de publication et audits de dépendances.
- Après déploiement : **8 contrôles publics** avec ressources et Axe réussis ; palette, logo, rubrique vide, ordre des sept rubriques et **12 ancres sans rechargement** vérifiés ; les sept chemins privés contrôlés répondent 404. Les textes réels sont absents du prototype public.
- Serveur de relecture : **19 contrôles de sécurité sur fixtures synthétiques** réussis (authentification, assets, permissions, chemins, liens symboliques, absence de listing, absence de secret dans les logs). Relecture réelle refusée aux anonymes : aperçu HTTP 401 et API CMS HTTP 403.

Aucun audit RGAA complet, appareil physique, Safari/Firefox ou déploiement OVH n’est revendiqué. Le serveur de relecture est un outil ponctuel limité à la boucle locale, pas un serveur de production. Les preuves actuelles figurent sous `identity_2026_10_10` dans le [fichier de résultats](docs/recette/corrections-resultats-2026-10-09.json).

## Historique — présentation du 9 octobre 2026

| Référence | Valeur |
| --- | --- |
| Branche de préparation | `codex/accueil-patients-2026-10-09` |
| **Commit exact de la présentation précédente** | **`5b22739da8d6b8d95962ec82a744e1080a45fa8e`** |
| GitHub / Pages | Push sur `main` et [CI 37923494674](https://github.com/DrFlorianLabs/santinnovation-web/actions/runs/37923494674) réussis ; déploiement terminé à 13 h 29 (Paris). |
| Révision distante relue | `5b22739da8d6b8d95962ec82a744e1080a45fa8e`, via `prototype.json`, à 13 h 30 (Paris). |
| Prototype public | [drflorianlabs.github.io/santinnovation-web](https://drflorianlabs.github.io/santinnovation-web/) |

La navigation principale descend maintenant dans une page continue : **rendez-vous → actualités compactes → équipe → lieux → soins et parcours → projet de santé → recherche et innovation**. Les fiches détaillées et articles conservent leurs adresses. Le menu fonctionne sans JavaScript ; avec JavaScript, la rubrique active est signalée et le menu mobile se ferme après sélection. Les titres restent visibles sous l’en-tête fixe.

La palette utilise un bleu cobalt, du violet et des touches corail sur des fonds clairs. Le logo et le favicon n’ont pas été modifiés. Le [prompt de remise au propre du logo](docs/PROMPT_REMISE_AU_PROPRE_LOGO.txt) est prêt à copier dans un autre chat, avec l’original joint. La [liste des informations pour le pré-site](docs/INFORMATIONS_POUR_PRE_SITE.md) distingue les données historiques à confirmer des informations encore absentes. Aucun contenu institutionnel réel n’a été ajouté au prototype.

**Validation de cette révision :** construction synthétique réussie ; typage Astro sur 76 fichiers sans erreur, avertissement ni suggestion ; **11 tests navigateur**, couvrant 21 routes aux largeurs 320, 768 et 1440 px, plus les parcours d’ancres à 390 et 1440 px et sans JavaScript. Les vérifications CMS, publication, sauvegarde, restauration, compte éditeur et dépendances ont aussi réussi dans la CI Linux. Les contrôles Axe automatisés ne remplacent pas un audit RGAA.

Après déploiement, **8 contrôles Chromium distants** ont réussi sur quatre parcours à 320 et 1440 px, sans ressource en échec ni violation Axe détectée. Les **12 clics d’ancres** à 390 et 1440 px ont conservé le même document, respecté l’ordre des sept rubriques et laissé les titres visibles ; les retours depuis un article sont fonctionnels. Les sept chemins privés contrôlés répondent toujours 404. Captures locale et distante relues visuellement. Les résultats sont ajoutés sous `homepage` dans le [fichier de preuves](docs/recette/corrections-resultats-2026-10-09.json), sans remplacer les preuves historiques du socle ci-dessous.

Pour revenir à la présentation précédente, préparer un revert du commit `5b22739da8d6b8d95962ec82a744e1080a45fa8e`, refaire les contrôles, puis déployer le prototype synthétique et relire son manifeste. Ce retour arrière ne touche pas la base CMS. Aucun rollback n’a été effectué.

## Socle de sécurité et publication — révision précédente

| Référence | Valeur |
| --- | --- |
| Branche de préparation | `codex/corrections-audit-2026-10-09` |
| Base auditée par Claude | `a50140b6a525b1a0d2d134a07ea36fc13355c032` |
| **Commit exact du socle corrigé et testé** | **`8fb575d88592c25943c56f75eeec0526234d0c87`** |
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
