'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, X } from 'lucide-react'

const STORAGE_KEY = 'luma-tablero-quick-tips-dismissed-v1'

export default function TableroQuickTips() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const inLocal = window.localStorage.getItem(STORAGE_KEY) === '1'
      const inSession = window.sessionStorage.getItem(STORAGE_KEY) === '1'
      if (inLocal || inSession) {
        if (inSession && !inLocal) {
          try {
            window.localStorage.setItem(STORAGE_KEY, '1')
          } catch {
            /* ignore */
          }
        }
        setVisible(false)
        return
      }
      setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      className="shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--app-surface-elevated))] px-3 py-2.5 dark:bg-[color-mix(in_srgb,var(--accent)_16%,var(--app-surface-strong))]"
      role="region"
      aria-label="Consejos rápidos del tablero"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden />
          <ul className="list-inside list-disc space-y-0.5 text-xs leading-relaxed text-[var(--app-foreground)]">
            <li>
              Toca símbolos para formar la frase en la barra superior; usa <strong className="font-semibold">Hablar</strong> para leerla en voz
              alta.
            </li>
            <li>
              Las celdas resaltadas sugieren la siguiente palabra. Puedes desactivar predicción en celdas o la franja «Siguiente» desde{' '}
              <Link
                href="/admin"
                className="font-semibold text-indigo-700 underline decoration-indigo-400/80 underline-offset-2 hover:text-indigo-900 dark:text-indigo-200 dark:decoration-indigo-400/50 dark:hover:text-white"
              >
                cuenta en el panel
              </Link>
              .
            </li>
            <li>
              Si activaste compartir toques para predicciones, puedes revisar la opción de privacidad en el mismo panel. Sin conexión, el tablero
              sigue funcionando; la predicción puede ir un paso por detrás hasta sincronizar.
            </li>
          </ul>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="ui-secondary-button inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm sm:self-start"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Entendido
        </button>
      </div>
    </div>
  )
}
