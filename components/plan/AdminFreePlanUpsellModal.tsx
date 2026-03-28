'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { startSubscriptionCheckout } from '@/app/actions/plan'
import { PLAN_FEATURE_BULLETS } from '@/components/plan/PricingCards'

/** Mismas cifras que en PricingCards (UI). */
const VOICE_MONTH = '9€'
const VOICE_YEAR = '79€'
const IDENTITY_MONTH = '24€'
const IDENTITY_YEAR = '199€'

type Props = {
  open: boolean
  onDismiss: () => void
}

export default function AdminFreePlanUpsellModal({ open, onDismiss }: Props) {
  const [busy, setBusy] = useState<'voice-m' | 'voice-y' | 'identity-m' | 'identity-y' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => onDismiss(), 7000)
    return () => window.clearTimeout(id)
  }, [open, onDismiss])

  if (!open) return null

  async function handleCheckout(tier: 'voice' | 'identity', interval: 'month' | 'year', key: typeof busy) {
    setError(null)
    setBusy(key)
    try {
      const r = await startSubscriptionCheckout(tier, interval)
      if (!r.ok) {
        setError(r.message)
        setBusy(null)
        return
      }
      window.location.href = r.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago.')
      setBusy(null)
    }
  }

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
        className="ui-modal-panel relative flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] shadow-2xl sm:max-h-[min(92dvh,860px)] sm:max-w-3xl sm:rounded-[2rem]"
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
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">{VOICE_MONTH}</span>
                <span className="text-slate-500"> /mes</span>
                {' · '}
                <span className="font-semibold text-slate-900 dark:text-white">{VOICE_YEAR}</span>
                <span className="text-slate-500"> /año</span>
                <span className="block text-xs text-indigo-800/90 dark:text-indigo-200/90">Anual: ahorra ~27% frente a 12 meses sueltos</span>
              </p>
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
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">{IDENTITY_MONTH}</span>
                <span className="text-slate-500"> /mes</span>
                {' · '}
                <span className="font-semibold text-slate-900 dark:text-white">{IDENTITY_YEAR}</span>
                <span className="text-slate-500"> /año</span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">Anual: ahorra ~31% frente a 12 meses sueltos</span>
              </p>
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
            Pago seguro con Stripe. El modal se cierra solo en unos segundos o usa la X.
          </p>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 break-words">{error}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleCheckout('voice', 'month', 'voice-m')}
              className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {busy === 'voice-m' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activar Voz — mensual ({VOICE_MONTH}/mes)
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleCheckout('voice', 'year', 'voice-y')}
              className="ui-secondary-button flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/50 px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-60 dark:text-slate-100"
            >
              {busy === 'voice-y' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activar Voz — anual ({VOICE_YEAR}/año)
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleCheckout('identity', 'month', 'identity-m')}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:border-slate-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {busy === 'identity-m' ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
              Activar Identidad — mensual ({IDENTITY_MONTH}/mes)
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void handleCheckout('identity', 'year', 'identity-y')}
              className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:border-slate-500 dark:bg-slate-900"
            >
              {busy === 'identity-y' ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
              Activar Identidad — anual ({IDENTITY_YEAR}/año)
            </button>
          </div>
        </div>

        <div className="flex shrink-0 border-t border-slate-100 bg-[var(--app-surface-muted)] p-4 sm:p-6 dark:border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="ui-secondary-button w-full rounded-2xl px-5 py-2.5 text-sm font-semibold"
          >
            Seguir con plan Libre
          </button>
        </div>
      </motion.div>
    </div>
  )
}
