'use client'

import { RotateCw } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'

/** Lado corto típico de móvil/tablet en retrato (px CSS). */
const MAX_SHORT_EDGE_PX = 900

function shouldForceLandscape(): boolean {
  if (typeof window === 'undefined') return false
  const portrait = window.matchMedia('(orientation: portrait)').matches
  const shortEdge = Math.min(window.innerWidth, window.innerHeight)
  const touchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches
  return portrait && shortEdge <= MAX_SHORT_EDGE_PX && touchLike
}

function tryLockLandscape() {
  const o = typeof window !== 'undefined' ? window.screen?.orientation : undefined
  const lock = o && 'lock' in o ? (o as { lock: (type: string) => Promise<void> }).lock : undefined
  if (typeof lock === 'function') {
    lock('landscape').catch(() => {})
  }
}

export function ForceLandscapeOnSmallScreens() {
  const [blocked, setBlocked] = useState(false)

  useLayoutEffect(() => {
    const sync = () => {
      const next = shouldForceLandscape()
      setBlocked(next)
      if (next) {
        tryLockLandscape()
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      } else {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }

    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    const mq = window.matchMedia('(orientation: portrait)')
    mq.addEventListener('change', sync)

    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      mq.removeEventListener('change', sync)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  if (!blocked) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-[var(--app-modal-backdrop)] px-6 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="force-landscape-title"
      aria-describedby="force-landscape-desc"
    >
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-8 py-10 shadow-[var(--floating-shadow)] max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--app-active)] text-[var(--accent)]">
          <RotateCw className="h-9 w-9" aria-hidden />
        </div>
        <h2 id="force-landscape-title" className="text-lg font-semibold text-[var(--app-foreground)]">
          Gira el dispositivo
        </h2>
        <p id="force-landscape-desc" className="mt-2 text-sm leading-relaxed text-[var(--app-muted-foreground)]">
          Luma Grid está pensado para usarse en horizontal. Gira el móvil o la tablet para continuar.
        </p>
      </div>
    </div>
  )
}
