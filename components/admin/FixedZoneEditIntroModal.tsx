'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pin, X } from 'lucide-react'
import FixedZoneEditIntroDemo from '@/components/admin/FixedZoneEditIntroDemo'

export const FIXED_ZONE_INTRO_STORAGE_KEY = 'luma-admin-fixed-zone-intro-dismissed-v1'

type Props = {
  onConfirm: () => void
  onCancel: () => void
}

export default function FixedZoneEditIntroModal({ onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'var(--app-modal-backdrop)' }}
        onClick={onCancel}
        role="presentation"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.22 }}
        className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] sm:max-h-[min(92dvh,720px)] sm:rounded-[2rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fixed-zone-intro-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
              <Pin className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 id="fixed-zone-intro-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Modificar la base fija
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Solo la primera vez te mostramos este resumen.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-6 sm:pb-8">
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              La <span className="font-semibold text-violet-800 dark:text-violet-200">base fija</span> son las celdas que se mantienen al
              cambiar de carpeta; el resto del grid muestra el contenido de cada carpeta.
            </p>
            <ol className="list-inside list-decimal space-y-2 pl-0.5 text-sm">
              <li>
                Con el modo activado, <span className="font-semibold">haz clic o arrastra</span> para marcar o quitar celdas de la base fija
                (las fijas se resaltan en violeta).
              </li>
              <li>
                En el tablero demo puedes usar <span className="font-semibold">Plantilla por defecto</span> (7 columnas + 1.ª fila).
              </li>
              <li>
                Pulsa <span className="font-semibold">Guardar</span> para aplicar los cambios; <kbd className="rounded border border-slate-300/80 bg-slate-100/90 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">Esc</kbd> o{' '}
                <span className="font-semibold">Cancelar</span> salen sin guardar.
              </li>
            </ol>
          </div>

          <div className="mt-5">
            <FixedZoneEditIntroDemo />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100/80 bg-[var(--app-surface-muted)] p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6 dark:border-slate-800">
          <button type="button" onClick={onCancel} className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold sm:w-auto">
            Ahora no
          </button>
          <button type="button" onClick={onConfirm} className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-sm font-semibold sm:w-auto">
            Entendido, editar base fija
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
