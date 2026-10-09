import fs from 'node:fs/promises'
import path from 'node:path'
import { dataDir } from '../lib/runtime'
export default async function PublicationStatus() {
  let status: { state?: string; updatedAt?: string; builtAt?: string; checkedAt?: string } | null = null
  try { status = JSON.parse(await fs.readFile(path.join(dataDir, 'publication-status.json'), 'utf8')) } catch { /* Missing status is an explicit idle state. */ }
  const updated = status?.checkedAt || status?.updatedAt || status?.builtAt
  const label = status?.state === 'ready' ? 'Dernière génération du site prête.' : status?.state === 'error' ? 'La dernière génération a échoué. Le site précédent est conservé. Contacter le responsable technique.' : status?.state === 'building' ? 'Génération du site en cours…' : 'Aucune génération du site confirmée. Le service de publication doit être actif.'
  return <aside style={{ padding: '20px', marginBottom: '24px', border: '1px solid currentColor', borderRadius: '8px' }}>
    <h2>Publication du site</h2><p role="status">{label}</p>
    {updated && !Number.isNaN(Date.parse(updated)) && <p>Dernier contrôle : {new Date(updated).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>}
    <p>Enregistrer un brouillon conserve vos modifications dans l’administration. Publier prépare leur affichage au prochain cycle de génération. Les fiches masquées, archivées ou hors dates d’affichage restent privées.</p>
    <p>Aucune donnée patient. Uniquement les informations professionnelles destinées au site public.</p>
  </aside>
}
