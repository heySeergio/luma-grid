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
  onSelectPaid?: (tier: 'voice' | 'identity' | 'therapist', interval: 'month' | 'year') => void | Promise<void>
  disabled?: boolean
  /** Landing: sin enlaces a registro ni CTA inferior (solo referencia de precios). */
  comingSoon?: boolean
  /** Página informativa: muestra CTAs deshabilitados (sin registro ni checkout). */
  displayOnly?: boolean
}

/** Ventajas por plan (compartido con upsell del admin, etc.). */
export const PLAN_FEATURE_BULLETS = {
  free: ['3 tableros activos', 'Hasta 150 botones en total (incl. carpetas)', 'Voz del sistema (TTS del dispositivo)'],
  voice: [
    'Hasta 5 tableros',
    'Botones ilimitados por tablero',
    'Voces naturales y realistas (muy expresivas)',
    '50.000 caracteres de voz / mes',
  ],
  identity: [
    'Hasta 20 tableros',
    'Botones ilimitados por tablero',
    'Voces naturales y realistas + clonación de voz',
    '100.000 caracteres de voz / mes',
  ],
  therapist: [
    'Hasta 10 pacientes desde una sola cuenta',
    'Dashboard profesional y evaluación avanzada',
    'Biblioteca de plantillas compartidas del centro',
    'Informes clínicos exportables',
    'Roles y permisos para colaboradores',
  ],
} as const

const features = PLAN_FEATURE_BULLETS

export default function PricingCards({
  variant,
  onSelectFree,
  onSelectPaid,
  disabled,
  comingSoon,
  displayOnly = false,
}: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const isModal = variant === 'modal'

  const voicePrimary = interval === 'month' ? '9€' : '79€'
  const idPrimary = interval === 'month' ? '24€' : '199€'
  const therapistPrimary = interval === 'month' ? '69€' : '690€'
  const voiceYearlyHint = '79 €/año (ahorra ~27%)'
  const idYearlyHint = '199 €/año (ahorra ~31%)'
  const therapistYearlyHint = '690 €/año (ahorra 138 €)'

  function YearlyPriceHint({ label }: { label: string }) {
    return (
      <button
        type="button"
        onClick={() => setInterval('year')}
        className="mt-1 text-left text-xs text-indigo-800 underline decoration-indigo-400/60 underline-offset-2 transition hover:decoration-indigo-600 dark:text-indigo-200 dark:decoration-indigo-300/60"
      >
        {label}
      </button>
    )
  }

  const freeCtaClass =
    'mt-6 w-full rounded-2xl border border-slate-300 py-3 text-sm font-bold text-slate-800 transition dark:border-white/20 dark:text-white'
  const voiceCtaClass =
    'mt-6 w-full rounded-2xl bg-indigo-500 py-3 text-sm font-bold text-white transition'
  const identityCtaClass =
    'mt-6 w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 text-sm font-bold text-white transition dark:border-white/20 dark:bg-white dark:text-slate-900'
  const therapistCtaClass =
    'mt-6 w-full rounded-2xl bg-sky-700 py-3 text-sm font-bold text-white transition hover:bg-sky-600'

  function renderFreeCta() {
    if (comingSoon) return null
    if (displayOnly) {
      return (
        <button type="button" disabled className={`${freeCtaClass} cursor-not-allowed opacity-60`}>
          Empezar gratis
        </button>
      )
    }
    if (isModal && onSelectFree) {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onSelectFree()}
          className={`${freeCtaClass} hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-white/10`}
        >
          Empezar gratis
        </button>
      )
    }
    return (
      <Link
        href="/register"
        className={`${freeCtaClass} block text-center hover:bg-slate-50 dark:hover:bg-white/10`}
      >
        Empezar gratis
      </Link>
    )
  }

  function renderPaidCta(tier: 'voice' | 'identity' | 'therapist', label: string, className: string) {
    if (comingSoon) return null
    if (displayOnly) {
      return (
        <button type="button" disabled className={`${className} cursor-not-allowed opacity-60`}>
          {label}
        </button>
      )
    }
    if (isModal && onSelectPaid) {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onSelectPaid(tier, interval)}
          className={`${className} disabled:opacity-50 ${tier === 'voice' ? 'hover:bg-indigo-400' : tier === 'therapist' ? 'hover:bg-sky-600' : 'hover:bg-slate-800 dark:hover:bg-slate-100'}`}
        >
          {label}
        </button>
      )
    }
    return (
      <Link
        href="/register"
        className={`${className} block text-center ${tier === 'voice' ? 'hover:bg-indigo-400' : tier === 'therapist' ? 'hover:bg-sky-600' : 'hover:bg-slate-800 dark:hover:bg-slate-100'}`}
      >
        {label}
      </Link>
    )
  }

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
          {renderFreeCta()}
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
          {interval === 'month' ? (
            <YearlyPriceHint label={voiceYearlyHint} />
          ) : (
            <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">Pago anual único</p>
          )}
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {features.voice.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                {f}
              </li>
            ))}
          </ul>
          {renderPaidCta('voice', 'Activar Voz', voiceCtaClass)}
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
          {interval === 'month' ? (
            <YearlyPriceHint label={idYearlyHint} />
          ) : (
            <p className="mt-1 text-xs text-slate-500">Pago anual único</p>
          )}
          <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {features.identity.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
          {renderPaidCta('identity', 'Activar Identidad', identityCtaClass)}
        </article>
      </div>

      {/* Terapeuta — ancho completo */}
      <article className="flex flex-col rounded-3xl border-2 border-sky-600/70 bg-gradient-to-b from-sky-50/90 to-white p-6 shadow-lg dark:border-sky-500/50 dark:from-sky-950/40 dark:to-slate-900/80 lg:flex-row lg:gap-8">
        <div className="lg:min-w-[14rem] lg:shrink-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-sky-800 dark:text-sky-300">
            Profesionales
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Plan Terapeuta</h3>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {therapistPrimary}
            <span className="text-base font-semibold text-slate-600 dark:text-slate-400">
              {interval === 'month' ? '/mes' : '/año'}
            </span>
          </p>
          {interval === 'month' ? (
            <YearlyPriceHint label={therapistYearlyHint} />
          ) : (
            <p className="mt-1 text-xs text-sky-800 dark:text-sky-200">Pago anual único</p>
          )}
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Para logopedas, terapeutas y centros que gestionan varios pacientes.
          </p>
        </div>
        <div className="mt-5 flex flex-1 flex-col lg:mt-0">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Todo lo del Plan Identidad, más:
          </p>
          <ul className="grid flex-1 gap-2 text-sm text-slate-600 sm:grid-cols-2 dark:text-slate-300">
            {features.therapist.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Ampliaciones: paciente adicional +6 €/mes · terapeuta adicional +39 €/mes
          </p>
          <button
            type="button"
            disabled
            className={`${therapistCtaClass} cursor-not-allowed opacity-60`}
          >
            Próximamente
          </button>
        </div>
      </article>
    </div>
  )
}
