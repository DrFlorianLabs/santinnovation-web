# Sant'Innovation — Vision du site public

Document de cadrage (V0). À discuter et amender avant toute génération de code.
Stack cible : **Astro + MDX**, hébergement **Cloudflare Pages**, dépôt **GitHub**, domaine **santinnovation.fr**.
Nom officiel : **Maisons de Santé Pluriprofessionnelles Sant'Innovation**.

---

## 1. Arborescence du site

Une structure resserrée, lisible, sans pages creuses. Chaque page a une intention claire.

```
/                         Accueil
/prendre-rendez-vous      Comment et où prendre RDV (redirection Doctolib)
/equipe                   L'équipe pluriprofessionnelle (présentation + trombinoscope)
/equipe/[slug]            Fiche individuelle d'un professionnel
/lieux                    Les lieux de consultation (sites multisite)
/lieux/[slug]             Fiche d'un site (adresse, accès, professionnels présents)
/projet-de-sante         Projet de santé, coordination, pluriprofessionnalité
/actualites               Liste des actualités
/actualites/[slug]        Article d'actualité
/informations-pratiques   Horaires, accès, soins non programmés, urgences
/contact                  Contact (sans formulaire médical)
/mentions-legales         Mentions légales
/confidentialite          Politique de confidentialité (RGPD)
/accessibilite            Déclaration d'accessibilité
```

Choix de regroupement :
- **« Coordination et pluriprofessionnalité »** est fusionné dans **/projet-de-sante** (c'est le même propos ; deux pages diraient deux fois la même chose).
- **« Les professionnels »** et **« L'équipe »** sont fusionnés dans **/equipe** : une page chapeau + des fiches `/equipe/[slug]`. Évite la redondance.
- **/prendre-rendez-vous** est volontairement une page à part entière et non un simple bouton : c'est le cœur fonctionnel du site (orienter vers le bon interlocuteur).

Navigation principale (header) : Accueil · Prendre rendez-vous · L'équipe · Les lieux · Projet de santé · Actualités · Contact.
Bouton CTA permanent dans le header : **« Prendre rendez-vous »** (ancré vers Doctolib).
Footer : informations pratiques, mentions légales, confidentialité, accessibilité, contact, réseaux/partenaires.

---

## 2. Direction éditoriale et visuelle

### Positionnement
Sobre, médical, clair — mais chaleureux et humain. On doit sentir une **organisation collective sérieuse**, pas une vitrine marketing ni un site administratif figé. Le fil rouge :

> « Plusieurs lieux, plusieurs métiers, plusieurs parcours — une même coordination. »

### Ton rédactionnel
Français naturel, professionnel, direct, rassurant. Phrases courtes. Pas de jargon, pas de promesse médicale, pas de « bullshit innovation ». L'innovation est présentée comme **utile et au service du soin** (coordination, lisibilité, accès), jamais comme un argument technologique.

### Direction visuelle
- **Palette** : base claire et apaisante. Un bleu-vert profond (confiance médicale, sans le bleu hôpital cliché) en couleur principale, un accent chaud discret (terracotta / ambre doux) pour l'humain et les CTA, neutres chauds (off-white, gris ardoise) pour le fond et le texte. À valider sur maquette.
- **Typographie** : un sans-serif humaniste et lisible (ex. *Inter*, *Public Sans* ou *Atkinson Hyperlegible* pour l'accessibilité) ; éventuellement un serif léger pour les titres afin d'apporter de la chaleur. Polices gratuites, auto-hébergées (perf + RGPD, pas de Google Fonts en CDN).
- **Mise en page** : grille aérée, beaucoup de blanc, sections bien séparées, rythme vertical régulier. Largeur de lecture confortable.
- **Imagerie** : photos réelles de l'équipe et des lieux à terme (priorité absolue pour la crédibilité). En attendant, illustrations sobres / motifs géométriques discrets évoquant le maillage multisite. **Éviter** les banques d'images médicales génériques (stéthoscope sur fond blanc, mains qui se serrent).
- **Micro-animations** : sobres, utiles, jamais décoratives à l'excès. Apparitions douces au scroll, transitions de survol. Respect de `prefers-reduced-motion`.
- **Iconographie** : Lucide (cohérent, léger, libre).

### Ce qu'on évite explicitement
Jargon excessif · promesses médicales · esthétique startup américaine · corporate impersonnel · site de collectivité · site médical daté.

---

## 3. Composants principaux à créer

Composants Astro réutilisables, pensés « design system » :

**Structure / layout**
- `BaseLayout` — head, SEO, skip-link, header, footer
- `Header` (nav responsive + CTA Doctolib) / `Footer`
- `Section` (conteneur rythmé) / `Container`

**Contenu éditorial**
- `Hero` — accroche, sous-titre, double CTA (RDV + découvrir l'équipe)
- `ValueProps` — 3-4 piliers (multisite, pluripro, coordination, accès)
- `CTASection` — bandeau d'appel à action (Doctolib)
- `RichText` — rendu MDX stylé

**Métier**
- `ProfessionalCard` — photo, nom, profession, lieu(x), bouton RDV individuel si dispo
- `ProfessionalGrid` (trombinoscope filtrable par métier / lieu)
- `LocationCard` — site, adresse, secteur, accès
- `LocationMap` — carte statique (OpenStreetMap / image) sans tracker
- `AppointmentGuide` — bloc « comment choisir le bon interlocuteur »
- `DoctolibButton` — bouton standardisé (établissement ou individuel)
- `NewsCard` / `NewsList` — actualités

**Transverses**
- `Badge` (métier, secteur)
- `Breadcrumb`, `Prose`, `Accordion` (FAQ pratique)
- `MotionReveal` — wrapper d'animation au scroll respectant reduced-motion

---

## 4. Structure technique du projet Astro

```
santinnovation-web/
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── tailwind.config.ts
├── public/
│   ├── fonts/                 # polices auto-hébergées
│   ├── images/                # photos équipe & lieux
│   └── favicon / og-image
├── src/
│   ├── components/            # composants .astro (cf. §3)
│   ├── layouts/               # BaseLayout, PageLayout, ArticleLayout
│   ├── pages/                 # routage fichier = arborescence §1
│   │   ├── index.astro
│   │   ├── prendre-rendez-vous.astro
│   │   ├── equipe/index.astro
│   │   ├── equipe/[slug].astro
│   │   ├── lieux/index.astro
│   │   ├── lieux/[slug].astro
│   │   ├── projet-de-sante.astro
│   │   ├── actualites/index.astro
│   │   ├── actualites/[slug].astro
│   │   ├── informations-pratiques.astro
│   │   ├── contact.astro
│   │   └── (legal pages)
│   ├── content/               # collections typées (cf. §5)
│   │   ├── config.ts          # schémas Zod
│   │   ├── professionnels/
│   │   ├── lieux/
│   │   └── actualites/
│   ├── data/                  # données globales (nav, partenaires, contact)
│   ├── lib/                   # helpers (seo, doctolib, format)
│   └── styles/                # tokens, global.css
└── docs/
    ├── VISION.md              # ce document
    ├── README.md
    └── ACCESSIBILITE.md
```

**Choix techniques**
- **Astro** en mode statique (SSG) → sortie 100 % statique, idéale Cloudflare Pages (gratuit), ultra-rapide, excellent SEO.
- **Tailwind CSS** avec **design tokens** déclarés dans `tailwind.config.ts` (couleurs, espacements, typo) — une seule source de vérité.
- **TypeScript** strict ; schémas de contenu validés par **Zod** via les Content Collections.
- **MDX** pour les pages riches et les actualités.
- **Pas de JS lourd** : Astro n'envoie quasi aucun JS par défaut ; animations en CSS ou micro-îlots seulement si nécessaire.
- **Aucun tracker tiers**. Analytics éventuel : Cloudflare Web Analytics (sans cookie, RGPD-friendly).
- **CMS différé** : prévoir l'intégration **Decap CMS** ou **Sveltia CMS** (V1.5) pour éditer le contenu sans toucher au code — d'où le contenu structuré dès le départ en collections.
- **Accessibilité** : HTML sémantique, contrastes AA, focus visibles, navigation clavier, `prefers-reduced-motion`.

---

## 5. Collections de contenu

Contenu structuré et typé dès la V0 (prépare le CMS et garantit la cohérence).

**`professionnels`** (une entrée = un soignant)
```
slug, nom, prenom, profession (médecin généraliste | infirmier·e |
kinésithérapeute | pharmacien | …), titreAffiche, lieux[] (réf. lieux),
specialitesOuFocus[], presentation (MDX), doctolibUrl?, ordreAffichage,
photo, accepteNouveauxPatients (bool), visible (bool)
```

**`lieux`** (une entrée = un site)
```
slug, nom, adresse, codePostal, ville, secteur (Palente | Les Cras |
Les Orchamps | …), coordonnees (lat/lng), accesTransport, accesPMR (bool),
horaires?, professionnelsPresents[] (réf.), photo, ordreAffichage
```

**`actualites`** (une entrée = un article)
```
slug, titre, date, resume, categorie, image?, corps (MDX), epingle (bool)
```

**Données globales (`src/data/`)**, non éditoriales :
- `site.ts` — nom, baseline, contacts (mails pro), réseaux
- `navigation.ts` — menu header/footer
- `partenaires.ts` — logos & liens (CPTS, FEMASCO, AVECsanté, ARS… selon ce qui est confirmé)
- `doctolib.ts` — URL établissement + mapping individuels

---

## 6. Première version des textes — page d'accueil

> À retravailler ensemble. Brouillon de travail, pas figé.

**Hero**
- Titre : **Une équipe pluriprofessionnelle organisée autour de vos parcours de soins.**
- Sous-titre : *Plusieurs lieux de consultation à Besançon, une même dynamique de coordination. Médecins, infirmiers, kinésithérapeutes et pharmacien engagés dans une prise en charge accessible, lisible et coordonnée.*
- CTA principal : **Prendre rendez-vous** · CTA secondaire : **Découvrir l'équipe**

**Les piliers (ValueProps)**
- **Multisite** — Plusieurs sites de soins répartis sur Besançon et ses quartiers, pour vous recevoir au plus près.
- **Pluriprofessionnel** — Différents métiers du soin qui travaillent ensemble, autour d'un même projet de santé.
- **Coordonné** — Vos professionnels échangent et organisent votre parcours, pour une prise en charge cohérente.
- **Accessible** — La prise de rendez-vous est simple, en ligne, via Doctolib.

**Bloc « Prendre rendez-vous »**
> La prise de rendez-vous se fait en ligne sur Doctolib. Vous pouvez prendre rendez-vous avec l'établissement Sant'Innovation, ou directement avec le professionnel de votre choix.
> CTA : **Prendre rendez-vous sur Doctolib**
> Lien discret : *Vous ne savez pas vers qui vous tourner ? On vous explique.* → /prendre-rendez-vous

**Bloc équipe (aperçu trombinoscope)**
> Une équipe de proximité. Médecins généralistes, infirmiers, kinésithérapeutes, pharmacien — et une volonté d'élargir progressivement les compétences réunies autour de vous.
> CTA : **Voir toute l'équipe**

**Bloc lieux**
> Plusieurs lieux de consultation, une même coordination.
> *Nos sites accueillent les patients du territoire bisontin — Palente, Les Cras, Les Orchamps et au-delà — selon les disponibilités de chaque professionnel.*
> CTA : **Voir les lieux de consultation**

**Bloc projet de santé**
> Une organisation collective au service du soin. Notre projet de santé structure la coordination entre professionnels, la continuité des parcours et l'accès aux soins.
> CTA : **Découvrir notre projet de santé**

**Bandeau de réassurance / territorial**
> Ancrés à Besançon, ouverts au territoire. Les patients d'autres quartiers peuvent également prendre rendez-vous selon les disponibilités.

---

## 7. Informations à confirmer

Bloquants ou importants avant de figer le contenu :

**Identité / juridique**
- Statut juridique exact de la structure (SISA ? association ?) pour les mentions légales.
- Logo Sant'Innovation existant ou à créer ?
- Charte graphique / couleurs imposées ?

**Lieux** (orthographe et adresses à fiabiliser)
- 57 rue des Flûtes Agasses — secteur ? horaires ?
- 14 rue **Henri Baigue / Baegue / Begg** — *orthographe exacte à confirmer*.
- Site **Les Orchamps**, vers Chemin de Vieillier / Chemin des Fermes — *adresse exacte à confirmer*.
- Accès PMR et transports pour chaque site.

**Équipe**
- Liste nominative des professionnels à afficher (avec accord de chacun pour photo + nom).
- URLs Doctolib individuelles disponibles ?
- URL de la page **établissement** Sant'Innovation sur Doctolib.

**Rendez-vous / pratique**
- Horaires d'ouverture des sites / du secrétariat.
- Modalités de **soins non programmés** (comment communiquer dessus sans surpromettre).
- Numéros à afficher (secrétariat) et conduite à tenir en cas d'urgence (renvoi 15 / 112).

**Partenaires**
- Lesquels afficher sur ce site vitrine public ? (Le brief projet citait CPTS, FEMASCO, AVECsanté, ARS, GIRCI Est, Digital Medical Hub — à confirmer pour le public, avec logos autorisés.)

**Technique / RGPD**
- Mails pro à activer (dr.sibille@, contact@, secretariat@, coordination@).
- Hébergeur à mentionner dans les mentions légales (Cloudflare).
- Analytics souhaité ou non.

---

## 8. Plan de développement étape par étape

**Étape 0 — Validation de cette vision** (ici)
Valider arborescence, ton, palette, périmètre. Récolter les infos du §7.

**Étape 1 — Squelette & design system**
Init Astro + TS strict + Tailwind + tokens. BaseLayout, Header, Footer, polices auto-hébergées, page d'accueil « coquille ». Déploiement Cloudflare Pages dès cette étape (prévisualisation continue).

**Étape 2 — Collections de contenu**
`content/config.ts` (schémas Zod), données globales (`site`, `navigation`, `partenaires`, `doctolib`). Une fiche pro et un lieu de test.

**Étape 3 — Pages publiques principales**
Accueil complète, /prendre-rendez-vous, /equipe + fiches, /lieux + fiches, /projet-de-sante.

**Étape 4 — Pages secondaires**
/actualites + articles, /informations-pratiques, /contact, pages légales (mentions, confidentialité, accessibilité).

**Étape 5 — Finitions**
Responsive mobile soigné, micro-animations sobres, SEO local (métadonnées, Open Graph, JSON-LD `MedicalClinic` multisite, sitemap, robots), contrôle accessibilité (contrastes, clavier, lecteurs d'écran), performances (Lighthouse).

**Étape 6 — Contenu réel & livraison**
Intégration des vrais textes, photos, Doctolib. README + doc de maintenance. Branchement domaine santinnovation.fr.

**Étape 7 (V1.5) — CMS**
Intégration Decap / Sveltia CMS pour que l'équipe édite le contenu sans code.

---

### Prochaine étape proposée
Tu valides (ou corriges) l'arborescence, le ton et la palette, et tu me donnes ce que tu as déjà des infos du §7. Dès qu'on est d'accord, je génère le squelette Astro (Étape 1).
