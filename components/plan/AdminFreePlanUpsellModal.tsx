'use client'

import { useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { startSubscriptionCheckout } from '@/app/actions/plan'
import { PLAN_FEATURE_BULLETS } from '@/components/plan/PricingCards'

/** Importes numéricos (€) — mismas cifras que en PricingCards. */
const VOICE_MONTH_EUR = 9
const VOICE_YEAR_EUR = 79
const IDENTITY_MONTH_EUR = 24
const IDENTITY_YEAR_EUR = 199

function formatEuro(value: number, fractionDigits = 0): string {
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value) + '€'
  )
}

function monthlyEquivalentFromAnnual(annualEur: number): string {
  return formatEuro(annualEur / 12, 2)
}

type Billing = 'month' | 'year'

type Props = {
  open: boolean
  onDismiss: () => void
}

export default function AdminFreePlanUpsellModal({ open, onDismiss }: Props) {
  const [billing, setBilling] = useState<Billing>('month')
  const [busy, setBusy] = useState<'voice-m' | 'voice-y' | 'identity-m' | 'identity-y' | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const voiceKey = billing === 'month' ? 'voice-m' : 'voice-y'
  const identityKey = billing === 'month' ? 'identity-m' : 'identity-y'

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
          <div
            className="mb-5 flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-900/80"
            role="group"
            aria-label="Periodo de facturación"
          >
            <button
              type="button"
              onClick={() => setBilling('month')}
              aria-pressed={billing === 'month'}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                billing === 'month'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Plan mensual
            </button>
            <button
              type="button"
              onClick={() => setBilling('year')}
              aria-pressed={billing === 'year'}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                billing === 'year'
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Plan anual
            </button>
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 break-words dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="flex flex-col rounded-2xl border-2 border-indigo-400/50 bg-indigo-500/[0.07] p-5 dark:border-indigo-500/40 dark:bg-indigo-500/10">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Plan Voz</p>
              <p className="mt-2 text-xl font-bold leading-tight text-slate-900 dark:text-white sm:text-2xl">
                Más tableros y voz natural
              </p>

              <div className="mt-4 min-h-[4.5rem]">
                {billing === 'month' ? (
                  <p className="flex flex-wrap items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{formatEuro(VOICE_MONTH_EUR)}</span>
                    <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">/mes</span>
                  </p>
                ) : (
                  <div>
                    <p className="flex flex-wrap items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        {monthlyEquivalentFromAnnual(VOICE_YEAR_EUR)}
                      </span>
                      <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">/mes</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Equivalente mensual · pago anual {formatEuro(VOICE_YEAR_EUR)}
                    </p>
                  </div>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {PLAN_FEATURE_BULLETS.voice.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleCheckout('voice', billing === 'month' ? 'month' : 'year', voiceKey)}
                className="ui-primary-button mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy === voiceKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {billing === 'month' ? `Activar Voz (${formatEuro(VOICE_MONTH_EUR)}/mes)` : `Activar Voz (${formatEuro(VOICE_YEAR_EUR)}/año)`}
              </button>
            </article>

            <article className="flex flex-col rounded-2xl border border-slate-200 bg-[var(--app-surface)] p-5 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Plan Identidad</p>
              <p className="mt-2 text-xl font-bold leading-tight text-slate-900 dark:text-white sm:text-2xl">
                Todo lo de Voz y tu voz clonada
              </p>

              <div className="mt-4 min-h-[4.5rem]">
                {billing === 'month' ? (
                  <p className="flex flex-wrap items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{formatEuro(IDENTITY_MONTH_EUR)}</span>
                    <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">/mes</span>
                  </p>
                ) : (
                  <div>
                    <p className="flex flex-wrap items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        {monthlyEquivalentFromAnnual(IDENTITY_YEAR_EUR)}
                      </span>
                      <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">/mes</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Equivalente mensual · pago anual {formatEuro(IDENTITY_YEAR_EUR)}
                    </p>
                  </div>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {PLAN_FEATURE_BULLETS.identity.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleCheckout('identity', billing === 'month' ? 'month' : 'year', identityKey)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:border-slate-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {busy === identityKey ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {billing === 'month'
                  ? `Activar Identidad (${formatEuro(IDENTITY_MONTH_EUR)}/mes)`
                  : `Activar Identidad (${formatEuro(IDENTITY_YEAR_EUR)}/año)`}
              </button>
            </article>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-500">
            Pago seguro con Stripe. Cierra con la X, el fondo o &quot;Seguir con plan Libre&quot;.
          </p>
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
