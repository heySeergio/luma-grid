'use client'

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

const WELCOME_DURATION_MS = 3_000

type Props = {
  /** Clave única por ruta en sessionStorage (primera visita a esa ruta en la sesión del navegador). */
  sessionKey: string
  children: ReactNode
}

/**
 * Pantalla de bienvenida fija la primera vez que se entra en una ruta en la sesión actual.
 */
function markSeen(sessionKey: string) {
  try {
    sessionStorage.setItem(sessionKey, '1')
  } catch {
    /* ignore */
  }
}

export default function SessionWelcomeLoader({ sessionKey, children }: Props) {
  const [showOverlay, setShowOverlay] = useState(true)
  const autoDismissTimerRef = useRef<number | null>(null)

  const dismiss = useCallback(() => {
    if (autoDismissTimerRef.current != null) {
      window.clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }
    markSeen(sessionKey)
    setShowOverlay(false)
  }, [sessionKey])

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
      dismiss()
    }, WELCOME_DURATION_MS)
    autoDismissTimerRef.current = id

    return () => {
      cancelled = true
      window.clearTimeout(id)
      autoDismissTimerRef.current = null
    }
  }, [sessionKey, dismiss])

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
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 rounded-2xl border border-indigo-300/60 bg-white/90 px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-indigo-500/40 dark:bg-slate-900/80 dark:text-indigo-100 dark:hover:bg-slate-900"
            >
              Continuar ahora
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
