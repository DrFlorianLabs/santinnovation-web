# Identité et présentation — 10 octobre 2026

La demande utilisateur du 10 octobre remplace la palette cobalt/violet/corail du 9 octobre par celle du kit fourni `SANT_INNOVATION_2026-10-10_v1` : **marine #023250, turquoise #25B1B4, vert #80C167**. Le guide décrit ces valeurs comme une reconstruction du JPEG, sans certification colorimétrique d’impression. Les dérivés sombres des liens servent à assurer le contraste du texte ; les couleurs de marque restent celles du kit.

Les SVG de diffusion `symbole_reference`, `symbole_blanc` et `symbole_micro_aplats` sont utilisés respectivement pour le logo courant, le pied de page et le favicon. Ils sont copiés sans modifier leurs tracés, après contrôle de l’absence de script, de référence externe et d’image matricielle. Les originaux du kit sont conservés hors dépôt. Aucun document interne ou fichier de police supplémentaire n’est publié.

L’accueil conserve son ordre et ses ancres. Les sections utilisent des fonds ouverts, des séparateurs légers et des motifs géométriques locaux. Les présentations du projet de santé et de la recherche utilisent deux colonnes sur grand écran, avec un titre qui accompagne la lecture. Le défilement reste natif : aucune capture de la molette, aucun écran imposé, aucun contenu masqué par l’animation. Les mouvements cessent hors écran, sur écran tactile et lorsque la préférence de réduction des mouvements est activée. Les liens, le clavier et les contenus fonctionnent sans JavaScript.

La rubrique « Soins et parcours » est temporairement laissée vide à la demande de l’utilisateur, à l’accueil et sur son adresse directe. Son contenu CMS et les activités existantes sont conservés ; remettre cette rubrique en service demandera de réactiver son rendu après validation des contenus.

Les nouveaux textes institutionnels sont préparés séparément en brouillons privés, depuis les documents fournis et le protocole TEAM-IC retrouvé. Ils ne sont pas des fixtures de test et ne sont pas incorporés au build synthétique GitHub Pages. Les documents sources, notes de travail et brouillons restent hors Git ; leur publication réelle demeure une décision éditoriale explicite après relecture.

Contrôles locaux : construction de 21 pages synthétiques ; typage Astro de 77 fichiers sans diagnostic ; 12 tests Chromium, dont accessibilité automatisée à 320/768/1440 px, ancres à 390/1440 px, fonctionnement sans JavaScript et changement de préférence de mouvement à chaud. La recette ne constitue pas un audit RGAA complet ni un contrôle sur appareil physique.

Retour arrière : revenir au commit précédent `e981abbc2f653601fbd313af87e2ac3037ee4be1`, reconstruire le prototype synthétique et contrôler le manifeste distant. Les brouillons CMS et le kit source sont indépendants de ce retour arrière visuel.

## Avenant du 10 octobre 2026 — boutons, décor et carte

Les boutons principaux utilisent désormais un dégradé à 110°, interpolé en sRGB, du **turquoise #25B1B4** au **vert #80C167**, avec un libellé **marine #023250**. Les ombres et le relief sont conservés. Le calcul sur 1 001 positions du dégradé donne un contraste minimal de **5,097:1** côté turquoise et de **6,187:1** côté vert, supérieur au seuil AA de 4,5:1 pour le texte courant. Ce calcul concerne le libellé sur ce fond ; il ne constitue pas une certification d’accessibilité du site.

Le décor initial derrière les sections est remplacé par un motif de maisons, de liaisons et de points dans la seule marge droite disponible, sans aplat derrière le texte. Sa largeur augmente avec l’espace libre, de 16 à 144 px sur ordinateur ; sur petit écran, il se réduit à un tracé de 8 px sans maison. Le dessin se révèle de haut en bas selon le défilement natif ; aucun texte ne se déplace. Sans JavaScript ou avec la réduction des mouvements, seul le tracé fixe reste visible. La palette et les fichiers du logo demeurent inchangés.

La carte se charge automatiquement à l’approche de sa zone, environ 300 px avant son entrée dans l’écran, sans clic préalable. Si le navigateur ne dispose pas du mécanisme de détection, le chargement commence à l’ouverture de la page. Les fonds proviennent de l’IGN : ce chargement transmet l’adresse IP du visiteur à l’IGN, comme indiqué sous la carte et dans la page de confidentialité. Aucune géolocalisation du visiteur n’est demandée. Sans JavaScript ou en cas d’échec, les adresses et les liens d’itinéraire restent disponibles ; un bouton permet de réessayer après un échec.

Les nombres de pages, fichiers et tests indiqués plus haut décrivent la recette antérieure. Ils ne sont pas une preuve de validation de cet avenant ; les résultats de la nouvelle recette doivent être consignés séparément.
