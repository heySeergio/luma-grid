'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type PricingVariant = 'landing' | 'modal'

type Props = {
  variant: PricingVariant
  /** Modal: elegir plan gratis */
  onSelectFree?: () => void | Promise<void>
  /** Modal: checkout Stripe */
  onSelectPaid?: (tier: 'voice' | 'identity', interval: 'month' | 'year') => void | Promise<void>
  disabled?: boolean
}

/** Ventajas por plan (compartido con upsell del admin, etc.). */
export const PLAN_FEATURE_BULLETS = {
  free: ['1 tablero activo', 'Máximo 60 botones en total (incl. carpetas)', 'Voz del sistema (TTS del dispositivo)'],
  voice: ['Hasta 5 tableros', 'Botones ilimitados por tablero', 'Voces naturales ElevenLabs', '50.000 caracteres de voz / mes'],
  identity: [
    'Hasta 20 tableros',
    'Botones ilimitados por tablero',
    'Voces naturales + clonación de voz',
    '100.000 caracteres de voz / mes',
  ],
} as const

const features = PLAN_FEATURE_BULLETS

export default function PricingCards({ variant, onSelectFree, onSelectPaid, disabled }: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const isModal = variant === 'modal'

  const voicePrimary = interval === 'month' ? '9€' : '79€'
  const voiceSecondary = interval === 'month' ? '79€/año (ahorra ~27%)' : 'equiv. ~6,58€/mes'
  const idPrimary = interval === 'month' ? '24€' : '199€'
  const idSecondary = interval === 'month' ? '199€/año (ahorra ~31%)' : 'equiv. ~16,58€/mes'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">Facturación:</span>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/15 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              interval === 'month'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300',
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              interval === 'year'
                ? 'bg-indigo-500 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300',
            )}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Libre */}
        <article className="flex flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Plan Libre</h3>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            0€
            <span className="text-base font-semibold text-slate-500">/mes</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Sin tarjeta</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {features.free.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
          {isModal && onSelectFree ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onSelectFree()}
              className="mt-6 w-full rounded-2xl border border-slate-300 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              Empezar gratis
            </button>
          ) : (
            <Link
              href="/register"
              className="mt-6 block w-full rounded-2xl border border-slate-300 py-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              Empezar gratis
            </Link>
          )}
        </article>

        {/* Voz — destacado */}
        <article className="relative flex flex-col rounded-3xl border-2 border-indigo-500 bg-indigo-500/[0.06] p-6 shadow-lg dark:border-indigo-400 dark:bg-indigo-500/10">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            Recomendado
          </span>
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Plan Voz</h3>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {voicePrimary}
            <span className="text-base font-semibold text-slate-600 dark:text-slate-400">
              {interval === 'month' ? '/mes' : '/año'}
            </span>
          </p>
          <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">{interval === 'month' ? voiceSecondary : 'Pago anual único'}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {features.voice.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                {f}
              </li>
            ))}
          </ul>
          {isModal && onSelectPaid ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onSelectPaid('voice', interval)}
              className="mt-6 w-full rounded-2xl bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              Activar Voz
            </button>
          ) : (
            <Link
              href="/register"
              className="mt-6 block w-full rounded-2xl bg-indigo-500 py-3 text-center text-sm font-bold text-white transition hover:bg-indigo-400"
            >
              Activar Voz
            </Link>
          )}
        </article>

        {/* Identidad */}
        <article className="flex flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Plan Identidad</h3>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {idPrimary}
            <span className="text-base font-semibold text-slate-600 dark:text-slate-400">
              {interval === 'month' ? '/mes' : '/año'}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">{interval === 'month' ? idSecondary : 'Pago anual único'}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {features.identity.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
          {isModal && onSelectPaid ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onSelectPaid('identity', interval)}
              className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:border-white/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Activar Identidad
            </button>
          ) : (
            <Link
              href="/register"
              className="mt-6 block w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800 dark:border-white/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Activar Identidad
            </Link>
          )}
        </article>
      </div>
    </div>
  )
}
