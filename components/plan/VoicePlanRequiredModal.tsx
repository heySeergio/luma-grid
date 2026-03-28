'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = {
  open: boolean
  onDismiss: () => void
}

export default function VoicePlanRequiredModal({ open, onDismiss }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'var(--app-modal-backdrop)' }}
        onClick={onDismiss}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-plan-required-title"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="ui-modal-panel relative w-full max-w-md overflow-hidden rounded-t-[1.75rem] p-6 shadow-2xl sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="voice-plan-required-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Plan superior necesario
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Esa opción solo se permite con un plan superior (Voz o Identidad con suscripción activa).
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold sm:w-auto"
          >
            Entendido
          </button>
          <Link
            href="/plan"
            className="ui-primary-button w-full rounded-2xl px-6 py-2.5 text-center text-sm font-semibold sm:w-auto"
          >
            Ver planes
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
