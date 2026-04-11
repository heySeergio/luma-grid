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
      if (window.sessionStorage.getItem(STORAGE_KEY) === '1') {
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
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      className="shrink-0 border-b border-slate-200/90 bg-indigo-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-indigo-950/40"
      role="region"
      aria-label="Consejos rápidos del tablero"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden />
          <ul className="list-inside list-disc space-y-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            <li>
              Toca símbolos para formar la frase en la barra superior; usa <strong className="font-semibold">Hablar</strong> para leerla en voz
              alta.
            </li>
            <li>
              Las celdas resaltadas sugieren la siguiente palabra. Puedes desactivar predicción en celdas o la franja «Siguiente» desde{' '}
              <Link href="/admin" className="font-semibold underline decoration-indigo-400/70 underline-offset-2 hover:text-indigo-800 dark:hover:text-white">
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
          className="inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-lg border border-indigo-200/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-indigo-900 shadow-sm transition hover:bg-white dark:border-indigo-500/30 dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:bg-indigo-900/60 sm:self-start"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Entendido
        </button>
      </div>
    </div>
  )
}
