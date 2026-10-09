import type { BeforeDocumentControlsServerProps } from 'payload'

type Props = BeforeDocumentControlsServerProps & { collectionSlug: string }
export default function PrivatePreview({ id, user, collectionSlug }: Props) {
  if (!user || !['admin', 'editor'].includes(String(user.role))) return null
  if (!id) return <p>Enregistrer un premier brouillon pour ouvrir son aperçu privé.</p>
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingBlock: 8 }}>
    <a href={`/apercu/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(id))}`} target="_blank" rel="noopener noreferrer" data-testid="private-preview-link" style={{ display: 'inline-block', padding: '10px 14px', border: '1px solid currentColor', borderRadius: 4, fontWeight: 600 }}>
      Aperçu privé
    </a>
    <span style={{ fontSize: 13 }}>Dernier enregistrement. Enregistrer le brouillon avant de prévisualiser.</span>
  </div>
}
