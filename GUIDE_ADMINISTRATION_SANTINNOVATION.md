# Administrer le site Sant’Innovation

Guide pour le médecin responsable et la coordination — candidat local du 9 octobre 2026. **Aucune mise en production OVH n’a été effectuée.** Le prototype GitHub Pages est une démonstration publique distincte utilisant des contenus fictifs. Une publication dans le CMS local prépare une version locale à contrôler ; elle ne met pas à jour ce prototype GitHub ni un site OVH.

L’administration s’ouvre à [http://127.0.0.1:3001/admin](http://127.0.0.1:3001/admin), quand le responsable technique a démarré les services. Il vous remet un compte personnel par un canal sûr. Aucune connaissance de Git, de Markdown ou du code n’est nécessaire pour l’édition quotidienne.

**Ne saisir aucune donnée patient**, même dans un brouillon ou une image : pas de dossier, ordonnance, résultat, photographie de soin identifiable ou demande médicale. Cette interface gère les informations publiques de la MSP. Les anciennes sources de démonstration `/pro` sont conservées hors du site public ; aucune GED n’est fournie.

![Tableau de bord de la recette fictive](docs/recette/admin-desktop.png)

## Publier une actualité

1. Ouvrir **Actualités**, puis créer une fiche. Renseigner **Titre**, **Résumé**, **Catégorie** et **Date de publication affichée**. Écrire le texte dans **Présentation / contenu**, avec les outils de mise en forme.
2. Choisir un **Identifiant dans l’adresse du site**, par exemple `atelier-prevention-fictif`. Utiliser des minuscules, chiffres et tirets, sans espace ni accent. Après publication, conserver cet identifiant pour éviter de casser les liens déjà diffusés.
3. Dans **Image**, choisir une image existante ou en ajouter une. Formats acceptés : JPEG, PNG ou WebP ; taille maximale : 5 Mo. Renseigner **Description pour les personnes malvoyantes** et **Crédit / droits de diffusion**. Vérifier les droits et l’accord des personnes photographiées avant toute diffusion.
4. Cliquer **Enregistrer le brouillon**, puis **Aperçu privé**. L’aperçu est privé et affiche le dernier enregistrement ; il ne montre pas les changements encore non enregistrés. Il permet de relire le contenu, mais ne reproduit pas toute la mise en page du site public. Il n’y a pas d’enregistrement automatique.
5. Après validation éditoriale, vérifier **Visible sur le site**, laisser **Archiver (masquer et conserver)** décoché et cliquer **Publier** ou **Publier les modifications**. Une date d’affichage future peut encore empêcher l’apparition immédiate.
6. Revenir au tableau de bord, rubrique **Publication du site**, puis contrôler la page sur [le site local](http://127.0.0.1:4321). Le service vérifie les changements toutes les 60 secondes ; ajouter le temps de construction du site. Si le service est arrêté ou en erreur, la version précédente reste visible.

Le message **Dernière génération du site prête.** indique qu’une génération a abouti. Vérifier également la fraîcheur du **Dernier contrôle** et le résultat public. **La dernière génération a échoué…** ou **Aucune génération du site confirmée…** appelle une intervention du responsable technique. Une fiche marquée « Publié » dans le CMS n’est pas, à elle seule, une preuve de mise à jour du site.

Pour une correction, ouvrir la fiche, modifier, enregistrer le brouillon, relire l’aperçu puis publier les modifications. Tant que le brouillon n’est pas publié, le site conserve la dernière version publiée.

## Dates d’un événement et période d’affichage

| Champ | Utilité |
| --- | --- |
| **Date de publication affichée** | Date présentée avec l’actualité ; elle ne programme pas sa mise en ligne. |
| **Début de l’événement** / **Fin de l’événement** | Dates du rendez-vous annoncé. Elles ne masquent pas automatiquement l’article. |
| **Début d’affichage (facultatif)** / **Fin d’affichage (facultative)** | Période pendant laquelle un contenu déjà publié peut apparaître sur le site. Sans limite, laisser le champ vide. |

Utiliser l’heure de Paris. Le CMS est configuré pour **France (Paris)** et les valeurs sont conservées en UTC. Vérifier le fuseau indiqué et le résultat dans l’aperçu et sur le site lors de la recette, notamment près des changements d’heure ; ne pas décaler manuellement une heure saisie tant que l’affichage du formulaire n’est pas confirmé. La date de fin d’affichage doit être postérieure au début. Le retrait à échéance dépend du service de génération : une panne peut retarder le retrait.

## Ajouter un lieu, puis un professionnel

Dans **Établissements**, créer la fiche avec le nom, l’adresse, les coordonnées professionnelles et les **Horaires d’ouverture**. Compléter les informations d’accès connues et les photographies. Cocher **Accès adapté aux personnes à mobilité réduite** uniquement après vérification du cabinet concerné ; donner les précisions utiles dans **Précisions d’accessibilité**.

La publication d’un établissement exige **Latitude vérifiée**, **Longitude vérifiée** et **Adresse et position géographique vérifiées**. Faire confirmer la position avec le responsable technique si nécessaire. Après une modification d’adresse ou de position : enregistrer le brouillon, vérifier à nouveau, cocher la confirmation puis publier. Les itinéraires du site sont construits à partir de l’adresse ; contrôler leur destination après publication. Modifier seulement le champ **Lien d’itinéraire** ne remplace pas cette vérification.

Dans **Professionnels**, renseigner le nom, **Nom complet affiché**, **Profession (filtre annuaire)** et **Profession affichée**. Choisir tous les **Lieux d’exercice**, puis ajouter une ligne dans **Horaires par établissement** pour chaque lieu concerné : **Établissement** et **Horaires de consultation**. Chaque lieu d’un horaire doit aussi être sélectionné dans les lieux d’exercice. Publier les établissements avant les professionnels qui les utilisent.

Ajouter les coordonnées professionnelles, la **Photographie** et le lien **Prise de rendez-vous Doctolib**. Utiliser la fiche exacte en HTTPS, puis tester le bouton sur le site. Confirmer **Accepte de nouveaux patients** et **Soins à domicile** auprès du professionnel. Pour un changement de lieu, mettre à jour ensemble la sélection des lieux et les horaires correspondants. Enregistrer le brouillon, relire puis publier.

Avant de masquer un établissement, réaffecter les professionnels concernés. Le CMS refuse désormais un retrait ou des dates qui rendraient incohérentes leurs fiches publiées et indique les professionnels à corriger. Un enregistrement en brouillon reste possible ; il ne retire pas le lieu publié.

![Édition d’un professionnel fictif](docs/recette/edition-professionnel.png)

## Autres contenus et liens

| Menu | Contenu modifiable |
| --- | --- |
| **Activités et services** | Présentation des activités, images et liens utiles. |
| **Recherche et innovation** | Projets, état réel d’avancement, images et liens. |
| **Partenaires** | Nom, description, site internet et logo, après validation du partenariat et des droits. |
| **Rubriques et mentions légales** | Textes des rubriques proposées dans **Rubrique du site**. |
| **Informations générales** | Identité, contacts généraux et liens communs ; modification réservée à un administrateur. |

Les liens sont saisis avec `https://`. Les champs Doctolib n’acceptent que Doctolib. Vérifier la destination, le libellé et les informations de contact avant publication. Les informations encore incertaines sont recensées dans [Vérification des contenus](docs/VERIFICATION_CONTENUS.md).

Pour les mentions légales, la confidentialité et l’accessibilité, enregistrer d’abord le texte corrigé en brouillon. Un administrateur doit ensuite confirmer **Contenu réglementaire validé par un administrateur** et publier. La validation précédente est annulée après modification. Les **Informations générales** exigent également **Coordonnées confirmées par un administrateur** après une correction des contacts. Cocher ces cases atteste une validation humaine préalable ; le logiciel ne vérifie pas leur exactitude juridique ou factuelle.

## Retirer ou restaurer un contenu

Les trois rubriques réglementaires doivent rester publiées et validées. Leur dépublication ou archivage bloque la génération complète et conserve l’ancien site : faire valider une nouvelle version avant de la publier.

Pour retirer une fiche, utiliser **Annuler la publication** et confirmer. Le retrait du site intervient après une génération réussie. Pour conserver un contenu rangé comme archive, cocher **Archiver (masquer et conserver)** puis **Publier les modifications** : cet état exclut la fiche de la sortie publique. Décocher **Visible sur le site** puis publier permet également de la masquer. Un simple enregistrement en brouillon de ces cases laisse la version publique précédente en place.

Pour revenir à un ancien contenu : ouvrir **Versions**, comparer les versions, choisir celle souhaitée, ouvrir le **chevron à côté du bouton Restaurer**, puis choisir **Restaurer comme brouillon**. Attention : le bouton principal peut restaurer et publier directement ; utiliser explicitement l’option brouillon. Relire **Aperçu privé**, vérifier dates, lieux, images et liens, puis publier explicitement. Une adresse ou un texte réglementaire restauré peut nécessiter une nouvelle confirmation. Jusqu’à 50 versions sont conservées par fiche ; pour un contenu plus ancien ou une perte de base, solliciter le responsable technique et les sauvegardes.

Les images enregistrées sont **immuables**, y compris leur description et leur crédit. Pour remplacer une photo ou corriger sa description, créer une nouvelle image, la choisir dans un brouillon, puis publier la fiche. Une image non référencée par un contenu public reste privée dans le CMS. Ne pas tenter de remplacer un fichier sur le serveur.

## Comptes et assistance

Un **Éditeur** gère et publie les contenus courants. Un **Administrateur** gère aussi les comptes dans **Accès administrateurs**, les coordonnées générales et les validations réglementaires. Utiliser un compte nominatif ; ne pas partager le mot de passe. L’administrateur choisit le **Rôle**, **Éditeur** ou **Administrateur**, et communique l’accès de manière privée.

Un éditeur peut changer son propre mot de passe depuis son compte. La récupération par courriel est désactivée : en cas de mot de passe perdu, contacter un administrateur. Il n’y a pas de second facteur intégré livré dans cette version. Fermer la session sur un poste partagé. En cas d’erreur, communiquer le nom de la fiche et le message affiché, sans mot de passe ni donnée de santé.

Le site reste la source de référence des actualités. Après publication autorisée, son lien peut être relayé manuellement sur les réseaux sociaux ; aucune diffusion automatique multiréseaux n’est prévue.

Le [guide de maintenance](docs/MAINTENANCE.md) est destiné au responsable technique. Les résultats réellement vérifiés et leurs limites figurent dans `LIVRAISON_SITE_MSP.md` ; ce guide décrit la procédure et ne constitue pas un procès-verbal de recette.

## Reconnaître un problème de publication

Le tableau de bord distingue « prêt », « aucun changement », « construction en cours », « publication bloquée », « erreur » et « version antérieure restaurée ». Après5 minutes sans contrôle récent, il avertit que le service est inactif ; l’onglet ouvert actualise ce signal. Pour une erreur éditoriale, la collection et l’identifiant de la fiche sont affichés. Corriger la fiche indiquée puis attendre un nouveau cycle. Un conflit d’écriture simultanée demande de recharger et réessayer : il ne signifie pas que la modification a été enregistrée.

Les sauvegardes, la restauration complète et les purges restent du ressort du responsable technique. Le bouton Versions ne remplace pas ces sauvegardes.

## Avenant du 10 octobre 2026 — annuaire, carte et publication

Sur l’accueil et dans l’annuaire, **Nom ou compétence** recherche dans le nom, la profession affichée, toutes les compétences et toutes les activités de la fiche. Les majuscules et les accents ne changent pas le résultat : `education` retrouve `Éducation`. Plusieurs mots peuvent être combinés ; chacun doit figurer dans la fiche. Les filtres **Profession** et **Lieu de consultation** s’ajoutent à cette recherche. Sans JavaScript, toutes les fiches restent accessibles, sans filtrage.

Dans **Professionnels**, la liste appelée techniquement `domaines` porte le libellé **Compétences** dans le CMS. Ajouter une ligne et renseigner son **Libellé** pour chaque compétence validée par le professionnel. Les activités se saisissent de la même façon dans **Activités**. Ne pas créer une compétence pour obtenir artificiellement un résultat de recherche.

Pour une infirmière exerçant aussi la coordination, conserver **Infirmier** dans **Profession (filtre annuaire)**, renseigner la **Profession affichée** souhaitée, puis ajouter une ligne **Coordination** dans **Activités**. Après publication et génération du site, la même fiche apparaît avec le filtre public **Infirmière** comme avec **Coordinatrice**. Aucun doublon de fiche ni changement du formulaire n’est nécessaire. Relire l’aperçu puis vérifier les deux filtres sur le site local.

La carte des établissements démarre automatiquement lorsque le visiteur approche de la rubrique. Le chargement du fond de carte transmet son adresse IP à l’IGN ; cette information est affichée sous la carte. Aucune géolocalisation du visiteur n’est demandée. Les adresses et les liens **Itinéraire** restent utilisables sans la carte ; en cas d’échec, **Réessayer le chargement de la carte** permet une nouvelle tentative.

Conserver les **dates futures validées**, qu’il s’agisse des événements ou de leur période d’affichage. Ne pas avancer une date pour forcer l’apparition d’une fiche : vérifier son état publié, sa visibilité et ses dates d’affichage. Une date d’événement future et une date de début d’affichage future n’ont pas le même effet, comme décrit plus haut.

Le prototype GitHub Pages utilise maintenant un instantané distinct de **contenus approuvés** ; la mention de contenus fictifs en introduction décrit le candidat du 9 octobre. **Publier dans le CMS local ne met pas instantanément à jour GitHub Pages**, ni un site OVH : cela alimente la génération locale à contrôler. La mise à jour du prototype distant suit une publication technique séparée et autorisée. Les indications de recette antérieures restent historiques ; cet avenant décrit la procédure actuelle, sans attester un nouveau déploiement.
