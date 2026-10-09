# Sécurité — Sant’Innovation

Ce dépôt contient le site institutionnel Astro et le CMS éditorial privé Payload. Aucune donnée patient, aucun dossier de soin, aucun formulaire médical ni secret ne doit être enregistré dans les contenus, tests, journaux ou livrables.

## Accès

- Authentification Payload réelle, mots de passe hachés, sessions limitées à 2 h, cookie HttpOnly/SameSite Strict et Secure en production ; blocage après 5 tentatives pendant 15 min.
- Seuls comptes `admin` et `editor` accèdent à l’administration. Création/modification des comptes et rôles réservée aux administrateurs. Pas d’inscription publique ni compte professionnel autonome.
- Toutes les API éditoriales, versions, fichiers et aperçus sont privés. GraphQL désactivé. L’aperçu vérifie la session et applique `overrideAccess:false`.
- Aucun secret en Git. `init` génère des secrets locaux dans un dossier privé ignoré ; il préserve un compte existant. Les identifiants ne sont jamais affichés dans les sorties de commande.
- Envoi d’e-mails désactivé localement : pas de récupération par e-mail prétendue fonctionnelle. Un administrateur réinitialise les accès. Configurer et tester un fournisseur de mail seulement après autorisation si souhaité.
- MFA non implémentée dans cette V1. Prévoir protection réseau/VPN ou couche d’identité renforcée du proxy avant exposition de l’administration. La future auth PSC/TOTP de GED n’est pas fournie par ce CMS.

## Publication

L’export exécuté localement est le seul composant autorisé à lire la base pour construire le site. Il filtre le publié, les dates, l’archivage et la visibilité, sans exposer d’endpoint. Le script de projection applique une liste explicite de champs et nettoie le HTML. Les relations invalides bloquent la génération. Les images privées ne sont copiées que si référencées dans la projection ; seules PNG/JPEG/WebP sont admises, 5 Mo max. Un nouveau fichier est requis pour changer une image, pour préserver les versions précédentes.

Les anciens répertoires de build ne sont pas publics. La racine web cible uniquement la release courante, avec revalidation du HTML et des images, sans CDN en V1. Une copie déjà téléchargée par un visiteur ne peut pas être révoquée.

## Défense du public

CSP et en-têtes Apache dans `public/.htaccess`, miroir `public/_headers` et serveur de recette locale. Le proxy VPS devra appliquer la même politique. Scripts externes au HTML ; styles inline limités aux besoins du design/Leaflet. JSON-LD échappé. Fonts locales. Tuiles CARTO uniquement après clic ; pas de collecte de géolocalisation par ce site.

Démo historique GED conservée dans `src/pro/demo`, jamais routée dans le build. Aucun login simulé n’est utilisé pour protéger les contenus.

## Vérification et exploitation

`npm run test:unit`, `npm --prefix cms test -- --http`, tests Playwright/axe et audits npm. Leur couverture et limites sont consignées dans la livraison : ils ne constituent pas un audit d’intrusion, une certification RGAA ou une validation juridique.

Sauvegarder ensemble la base, les images et le secret hors serveur ; tester la restauration avant production. Un historique de contenu n’est ni une sauvegarde complète ni un journal immuable. Surveiller CMS, worker, dernière publication, disque et erreurs. Réviser les accès nominatifs et tester la révocation des sessions selon la version Payload déployée.

Contact sécurité : **à désigner et vérifier par la MSP**. Ne pas publier de vulnérabilité exploitable ni de secret dans une issue publique.
