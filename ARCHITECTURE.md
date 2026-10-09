# Architecture — Sant’Innovation

## Décision locale du 9 octobre 2026

Astro 7 produit le site statique. Payload 3 et Next fournissent une **application éditoriale distincte**, sans fonction de soins ni GED. L’ADR 0003 complète l’ADR 0001 pour l’administration ; les règles de la future GED de l’ADR 0002 restent hors périmètre.

```text
Responsable autorisé → session Payload → base SQLite + fichiers privés
                          ↓ Publier / Dépublier
worker local chaque minute → export publié → projection/assainissement
                          → build Astro en répertoire neuf
                          → lien site-current remplacé atomiquement
Visiteur → serveur statique → HTML / styles / scripts / médias publiés
```

Aucun appel du navigateur public au CMS, aucun jeton CMS dans le HTML et aucun build déclenchable depuis une route publique. Carte CARTO uniquement après action du visiteur. Doctolib et itinéraires sont des liens externes.

## Administration

Collections : professionnels, établissements, actualités, activités et services, recherche/innovation, partenaires, informations générales (une fiche), rubriques éditoriales. Relations professionnels–lieux et horaires par lieu centralisées ; adresse unique et itinéraires dérivés à chaque export. Images privées, exportées sous nom de contenu SHA-256 seulement si une fiche publiée les référence. Images immuables : remplacer signifie importer un nouveau fichier puis publier la fiche qui le référence.

Brouillons et versions sont natifs Payload. Aperçu distinct authentifié, rendu éditorial avant publication ; ce n’est pas une copie complète de la mise en page Astro. Statut de la génération visible au tableau de bord. Le worker assure les dates d’affichage même sans modification manuelle. Au plus 50 versions par fiche, sauvegardes séparées requises.

## Invariants vérifiables

1. API, versions, médias d’origine et aperçus refusent les anonymes. GraphQL désactivé.
2. Le rôle éditeur gère le contenu ; l’administrateur gère aussi comptes/informations/validation réglementaire. Pas de délégation par professionnel en V1.
3. Publier un lieu exige adresse et position confirmées. Une modification les invalide. Un pro publié ne peut produire de relation orpheline dans l’export.
4. Modifier un texte légal invalide sa validation ; publication administrateur seulement. Cette validation technique ne remplace pas une validation juridique.
5. Export local filtré `_status=published`, visibilité, archive, fenêtres de temps. Lecture `draft:false` ; modifications en brouillon n’altèrent pas le publié.
6. Seuls champs autorisés sortent dans la projection. Rich text nettoyé ; pas de scripts, HTML arbitraire ni média embarqué privé. Images par champs typés.
7. `cms/.local`, `.local`, `.releases` et le dépôt ne sont jamais racines web. Seul `.local/site-current` est servi. Les builds précédents restent privés.
8. Sources `/pro` déplacées vers `src/pro/demo`, conservées mais non routées. Aucune sécurité simulée n’est proposée au public.
9. GitHub Actions contrôle le code puis déploie uniquement un prototype synthétique marqué et non indexable, sur `main`, selon la nouvelle autorisation utilisateur. Le CMS et ses données ne sont pas déployés sur GitHub Pages.

## Hébergement et limites

L’utilisateur a souscrit **OVHcloud Hébergement Web Pro**, offre mutualisée. Elle est la cible confirmée du site Astro statique. L’exécution de Payload/Next et du worker Node persistants sur cet abonnement n’est pas établie ; l’architecture d’administration distante reste à adapter ou à arbitrer. Les modèles de serveur Node/Linux sont des références testables, sans achat ni déploiement, et ne décrivent pas les capacités du mutualisé. La maintenance éditoriale est sans code, l’exploitation reste technique : supervision, TLS, mises à jour, stockage, migrations, sauvegarde et restauration.

Publication nominale : prochain cycle de 60 s + build. Une erreur conserve l’ancien site et affiche un statut d’échec ; une panne peut retarder une dépublication/fin d’affichage. Pas de cache persistant côté public en V1. La version distante, TLS, reverse proxy, protection de préproduction, sauvegarde et reprise doivent être testés dans l’environnement retenu.
