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
- [ ] 🟡 Acter l'**architecture V1.5** : Astro SSR unique vs app pro séparée vs migration Next.js → écrire un **ADR** — *DEV/F* — AUD-004

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

- [ ] 🟠 Sortir `/pro` de la navigation publique et du sitemap — *DEV* — AUD-002, AUD-022
- [ ] 🟠 Corriger l'état contradictoire « Consulter » vs « Accès refusé » (bug `.hidden` sur bouton `inline-flex`) — *DEV* — AUD-002
- [ ] 🟡 Requalifier explicitement `/pro` en « teaser » (pas prototype portable) dans le contenu — *DEV/F* — AUD-006

### Sécurité plateforme & dépendances

- [ ] 🟡 Monter **Astro** vers une version corrigée (XSS haute) + recette de non-régression — *DEV* — AUD-009
- [ ] 🟡 Versionner les **en-têtes de sécurité** (`public/_headers` : CSP, HSTS, frame-ancestors, Permissions-Policy) — *DEV* — AUD-010
- [ ] 🟡 Contraindre les **URLs** au protocole HTTPS + allowlist de domaines dans les schémas Zod — *DEV* — AUD-011
- [ ] 🟡 **Échapper** le contenu injecté dans les marqueurs Leaflet — *DEV* — AUD-011

### Quick wins (< 1 j chacun)

- [ ] 🟡 Corriger le **débordement horizontal mobile** du header (390 px) — *DEV* — AUD-013
- [ ] 🟡 Corriger les **contrastes** `ink-500` et l'ordre des titres (H1→H3) — *DEV* — AUD-014
- [ ] 🟡 Ajouter un **nom accessible** au sélecteur de rôle mobile — *DEV* — AUD-014
- [ ] ⚪ Exclure `/pro` et les **profils non confirmés** du sitemap — *DEV* — AUD-022
- [ ] ⚪ Fixer **Node LTS** (`engines` + `.nvmrc`) — *DEV* — AUD-019
- [ ] ⚪ Importer uniquement les **sous-ensembles de fontes** latin nécessaires — *DEV* — AUD-023
- [ ] ⚪ Ajouter **image Open Graph** + styles d'impression minimaux — *DEV* — AUD-026
- [ ] ⚪ Supprimer les **imports inutilisés** et MDX si non utilisé — *DEV* — AUD-027
- [ ] ⚪ Passer l'actualité « mise en ligne » en **brouillon** tant que le domaine ne résout pas — *DEV* — AUD-021

---

## Phase 2 — Remplir & rendre conforme (après validations Phase 0)

### Contenus

- [ ] 🟡 Rédiger les **mentions légales** réelles (éditeur, directeur publication, hébergeur, identifiants) — *F/JUR* — AUD-001
- [ ] 🔴 Rédiger la **politique de confidentialité** (art. 13 : finalités, bases, destinataires, durées, droits, DPO, transferts) — *JUR* — AUD-001, AUD-012
- [ ] 🟡 Rédiger la **déclaration d'accessibilité** RGAA (taux, résultats, contact, recours) — *DEV/JUR* — AUD-014
- [ ] 🟡 Intégrer les **6 pages vides** (soins/parcours, projet de santé, recherche/innovation, rejoindre, infos pratiques) depuis le PDF 02 — *DEV/F* — AUD-005
- [ ] 🟠 Injecter les **données validées** et masquer/dépublier tout ce qui reste « à confirmer » — *DEV* — AUD-003
- [ ] 🟡 Remplacer « Contact » par **« Appeler » (tel:)** dans la barre mobile après validation du numéro — *DEV* — AUD-015

### Conformité RGPD / carte

- [ ] 🟡 Charger la **carte CARTO au clic** (ou carte statique/auto-hébergée) + documenter le tiers — *DEV/JUR* — AUD-012, AUD-018
- [ ] 🟡 Décider si un **bandeau cookies** est requis (vérifier traceurs CARTO) — *JUR* — AUD-012

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
- [ ] 🟡 Rédiger **SECURITY.md** et **ARCHITECTURE.md** — *DEV* — AUD-019
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
| Phase 0 — Décisions & validations | 14 | 0 |
| Phase 1 — Sécuriser & assainir | 16 | 0 |
| Phase 2 — Remplir & conformité | 10 | 0 |
| Phase 3 — Industrialiser | 11 | 0 |

**Jalon publiable :** Phases 0, 1 et 2 terminées.
**Rappel :** l'espace pro (Phase 3) est un projet distinct — ne pas bloquer la publication du site public dessus.

*Références AUD-xxx : voir `docs/AUDIT_TECHNIQUE_2026-07-03.md` (non versionné).*
