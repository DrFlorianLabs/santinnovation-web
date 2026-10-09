# ADR 0003 — Administration éditoriale Payload et site public Astro

- **Statut :** décision technique pour la réalisation locale et la recette ; hébergement et ouverture publique non autorisés.
- **Date :** 9 octobre 2026.
- **Périmètre :** site institutionnel et contenus publics, sans donnée patient ni formulaire médical.
- **Origine :** mission de finalisation et complément prioritaire « Back-office d’administration complet » fournis par l’utilisateur.
- **Complète :** ADR 0001 pour l’administration éditoriale. Les frontières de la GED décrites dans les ADR 0001 et 0002 restent applicables.

**Actualisation du 9 octobre après audit :** [ADR 0004](0004-prototype-github-et-ovh-pro.md) consigne l’autorisation de push/prototype GitHub et l’abonnement Web Pro confirmé. La proposition VPS ci-dessous n’est pas un hébergement retenu ou acheté. Le CMS reste validé localement ; sa compatibilité avec l’offre souscrite reste à résoudre.

## Besoin et décisions utilisateur

La maintenance courante doit se faire dans une interface graphique : professionnels, établissements, horaires par lieu, actualités, activités, innovations, partenaires et informations générales. L’utilisateur doit pouvoir enregistrer un brouillon, prévisualiser, publier, dépublier, archiver et restaurer une version sans Markdown, Git ou intervention d’une IA.

Astro et l’identité existante sont conservés. OVHcloud est privilégié. Le site est la référence des actualités et aucun relais automatisé multiréseaux n’est demandé en V1. Les pages `/pro` restent des démonstrations ; elles ne deviennent pas une GED ou un espace sécurisé réel.

Les modifications et commits locaux sont autorisés. Cette décision ne vaut pas autorisation de souscrire un hébergement, modifier le DNS, créer des accès externes, pousser des commits ou déployer en production.

## Comparaison courte, vérifiée le 9 octobre 2026

| Solution | Atouts pour ce site | Coûts et contraintes déterminants |
| --- | --- | --- |
| **Payload** | Interface native, authentification serveur, contenus structurés et relations, médias, brouillons et restauration des versions. Licence MIT. | Application Node/Next distincte, base et stockage persistants ; configuration métier et exploitation technique nécessaires. Le frontend Astro peut rester statique. |
| **Decap / Sveltia** | Interface graphique compatible avec Astro ; stockage versionné Git ; faible charge applicative. | Le CMS ne remplace pas l’authentification du fournisseur Git ni le pipeline de publication. Confidentialité des brouillons incompatible avec leur stockage dans un dépôt public. Comptes Git et proxy OAuth éventuel ajoutent des dépendances au parcours d’administration. |
| **WordPress headless** | Administration largement utilisée, licence GPL, révisions et API ; fonctionnement PHP compatible avec un mutualisé adapté. | Les relations professionnels–lieux–horaires et leur interface demandent une configuration ou des extensions ; aperçu Astro, protection des médias et reconstruction statique restent à intégrer. Maintenance de deux environnements PHP/Node et des extensions retenues. |
| **Directus** | Modèle relationnel, administration et gestion des versions bien adaptés. | Les conditions commerciales ont évolué en 2026. Le plan Core gratuit comporte des limites ; l’accès gratuit complet peut dépendre de l’Open Innovation Grant et de son éligibilité. Aucune éligibilité de la MSP n’est présumée. |

Sources primaires : [licence Payload](https://raw.githubusercontent.com/payloadcms/payload/main/LICENSE.md), [versions Payload](https://payloadcms.com/docs/versions/overview), [workflow Decap](https://decapcms.org/docs/editorial-workflows/), [backends Decap](https://decapcms.org/docs/backends-overview/), [Sveltia](https://sveltiacms.app/en/docs/intro), [authentification Sveltia](https://github.com/sveltia/sveltia-cms-auth), [licence WordPress](https://wordpress.org/about/license/), [API WordPress](https://developer.wordpress.org/rest-api/reference/), [types de contenu WordPress](https://developer.wordpress.org/plugins/post-types/), [tarifs Directus](https://directus.com/pricing), [évolution OIG de septembre 2026](https://directus.com/resources/making-the-oig-perpetual-and-clearer).

Les fonctions gratuites natives de Payload suffisent au périmètre retenu ; aucun module entreprise n’est présumé acquis. Le workflow métier de validation légale est une règle du projet, pas une promesse d’abonnement à un module commercial.

## Décision de réalisation locale

Retenir **Payload comme application éditoriale distincte**, avec une configuration métier dans `cms/`, et conserver **Astro en génération statique** pour le site public. L’interface et les mécanismes d’authentification, de stockage, de brouillons et de versions sont ceux d’un CMS existant. Le code propre au projet se limite au modèle de contenu, aux validations, à l’aperçu, à l’export et à la chaîne de génération/publication.

Cette solution ajoute une exploitation serveur mais évite de faire utiliser Git aux responsables éditoriaux et permet des droits vérifiés par le serveur. Elle est retenue pour la cohérence du besoin complet, pas comme preuve qu’un CMS est déjà exploité en production. Les scénarios A à F et leurs résultats réels figurent dans la livraison.

## Frontières et données faisant autorité

```text
Responsable autorisé ── HTTPS ──> CMS privé : authentification + base + médias
                                      │
                           aperçu protégé / brouillons / versions
                                      │
                           action éditoriale de publication
                                      │
                         export des seuls contenus publiés
                         et de leurs médias référencés
                                      │
                         validation + génération Astro
                                      │
                         version statique du site public
```

1. **Le CMS est la source éditoriale** une fois initialisé avec les données validées. Le dépôt contient le code, les schémas et les éléments nécessaires à la reprise ; il ne doit pas devenir une seconde interface de maintenance quotidienne.
2. **Le CMS reste privé.** Une route d’administration ou d’aperçu n’est pas protégée par `noindex`. Authentification et autorisations doivent être appliquées aux données, versions et URL directes des médias.
3. **Les brouillons ne sont jamais exportés publiquement.** Le moteur d’export sélectionne la version publiée, filtre les dates et états, et applique une liste explicite des champs autorisés. Les utilisateurs, secrets, révisions, notes internes et anciens fichiers sans référence publique ne font pas partie de la sortie.
4. **Les médias restent privés dans le CMS.** Seules les images référencées par une sortie publiée sont copiées dans l’artefact public. L’archivage ou la dépublication doit retirer leurs références et les fichiers devenus inutiles de la nouvelle version publique. Une ancienne version de déploiement n’est pas une archive publique accessible.
5. **Relations centralisées.** Un professionnel référence ses lieux, avec ses horaires pour chaque lieu. Les cartes, itinéraires et fiches utilisent la même adresse éditoriale ; un changement d’adresse invalide son ancienne vérification géographique.
6. **La publication éditoriale et le déploiement sont distincts.** En recette, la publication ne vise que l’environnement local autorisé. Le futur pipeline de production ne sera activé qu’après validation explicite. Un build échoué ne remplace pas le site précédent ; le résultat doit être visible pour le responsable.
7. **Les dates d’affichage exigent un service actif.** Une sortie statique ne change pas à l’échéance sans nouvelle génération. Le processus de reconstruction doit traiter les échéances même sans nouvelle modification éditoriale, et signaler ses erreurs.
8. **La GED reste hors périmètre.** Aucune donnée patient, document clinique, authentification Pro Santé Connect ou GED de production n’est introduit dans ce CMS éditorial.

## Authentification, autorisations et validation

Administration centralisée par responsables nominatifs. Les droits de gestion des comptes restent réservés à l’administrateur. Le futur droit d’un professionnel de proposer sa propre fiche pourra être ajouté après une recette dédiée ; il n’est pas simulé dans cette V1.

Les pages réglementaires demandent une validation administrative avant publication ; modifier le texte après validation doit retirer ou renouveler cette validation. Restaurer une version doit respecter les mêmes règles qu’une modification ordinaire.

Le CMS fournit [l’authentification](https://payloadcms.com/docs/authentication/overview), les [brouillons](https://payloadcms.com/docs/versions/drafts) et les [droits](https://payloadcms.com/docs/access-control/overview), mais leur existence ne suffit pas : la configuration du projet doit être testée. Pour les appels à l’[API locale](https://payloadcms.com/docs/local-api/overview) qui doivent respecter les droits d’un utilisateur, `overrideAccess: false` doit être explicite. Les opérations internes privilégiées, lorsqu’elles existent, doivent avoir une frontière documentée et ne pas recevoir de requête non autorisée.

La recette vérifie notamment : anonyme, utilisateur sans rôle admis, tentative d’élévation de rôle, lecture avec `draft=true`, lecture/restauration des versions, accès direct aux fichiers, aperçu privé, dépublication et export des médias. Les endpoints REST et GraphQL sont contrôlés ou désactivés selon la configuration réelle. La documentation native indique que les [uploads héritent du droit de lecture de leur collection](https://payloadcms.com/docs/upload/overview#access-control).

## Hébergement OVHcloud : proposition, pas contrat

L’ADR 0001 conserve une sortie statique compatible avec Apache mutualisé pour le frontend. Un mutualisé statique **ne fournit pas** le serveur Node persistant, la base privée et le processus de publication nécessaires au CMS.

La cible proposée est un **VPS OVHcloud**, avec service CMS, stockage privé persistant, base, reverse proxy HTTPS et processus de génération surveillé. Le frontend peut être servi sur ce VPS ou rester sur un hébergement statique, à condition que la synchronisation et le retour arrière soient testés. Les [conditions de déploiement Payload](https://payloadcms.com/docs/production/deployment) exigent de prévoir base, stockage des fichiers et services nécessaires au projet. La production utilise un serveur de production, pas `next dev`.

**Aucun VPS n’a été contracté dans cette mission.** Localisation, dimensionnement, fournisseur de mail, sauvegardes, restauration, protection des accès administratifs et responsable d’exploitation restent à valider avant ouverture. Aucun accès OVH ni modification DNS n’est autorisé par cet ADR.

## Coût : hypothèse de cadrage sans devis

- Licence des fonctions Payload retenues : **0 €**, au titre de la licence MIT consultée.
- Hypothèse budgétaire de travail : **10 à 25 € HT/mois pour une petite infrastructure**, hors domaine, prestataire de maintenance, options spécifiques et migration. Ce montant est une estimation d’ingénierie, pas une offre OVHcloud ni une garantie de coût total.
- Le [catalogue VPS OVHcloud](https://www.ovhcloud.com/fr/vps/) et ses [options de sauvegarde](https://www.ovhcloud.com/fr/vps/options/) doivent être vérifiés lors de la décision : prix d’appel, engagement, renouvellement, localisation et rétention peuvent différer.
- Temps de surveillance, mises à jour, gestion des incidents et tests de restauration : **non chiffré, aucun devis obtenu**. Une copie quotidienne courte du VPS ne remplace pas à elle seule une politique de sauvegarde avec restauration testée.

Ce choix ne doit pas être présenté comme une maintenance serveur réalisable sans compétences techniques. Aucun abonnement ni paiement n’est déclenché.

## Maintenance et retour arrière

**Maintenance éditoriale :** le médecin ou la coordination utilise les formulaires, l’aperçu, les boutons de publication et l’historique. Aucun accès au code ne doit être nécessaire pour les changements ordinaires couverts par le modèle.

**Maintenance technique :** un responsable identifié assure les mises à jour CMS/Node/dépendances, le certificat HTTPS, les sauvegardes de base et fichiers, les migrations, le suivi des erreurs et les tests de restauration. Le guide de maintenance doit distinguer ces tâches des opérations quotidiennes.

Une restauration de version éditoriale remet un contenu antérieur dans le workflow du CMS. Un retour arrière de déploiement restaure une version statique connue et ne doit pas détruire les brouillons ou la base. Un retour arrière de base impose une sauvegarde préalable, une fenêtre maîtrisée et une procédure spécifique. Les résultats testés et limites de ces trois mécanismes sont consignés dans la livraison.

## Conséquences et limites avant validation

Les en-têtes du frontend et ceux du CMS ont des exigences différentes : l’administration peut avoir besoin de scripts et d’aperçus que le site statique n’utilise pas. Ne pas affaiblir la politique publique simplement pour faire fonctionner l’interface privée.

Le déploiement public reste bloqué par l’absence d’accord et par les validations de contenu recensées dans [VERIFICATION_CONTENUS.md](../VERIFICATION_CONTENUS.md). La décision locale est réversible : la dernière version statique conserve son autonomie et les données CMS doivent rester exportables. La recette indépendante peut demander une révision de ce choix avant tout engagement d’hébergement.
