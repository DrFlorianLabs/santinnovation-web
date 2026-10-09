'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { updated: string | null; stale: boolean; label: string; hasCause: boolean }

/** Refreshes this already authenticated dashboard route, without adding an API
 * or exposing a status path. The local clock still warns if refresh fails. */
export default function PublicationFreshness({ updated, stale, label, hasCause }: Props) {
  const router = useRouter()
  const [expired, setExpired] = useState(stale)
  useEffect(() => {
    const check = () => {
      const checked = updated ? Date.parse(updated) : NaN
      setExpired(!Number.isFinite(checked) || Date.now() - checked > 300_000 || checked > Date.now() + 60_000)
    }
    check()
    const clock = window.setInterval(check, 15_000)
    const refresh = window.setInterval(() => { if (document.visibilityState === 'visible') router.refresh() }, 30_000)
    const visible = () => { check(); if (document.visibilityState === 'visible') router.refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => { window.clearInterval(clock); window.clearInterval(refresh); document.removeEventListener('visibilitychange', visible) }
  }, [updated, router])
  return <p role={expired || hasCause ? 'alert' : 'status'}>{expired ? 'Service de publication inactif ou dernier contrôle trop ancien.' : label}</p>
}
