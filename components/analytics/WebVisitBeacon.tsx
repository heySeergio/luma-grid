'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

import { shouldTrackWebVisitPath } from '@/lib/analytics/web-visit-paths'

const VISITOR_KEY = 'luma_web_vid'
const VISIT_KEY = 'luma_web_visit_id'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return `v_${Date.now()}`
  }
}

function WebVisitBeaconInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const startedAt = useRef<number>(0)
  const visitId = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || !shouldTrackWebVisitPath(pathname)) return

    startedAt.current = Date.now()
    visitId.current = null
    sessionStorage.removeItem(VISIT_KEY)

    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    void fetch('/api/internal/web-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        visitorId: getVisitorId(),
        utmSource,
        utmMedium,
        utmCampaign,
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data: { id?: string }) => {
        if (data.id) {
          visitId.current = data.id
          sessionStorage.setItem(VISIT_KEY, data.id)
        }
      })
      .catch(() => {})

    const sendEnd = () => {
      const id = visitId.current ?? sessionStorage.getItem(VISIT_KEY)
      if (!id || !startedAt.current) return
      const durationSec = Math.round((Date.now() - startedAt.current) / 1000)
      const payload = JSON.stringify({ action: 'end', id, durationSec })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/internal/web-visit',
          new Blob([payload], { type: 'application/json' }),
        )
      } else {
        void fetch('/api/internal/web-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        })
      }
    }

    window.addEventListener('pagehide', sendEnd)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendEnd()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      sendEnd()
      window.removeEventListener('pagehide', sendEnd)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname, searchParams])

  return null
}

export function WebVisitBeacon() {
  return (
    <Suspense fallback={null}>
      <WebVisitBeaconInner />
    </Suspense>
  )
}

/** Registrar una búsqueda en el sitio (llamar desde inputs de búsqueda futuros). */
export async function captureWebSearch(query: string, path?: string): Promise<void> {
  const q = query.trim()
  if (!q) return
  try {
    await fetch('/api/internal/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        path: path ?? (typeof window !== 'undefined' ? window.location.pathname : null),
        visitorId: getVisitorId(),
      }),
      keepalive: true,
    })
  } catch {
    /* ignore */
  }
}
