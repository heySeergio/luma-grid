'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Compass, X } from 'lucide-react'
import { dismissAdminGettingStartedBanner } from '@/app/actions/account'
import { ADMIN_PATHS } from '@/lib/admin/adminNav'

const STORAGE_KEY = 'luma-admin-getting-started-dismissed-v1'
const AUTO_DISMISS_MS = 25_000

const steps = [
  'Crea un tablero o elige uno en la lista y usa el icono del ojo para marcar cuál se abre al entrar al comunicador.',
  'Ajusta filas y columnas del grid (no disponible en el tablero demo fijo).',
  'Edita símbolos: revisa la detección léxica bajo la etiqueta y usa el control gramatical manual si hace falta.',
  'Guarda los cambios y prueba en Volver al tablero.',
  <>
    En el panel, abre{' '}
    <Link href={ADMIN_PATHS.account} className="font-semibold underline underline-offset-2">
      Cuenta
    </Link>{' '}
    y luego{' '}
    <Link href={ADMIN_PATHS.evaluation} className="font-semibold underline underline-offset-2">
      Evaluación
    </Link>{' '}
    para elegir cómo seguir el uso del tablero y revisar la calidad del léxico en Vista previa.
  </>,
]

function readLocalDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistLocalDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

type AdminGettingStartedBannerProps = {
  /** Preferencia en cuenta (servidor); si es true, no se muestra nunca más. */
  serverDismissed?: boolean
}

export default function AdminGettingStartedBanner({ serverDismissed = false }: AdminGettingStartedBannerProps) {
  const [visible, setVisible] = useState(() => {
    if (serverDismissed || readLocalDismissed()) return false
    return true
  })
  const dismissedRef = useRef(serverDismissed || readLocalDismissed())

  const persistDismissed = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    persistLocalDismissed()
    void dismissAdminGettingStartedBanner()
  }, [])

  const dismiss = useCallback(() => {
    persistDismissed()
    setVisible(false)
  }, [persistDismissed])

  useEffect(() => {
    if (!serverDismissed) return
    dismissedRef.current = true
    persistLocalDismissed()
    setVisible(false)
  }, [serverDismissed])

  /** Primera visita a /admin: al salir (navegación, recarga o cierre) no volver a mostrar. */
  useEffect(() => {
    if (!visible) return

    const markFirstVisitComplete = () => persistDismissed()

    window.addEventListener('pagehide', markFirstVisitComplete)
    return () => {
      window.removeEventListener('pagehide', markFirstVisitComplete)
      markFirstVisitComplete()
    }
  }, [visible, persistDismissed])

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [visible, dismiss])

  useEffect(() => {
    if (!visible) return

    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest('.theme-page-shell')) return
      dismiss()
    }

    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [visible, dismiss])

  if (!visible) return null

  return (
    <div
      className="border-b border-emerald-200/80 bg-emerald-50/90 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-950/35 sm:px-6 lg:px-8"
      role="region"
      aria-label="Primeros pasos en el panel"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-100">
            <Compass className="h-4 w-4 shrink-0" aria-hidden />
            Primeros pasos
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-relaxed text-emerald-950/95 dark:text-emerald-50/95">
            {steps.map((text, i) => (
              <li key={i} className="pl-0.5">
                {text}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-emerald-900/80 dark:text-emerald-200/85">
            Acceso asistido (escáner) y tecla de selección se configuran al editar el tablero. Con lector de pantalla, revisa las instrucciones del
            modo escáner en la capa de escaneo.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex shrink-0 items-center gap-1 self-end rounded-lg border border-emerald-300/80 bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-950 shadow-sm transition hover:bg-white dark:border-emerald-600/40 dark:bg-emerald-900/50 dark:text-emerald-50 dark:hover:bg-emerald-900/70 sm:self-start"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Ocultar
        </button>
      </div>
    </div>
  )
}