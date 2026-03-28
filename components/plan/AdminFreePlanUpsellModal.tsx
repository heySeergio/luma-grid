'use client'

import Link from 'next/link'
import { Check, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { PLAN_FEATURE_BULLETS } from '@/components/plan/PricingCards'

type Props = {
  open: boolean
  onDismiss: () => void
}

export default function AdminFreePlanUpsellModal({ open, onDismiss }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
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
        aria-labelledby="admin-upsell-title"
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] shadow-2xl sm:max-h-[min(92dvh,720px)] sm:max-w-2xl sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100/80 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-4 sm:p-6 dark:border-slate-800">
          <div className="flex min-w-0 gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500 text-white shadow-md">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 id="admin-upsell-title" className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                ¿Sabías qué incluyen los planes de pago?
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Con el plan <strong className="font-semibold text-slate-800 dark:text-slate-200">Libre</strong> ya tienes un tablero completo.
                Estas son las ventajas al pasar a <strong className="font-semibold text-indigo-700 dark:text-indigo-300">Voz</strong> o{' '}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">Identidad</strong>:
              </p>
            </div>
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border-2 border-indigo-400/50 bg-indigo-500/[0.07] p-4 dark:border-indigo-500/40 dark:bg-indigo-500/10">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Plan Voz</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Más tableros y voz natural</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {PLAN_FEATURE_BULLETS.voice.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-[var(--app-surface)] p-4 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Plan Identidad</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Todo lo de Voz y tu voz clonada</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {PLAN_FEATURE_BULLETS.identity.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-500">
            Precios y facturación mensual o anual en la página de planes.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-[var(--app-surface-muted)] p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6 dark:border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="ui-secondary-button order-2 w-full rounded-2xl px-5 py-2.5 text-sm font-semibold sm:order-none sm:w-auto"
          >
            Seguir con plan Libre
          </button>
          <Link
            href="/plan"
            className="ui-primary-button order-1 w-full rounded-2xl px-6 py-2.5 text-center text-sm font-semibold transition sm:order-none sm:w-auto"
          >
            Ver planes y precios
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
