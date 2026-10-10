# ADR 0004 — Prototype GitHub Pages et abonnement OVH Web Pro

- Date : 9 octobre 2026.
- Statut : décisions utilisateur confirmées ; compatibilité de l’administration distante à résoudre.
- Complète les ADR 0001 et 0003, sans modifier l’exclusion de toute GED réelle.

## Décisions utilisateur

L’utilisateur autorise les corrections, le push direct sur `main`, puis le maintien du déploiement GitHub.io pour montrer les prototypes à l’équipe. Il confirme avoir souscrit **Hébergement Web Pro** et fournit [la page Business OVHcloud](https://www.ovhcloud.com/fr/web-hosting/business/). Ces décisions remplacent l’interdiction précédente de push et de déploiement du prototype ; elles n’autorisent pas une mise en production OVH, un achat supplémentaire ou la publication de contenus réels non validés.

## Mise en œuvre

1. Décision initiale du 9 octobre : jeu fictif. **Mise à jour explicitement autorisée le 10 octobre :** GitHub Pages expose les textes projet de santé/TEAM-IC/DMH et les neuf professionnels validés, avec trois adresses harmonisées. La source est le snapshot contrôlé `content/approved/`, sans CMS distant ni brouillon ; les liens de rendez-vous vérifiés et les itinéraires sont actifs. Bandeau et `noindex` conservés. Le jeu fictif reste réservé aux tests.
2. Le site public Astro reste exportable en fichiers statiques pour l’hébergement Web Pro. Aucun fichier n’a été transféré chez OVH dans ce lot.
3. Payload, Next, le worker et les outils Node sont corrigés et testés localement. Les modèles Nginx/systemd concernent un environnement Node/Linux distinct ; ils ne peuvent pas être installés tels quels sur le mutualisé Pro.
4. La page commerciale Pro mentionne SSH, Git, bases de données et modules WordPress/Joomla, sans engagement explicite sur un processus Node permanent. La documentation [Cloud Web OVH](https://docs.ovhcloud.com/fr/guides/web-cloud/web-hosting/getting-started-cloud-web) décrit une autre offre avec moteurs d’exécution. Il ne faut pas déduire cette capacité de la seule présence de SSH sur Pro.

## Limite à résoudre avant production

L’administration distante de l’ADR 0003 n’est pas démontrée compatible avec l’abonnement souscrit. Une validation technique de l’environnement ou une adaptation du CMS à cet hébergement est nécessaire. Aucune migration vers un autre CMS et aucun hébergement supplémentaire ne sont implicitement approuvés ici. Le prototype GitHub n’est ni un site de soins en service, ni la preuve que l’administration fonctionne chez OVH.

## Retour arrière du prototype

Choisir une révision préalablement vérifiée **contenant le mode prototype synthétique**, rejouer son workflow et vérifier le `prototype.json` distant. Ne pas redéployer aveuglément la version historique antérieure qui présente des informations non validées. Le retrait de GitHub Pages ou une modification de visibilité restent des actions distinctes à autoriser.
