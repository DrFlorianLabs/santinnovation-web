/** One build instant, Paris dates displayed by Intl; stored dates are UTC. */
const buildTime = new Date(process.env.CONTENT_BUILD_TIME ?? Date.now());
export function isPublishedArticle(article: { data: { draft?: boolean; visible?: boolean; archive?: boolean; debutAffichage?: Date; finAffichage?: Date } }): boolean {
  const d = article.data;
  return !d.draft && d.visible !== false && !d.archive
    && (!d.debutAffichage || d.debutAffichage <= buildTime)
    && (!d.finAffichage || d.finAffichage > buildTime);
}
