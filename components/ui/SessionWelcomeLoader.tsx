'use client'

import { useLayoutEffect, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

const WELCOME_DURATION_MS = 7_000

type Props = {
  /** Clave única por ruta en sessionStorage (primera visita a esa ruta en la sesión del navegador). */
  sessionKey: string
  children: ReactNode
}

/**
 * Pantalla de bienvenida fija la primera vez que se entra en una ruta en la sesión actual.
 */
export default function SessionWelcomeLoader({ sessionKey, children }: Props) {
  const [showOverlay, setShowOverlay] = useState(true)

  useLayoutEffect(() => {
    let cancelled = false
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey) === '1') {
        setShowOverlay(false)
        return
      }
    } catch {
      setShowOverlay(false)
      return
    }

    const id = window.setTimeout(() => {
      if (cancelled) return
      try {
        sessionStorage.setItem(sessionKey, '1')
      } catch {
        /* ignore */
      }
      setShowOverlay(false)
    }, WELCOME_DURATION_MS)

    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [sessionKey])

  return (
    <>
      {children}
      {showOverlay ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-[var(--app-bg)] px-6 text-center dark:bg-slate-950"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-12 w-12 shrink-0 animate-spin text-indigo-500 dark:text-indigo-400"
            aria-hidden
          />
          <div className="max-w-md space-y-2">
            <p className="text-2xl font-bold tracking-tight text-[var(--app-foreground)] sm:text-3xl">
              Espera!
            </p>
            <p className="text-base text-[var(--app-muted-foreground)] sm:text-lg">
              Estamos preparando todo para ti
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
