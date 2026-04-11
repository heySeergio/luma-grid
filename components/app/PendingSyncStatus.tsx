'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import {
  flushPendingUsageEvents,
  getPendingUsageEventCount,
} from '@/lib/dexie/usageSyncQueue'

type Props = {
  isOnline: boolean
  shareUsageForPredictions: boolean
}

const POLL_MS = 4000

export default function PendingSyncStatus({ isOnline, shareUsageForPredictions }: Props) {
  const [pending, setPending] = useState(0)
  const [flushing, setFlushing] = useState(false)

  const refresh = useCallback(async () => {
    if (!shareUsageForPredictions) {
      setPending(0)
      return
    }
    try {
      const n = await getPendingUsageEventCount()
      setPending(n)
    } catch {
      setPending(0)
    }
  }, [shareUsageForPredictions])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  const handleRetry = useCallback(async () => {
    if (!isOnline || !shareUsageForPredictions) return
    setFlushing(true)
    try {
      await flushPendingUsageEvents()
      await refresh()
    } finally {
      setFlushing(false)
    }
  }, [isOnline, shareUsageForPredictions, refresh])

  if (!isOnline) {
    return (
      <div
        className="pointer-events-none fixed bottom-4 left-2 right-2 z-[90] flex justify-center sm:bottom-6 sm:left-auto sm:right-4 sm:justify-end"
        role="status"
        aria-live="polite"
      >
        <div className="pointer-events-auto flex max-w-md items-start gap-2 rounded-xl border border-amber-300/80 bg-amber-50/95 px-3 py-2 text-xs text-amber-950 shadow-md backdrop-blur-sm dark:border-amber-500/40 dark:bg-amber-950/90 dark:text-amber-100">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Sin conexión.</span> Puedes seguir usando el tablero; la predicción puede no
            actualizarse del todo hasta volver la red.
          </p>
        </div>
      </div>
    )
  }

  if (!shareUsageForPredictions || pending <= 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-2 right-2 z-[90] flex justify-center sm:bottom-6 sm:left-auto sm:right-4 sm:justify-end"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border border-sky-300/80 bg-sky-50/95 px-3 py-2 text-xs text-sky-950 shadow-md backdrop-blur-sm dark:border-sky-500/35 dark:bg-sky-950/90 dark:text-sky-100">
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Sincronizando aprendizaje:</span>{' '}
          {pending === 1 ? '1 toque pendiente' : `${pending} toques pendientes`} para mejorar predicciones.
        </p>
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={flushing}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-400/60 bg-white/80 px-2 py-1 text-[11px] font-semibold text-sky-900 transition hover:bg-white disabled:opacity-60 dark:border-sky-400/30 dark:bg-sky-900/50 dark:text-sky-50 dark:hover:bg-sky-900"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${flushing ? 'animate-spin' : ''}`} aria-hidden />
          Reintentar
        </button>
      </div>
    </div>
  )
}
