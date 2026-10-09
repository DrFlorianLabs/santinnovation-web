> Historique de juillet 2026 conservé. Pour la réalisation et la recette du 9 octobre 2026, consulter `../LIVRAISON_SITE_MSP.md` et ADR 0003. Les cases ci-dessous ne sont pas un état actuel.

# Plan d'action — Sant'Innovation Web

> Suivi issu de l'audit technique du 3 juillet 2026. Cocher au fur et à mesure.
> Légende sévérité : 🔴 Bloquant · 🟠 Critique · 🟡 Majeur · ⚪ Mineur
> Owner : **F** = Florian / structure · **DEV** = équipe technique · **JUR** = juridique/DPO

---

## Phase 0 — Décisions & validations (préalable à toute publication)

> Rien ne se publie tant que cette phase n'est pas fermée. Ces points bloquent le reste.

### Décisions structurantes

- [ ] 🔴 Fixer la **personne morale éditrice** (SISA / association / SCM / autre) — *F/JUR* — AUD-001
- [ ] 🔴 Nommer le **directeur de publication** — *F* — AUD-001
- [ ] 🔴 Désigner le **responsable RGPD / DPO** — *F/JUR* — AUD-001
- [ ] 🔴 Confirmer l'**hébergeur contracté** (et statut du domaine santinnovation.fr) — *F* — AUD-001, AUD-021
- [ ] 🟡 Trancher l'**assujettissement RGAA** (article 47 : statut, mission, financement, CA) — *JUR* — AUD-014
- [x] 🟡 Acter l'**architecture V1.5** : Astro SSR unique vs app pro séparée vs migration Next.js → écrire un **ADR** — *DEV/F* — AUD-004
  — ✅ 04/07/2026 : `docs/adr/0001-separation-front-back-ovh.md` (app pro séparée, front Astro SSG sur OVH) + `docs/adr/0002` (auth GED)

### Validations de données (à recueillir auprès des concernés)

- [ ] 🟠 Valider **nom, profession, lieu(x)** des 7 professionnels + accord de publication — *F* — AUD-003
- [ ] 🟠 Résoudre le cas **Patrick Vuattoux** (Flûtes Agasses vs Henri/Maurice Baigue) — *F* — AUD-016
- [ ] 🟡 Décider si la fiche **Dr Sibille** affiche le lieu Polygone ou seulement Sant'Innovation — *F* — §3.7
- [ ] 🟠 Vérifier le statut **PMR réel** des 3 sites (preuve + date de revue) — *F* — AUD-003
- [ ] 🟡 Collecter **numéros de téléphone officiels, horaires, consignes soins non programmés** — *F* — AUD-015
- [ ] 🟡 Confirmer les **emails** (contact@, secretariat@, coordination@) existants et surveillés — *F* — AUD-003
- [ ] 🟡 Obtenir l'**accord des partenaires** (Digital Medical Hub, CPTS, FEMASCO, AVECsanté, ARS, GIRCI Est) pour affichage — *F* — AUD-003
- [ ] 🟡 Valider les **droits à l'image / photos** des lieux et de l'équipe — *F* — AUD-003

---

## Phase 1 — Sécuriser & assainir (dev, sans attendre les validations)

### Désamorcer la fausse sécurité

- [x] 🟠 Sortir `/pro` de la navigation publique et du sitemap — *DEV* — AUD-002, AUD-022 — ✅ 04/07/2026 (header, menu mobile, footer, filtre sitemap)
- [x] 🟠 Corriger l'état contradictoire « Consulter » vs « Accès refusé » (bug `.hidden` sur bouton `inline-flex`) — *DEV* — AUD-002 — ✅ 04/07/2026
- [x] 🟡 Requalifier explicitement `/pro` en « teaser » (pas prototype portable) dans le contenu — *DEV/F* — AUD-006 — ✅ 04/07/2026 (badge « Démonstration » sur l'accueil, README, roadmap /pro reformulée)

### Sécurité plateforme & dépendances

- [x] 🟡 Monter **Astro** vers une version corrigée (XSS haute) + recette de non-régression — *DEV* — AUD-009 — ✅ 04/07/2026 : Astro 7.0.6, `npm audit` = 0 vulnérabilité, recette check/build/overflow OK
- [x] 🟡 Versionner les **en-têtes de sécurité** — *DEV* — AUD-010 — ✅ 04/07/2026 : `public/.htaccess` (OVH/Apache, autoritaire) + `public/_headers` (miroir Cloudflare) : CSP, HSTS, frame-ancestors, Permissions-Policy
- [x] 🟡 Contraindre les **URLs** au protocole HTTPS + allowlist de domaines dans les schémas Zod — *DEV* — AUD-011 — ✅ 04/07/2026
- [x] 🟡 **Échapper** le contenu injecté dans les marqueurs Leaflet — *DEV* — AUD-011 — ✅ 04/07/2026 (construction DOM/textContent)

### Quick wins (< 1 j chacun)

- [x] 🟡 Corriger le **débordement horizontal mobile** du header (390 px) — *DEV* — AUD-013 — ✅ 04/07/2026 : cause = grilles implicites + conflit hidden/inline-flex ; vérifié `scrollWidth === clientWidth` sur 10 pages × {320, 390} px
- [ ] 🟡 Corriger les **contrastes** `ink-500` et l'ordre des titres (H1→H3) — *DEV* — AUD-014
- [x] 🟡 Ajouter un **nom accessible** au sélecteur de rôle mobile — *DEV* — AUD-014 — ✅ 04/07/2026 (`aria-label`)
- [x] ⚪ Exclure `/pro` et les **profils non confirmés** du sitemap — *DEV* — AUD-022 — ✅ 04/07/2026 : `/pro*` hors sitemap ; fiches « à confirmer » passées en `noindex` (retrait du sitemap à faire si elles restent longtemps)
- [x] ⚪ Fixer **Node LTS** (`engines` + `.nvmrc`) — *DEV* — AUD-019 — ✅ 04/07/2026
- [ ] ⚪ Importer uniquement les **sous-ensembles de fontes** latin nécessaires — *DEV* — AUD-023
- [ ] ⚪ Ajouter **image Open Graph** + styles d'impression minimaux — *DEV* — AUD-026
- [x] ⚪ Supprimer les **imports inutilisés** et MDX si non utilisé — *DEV* — AUD-027 — ✅ 04/07/2026 (imports nettoyés ; MDX conservé pour les actualités)
- [ ] ⚪ Passer l'actualité « mise en ligne » en **brouillon** tant que le domaine ne résout pas — *DEV* — AUD-021

---

## Phase 2 — Remplir & rendre conforme (après validations Phase 0)

### Contenus

- [ ] 🟡 Rédiger les **mentions légales** réelles (éditeur, directeur publication, hébergeur, identifiants) — *F/JUR* — AUD-001 — ◐ 04/07/2026 : structure LCEN complète en place (hébergeur OVH renseigné), champs « À COMPLÉTER » en attente de validation juridique
- [ ] 🔴 Rédiger la **politique de confidentialité** (art. 13 : finalités, bases, destinataires, durées, droits, DPO, transferts) — *JUR* — AUD-001, AUD-012 — ◐ 04/07/2026 : trame art. 13 complète (finalités, bases, sous-traitants OVH/CARTO/Doctolib), durées et DPO « À COMPLÉTER »
- [ ] 🟡 Rédiger la **déclaration d'accessibilité** RGAA (taux, résultats, contact, recours) — *DEV/JUR* — AUD-014 — ◐ 04/07/2026 : trame RGAA 4.1.2 en place (contact, recours), taux et résultats après audit
- [ ] 🟡 Intégrer les **6 pages vides** (soins/parcours, projet de santé, recherche/innovation, rejoindre, infos pratiques) depuis le PDF 02 — *DEV/F* — AUD-005
- [ ] 🟠 Injecter les **données validées** et masquer/dépublier tout ce qui reste « à confirmer » — *DEV* — AUD-003
- [ ] 🟡 Remplacer « Contact » par **« Appeler » (tel:)** dans la barre mobile après validation du numéro — *DEV* — AUD-015

### Conformité RGPD / carte

- [ ] 🟡 Charger la **carte CARTO au clic** (ou carte statique/auto-hébergée) + documenter le tiers — *DEV/JUR* — AUD-012, AUD-018 — ◐ 04/07/2026 : CARTO documenté comme sous-traitant dans `/confidentialite` ; chargement différé restant à faire
- [x] 🟡 Décider si un **bandeau cookies** est requis (vérifier traceurs CARTO) — *JUR* — AUD-012 — ✅ 04/07/2026 : aucun cookie déposé (site ni tuiles CARTO) → pas de bandeau ; décision documentée dans `/confidentialite`, à revoir si un tiers traceur est ajouté

### SEO local

- [ ] 🟡 Générer les **données structurées** multisite (`MedicalOrganization` + `MedicalClinic`/`PostalAddress`/`GeoCoordinates` par site, `Physician` sur fiches) — *DEV* — AUD-017
- [ ] 🟡 Consolider le **NAP** (nom/adresse/téléphone) et synchroniser avec Doctolib — *DEV/F* — AUD-016, AUD-017

---

## Phase 3 — Industrialiser (structurant, après site public sain)

### Gouvernance de contenu

- [ ] 🟡 Ajouter statuts `draft/verified`, **owner, date de revue** aux collections ; refuser le build si lien orphelin — *DEV* — AUD-020, AUD-025
- [ ] ⚪ Typer les **relations lieu↔professionnel** via `reference()` — *DEV* — AUD-020

### Qualité automatisée

- [ ] 🟡 Mettre en place **ESLint + Prettier** — *DEV* — AUD-019
- [ ] 🟡 Ajouter **Vitest + Playwright** (parcours patient + états d'autorisation + test `scrollWidth === clientWidth`) — *DEV* — AUD-013, AUD-019
- [ ] 🟡 Configurer la **CI GitHub Actions** (build + check + tests + `npm audit` + axe) — *DEV* — AUD-019
- [x] 🟡 Rédiger **SECURITY.md** et **ARCHITECTURE.md** — *DEV* — AUD-019 — ✅ 04/07/2026
- [ ] ⚪ Activer **Dependabot + secret scanning** sur le repo — *DEV* — AUD-009, AUD-030

### Plateforme pro V1.5 (projet distinct)

- [ ] 🟡 Écrire le **modèle de menace** — *DEV* — AUD-006, AUD-008
- [ ] 🟡 Concevoir **auth forte + RBAC serveur par ressource** — *DEV* — AUD-006
- [ ] 🟡 **Qualification HDS** des données avant tout upload lié au soin — *JUR/DEV* — AUD-008
- [ ] 🟡 Stockage privé, liens temporaires, audit immuable, antivirus, rétention, sauvegardes — *DEV* — AUD-008

---

## Suivi

| Phase | Total | Faits |
|---|---|---|
| Phase 0 — Décisions & validations | 14 | 1 |
| Phase 1 — Sécuriser & assainir | 16 | 11 |
| Phase 2 — Remplir & conformité | 10 | 1 (+4 partiels ◐) |
| Phase 3 — Industrialiser | 11 | 1 |

*Dernière mise à jour : 04/07/2026 (lots 1-6 — voir historique git).*

**Jalon publiable :** Phases 0, 1 et 2 terminées.
**Rappel :** l'espace pro (Phase 3) est un projet distinct — ne pas bloquer la publication du site public dessus.

*Références AUD-xxx : voir `docs/AUDIT_TECHNIQUE_2026-07-03.md` (non versionné).*
