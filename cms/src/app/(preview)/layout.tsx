import type { ReactNode } from 'react'
export const metadata = { robots: { index: false, follow: false }, title: 'Aperçu privé — Sant’Innovation' }
export default function Layout({ children }: { children: ReactNode }) { return <html lang="fr"><body style={{ margin: 0, background: '#f5f7fa', color: '#132640', fontFamily: 'system-ui, sans-serif' }}>{children}</body></html> }
