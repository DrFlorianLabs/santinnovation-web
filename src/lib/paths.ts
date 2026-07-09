/**
 * Préfixe un chemin interne avec le base path du déploiement.
 *
 * En local et sur un domaine racine (ex. santinnovation.fr), BASE_URL vaut "/"
 * et la fonction ne change rien. Sur GitHub Pages, le site est servi depuis un
 * sous-dossier (ex. "/santinnovation-web/") : tous les liens internes doivent
 * donc être préfixés. Les URL externes, mailto:, tel: et ancres (#) passent
 * telles quelles.
 */
const base = import.meta.env.BASE_URL;

export function withBase(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
  if (path === "/") return base;
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}
