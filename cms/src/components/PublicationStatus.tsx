import fs from 'node:fs/promises'
import path from 'node:path'
import { dataDir } from '../lib/runtime'
import { publicationView } from '../../../scripts/lib/publication-status.mjs'
import PublicationFreshness from './PublicationFreshness'
export default async function PublicationStatus() {
  let status: { state?: string; updatedAt?: string; builtAt?: string; checkedAt?: string } | null = null
  try { status = JSON.parse(await fs.readFile(path.join(dataDir, 'publication-status.json'), 'utf8')) } catch { /* Missing status is an explicit idle state. */ }
  const view = publicationView(status)
  return <aside style={{ padding: '20px', marginBottom: '24px', border: '1px solid currentColor', borderRadius: '8px' }}>
    <h2>Publication du site</h2><PublicationFreshness updated={view.updated} stale={view.stale} label={view.label} hasCause={Boolean(view.cause)} />
    {view.updated && <p>Dernier contrôle : {new Date(view.updated).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>}
    {view.cause && <p>{view.cause}{view.reference && <> Fiche à vérifier : <strong>{view.reference}</strong>.</>}</p>}
    <p>Enregistrer un brouillon conserve vos modifications dans l’administration. Publier prépare leur affichage au prochain cycle de génération. Les fiches masquées, archivées ou hors dates d’affichage restent privées.</p>
    <p>Aucune donnée patient. Uniquement les informations professionnelles destinées au site public.</p>
  </aside>
}
