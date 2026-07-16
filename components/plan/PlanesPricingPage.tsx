'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CONTACT_EMAIL } from '@/lib/site/contact'

type BillingInterval = 'month' | 'year'

type PlanCardConfig = {
  id: string
  name: string
  tagline: string
  subtitle?: string
  monthlyPrice: number | null
  yearlyPrice: number | null
  yearlySavings: number | null
  features: string[]
  extraFeatures?: string[]
  extraFeaturesLabel?: string
  footnote?: string
  addons?: string[]
  cta: string
  variant: 'free' | 'voice' | 'identity' | 'therapist'
  badge?: string
}

const PLANS: PlanCardConfig[] = [
  {
    id: 'free',
    name: 'Plan Libre',
    tagline: 'Empieza hoy sin coste y descubre el poder de la comunicación con IA',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlySavings: null,
    features: [
      '3 tableros activos',
      'Hasta 150 botones en total (incluidas carpetas)',
      'Voz del sistema (TTS del dispositivo)',
      'Autocompletado inteligente de frases y conjugación automática de verbos',
      'Acceso a recursos y comunidad LumaGrid',
    ],
    footnote: 'Sin tarjeta. Sin compromiso.',
    cta: 'Empezar gratis',
    variant: 'free',
  },
  {
    id: 'voice',
    name: 'Plan Voz',
    tagline: 'El plan más recomendado para usuarios individuales',
    subtitle: 'Voces naturales y expresivas que suenan como una persona real.',
    monthlyPrice: 9,
    yearlyPrice: 79,
    yearlySavings: 29,
    features: [
      'Hasta 5 tableros activos',
      'Botones y carpetas ilimitados',
      'Voces naturales de ElevenLabs (muy expresivas)',
      '50.000 caracteres de voz al mes',
      'Evaluaciones básicas para logopedas',
      'Historial y estadísticas de uso',
      'Soporte prioritario por email',
    ],
    cta: 'Activar Voz',
    variant: 'voice',
    badge: 'Más recomendado',
  },
  {
    id: 'identity',
    name: 'Plan Identidad',
    tagline: 'Dale una voz propia. Dale identidad.',
    monthlyPrice: 24,
    yearlyPrice: 199,
    yearlySavings: 89,
    extraFeaturesLabel: 'Todo lo del Plan Voz más:',
    extraFeatures: [
      'Clonación de voz personal (crea una voz única que representa su identidad)',
      'Hasta 20 tableros activos',
      '100.000 caracteres de voz al mes',
      'Evaluaciones avanzadas y detalladas',
      'Informes clínicos exportables en PDF',
      'Prioridad máxima en generación de voz',
      'Soporte prioritario rápido',
    ],
    features: [],
    cta: 'Activar Identidad',
    variant: 'identity',
  },
  {
    id: 'therapist',
    name: 'Plan Terapeuta',
    tagline: 'La solución profesional para logopedas, terapeutas y centros',
    monthlyPrice: 69,
    yearlyPrice: 690,
    yearlySavings: 138,
    extraFeaturesLabel: 'Todo lo del Plan Identidad más todo lo que necesitas para trabajar con múltiples pacientes:',
    extraFeatures: [
      'Gestión de hasta 10 pacientes desde una única cuenta',
      'Dashboard profesional para seguimiento clínico completo',
      'Biblioteca de plantillas compartidas del centro',
      'Informes clínicos avanzados y personalizables',
      'Roles y permisos para colaboradores',
      'Soporte prioritario dedicado (email + canal directo)',
      '1 hora de formación grupal al mes incluida',
    ],
    features: [],
    addons: ['Paciente adicional: +6 €/mes', 'Terapeuta adicional: +39 €/mes'],
    cta: 'Próximamente',
    variant: 'therapist',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'Con el Plan Voz mis alumnos por fin escuchan frases que suenan naturales. La conjugación automática les ahorra tiempo en cada sesión.',
    author: 'María G.',
    role: 'Maestra de educación especial',
    plan: 'Plan Voz',
  },
  {
    quote:
      'La clonación de voz ha sido un antes y un después para la familia. Su hijo se reconoce al hablar con el tablero.',
    author: 'Laura P.',
    role: 'Madre y cuidadora',
    plan: 'Plan Identidad',
  },
  {
    quote:
      'Gestiono ocho perfiles desde el Plan Terapeuta y exporto informes para el equipo en minutos. Es la herramienta que pedíamos en el centro.',
    author: 'Elena R.',
    role: 'Logopeda en centro educativo',
    plan: 'Plan Terapeuta',
  },
] as const

function BillingToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval
  onChange: (value: BillingInterval) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <span className="text-sm font-semibold text-forest/70">Facturación</span>
      <div
        className="relative inline-flex rounded-full border border-black/[0.08] bg-white p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]"
        role="group"
        aria-label="Tipo de facturación"
      >
        <button
          type="button"
          onClick={() => onChange('month')}
          aria-pressed={interval === 'month'}
          className={cn(
            'relative z-[1] rounded-full px-5 py-2 text-sm font-bold transition-all duration-200',
            interval === 'month' ? 'bg-forest text-white shadow-sm' : 'text-forest/65 hover:text-forest',
          )}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => onChange('year')}
          aria-pressed={interval === 'year'}
          className={cn(
            'relative z-[1] rounded-full px-5 py-2 text-sm font-bold transition-all duration-200',
            interval === 'year' ? 'bg-forest text-white shadow-sm' : 'text-forest/65 hover:text-forest',
          )}
        >
          Anual
        </button>
      </div>
      {interval === 'year' ? (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          Ahorra hasta 138 € al año
        </span>
      ) : null}
    </div>
  )
}

function FeatureList({ items, checkClass = 'text-emerald-600' }: { items: string[]; checkClass?: string }) {
  return (
    <ul className="space-y-2.5 text-sm leading-snug text-forest/85">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <Check className={cn('mt-0.5 h-4 w-4 shrink-0', checkClass)} strokeWidth={2.5} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PlanPrice({
  plan,
  interval,
  onSelectYearly,
}: {
  plan: PlanCardConfig
  interval: BillingInterval
  onSelectYearly: () => void
}) {
  if (plan.monthlyPrice === 0) {
    return (
      <div>
        <p className="text-3xl font-black tabular-nums tracking-tight text-forest sm:text-4xl">
          0 €<span className="text-lg font-bold text-forest/50">/mes</span>
        </p>
      </div>
    )
  }

  const isYearly = interval === 'year'
  const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const suffix = isYearly ? '/año' : '/mes'

  return (
    <div>
      <p className="text-3xl font-black tabular-nums tracking-tight text-forest sm:text-4xl">
        {amount} €<span className="text-lg font-bold text-forest/55">{suffix}</span>
      </p>
      {isYearly && plan.yearlySavings ? (
        <p className="mt-2 text-base font-extrabold text-emerald-600">Ahorras {plan.yearlySavings} €</p>
      ) : !isYearly && plan.yearlyPrice && plan.yearlySavings ? (
        <p className="mt-1 text-xs font-medium text-forest/55">
          o{' '}
          <button
            type="button"
            onClick={onSelectYearly}
            className="font-medium text-forest/70 underline decoration-forest/35 underline-offset-2 transition hover:text-forest hover:decoration-forest"
          >
            {plan.yearlyPrice} €/año
          </button>{' '}
          <span className="font-bold text-emerald-600">(Ahorras {plan.yearlySavings} €)</span>
        </p>
      ) : null}
    </div>
  )
}

function PlanCard({
  plan,
  interval,
  onSelectYearly,
}: {
  plan: PlanCardConfig
  interval: BillingInterval
  onSelectYearly: () => void
}) {
  const shellClass = cn(
    'relative flex h-full flex-col rounded-[22px] border p-6 sm:p-7',
    plan.variant === 'free' && 'border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
    plan.variant === 'voice' &&
      'border-2 border-violet-500 bg-gradient-to-b from-violet-50/90 to-white shadow-[0_12px_40px_rgba(124,58,237,0.18)]',
    plan.variant === 'identity' && 'border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
    plan.variant === 'therapist' &&
      'border-2 border-sky-600/80 bg-gradient-to-b from-sky-50/90 to-white shadow-[0_12px_40px_rgba(2,132,199,0.14)] lg:col-span-2 xl:col-span-4',
  )

  const ctaClass = cn(
    'mt-6 w-full rounded-2xl py-3.5 text-sm font-bold transition disabled:opacity-60',
    plan.variant === 'free' && 'border border-black/15 bg-white text-forest hover:bg-black/[0.03]',
    plan.variant === 'voice' && 'bg-violet-600 text-white shadow-md hover:bg-violet-500',
    plan.variant === 'identity' && 'bg-forest text-white shadow-md hover:bg-forest/90',
    plan.variant === 'therapist' && 'bg-sky-700 text-white shadow-md hover:bg-sky-600',
  )

  const checkClass =
    plan.variant === 'voice'
      ? 'text-violet-600'
      : plan.variant === 'therapist'
        ? 'text-sky-700'
        : 'text-emerald-600'

  const allFeatures = [...plan.features, ...(plan.extraFeatures ?? [])]

  return (
    <article className={shellClass}>
      {plan.badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
          {plan.badge}
        </span>
      ) : null}

      <div className={cn(plan.variant === 'therapist' ? 'lg:flex lg:gap-10' : '')}>
        <div className={cn(plan.variant === 'therapist' ? 'lg:min-w-[16rem] lg:shrink-0' : '')}>
          <h3 className="text-xl font-extrabold text-forest">{plan.name}</h3>
          <div className="mt-3">
            <PlanPrice plan={plan} interval={interval} onSelectYearly={onSelectYearly} />
          </div>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-forest/90">{plan.tagline}</p>
          {plan.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-forest/70">{plan.subtitle}</p>
          ) : null}
          {plan.footnote ? (
            <p className="mt-3 text-xs font-semibold text-forest/55">{plan.footnote}</p>
          ) : null}
        </div>

        <div className={cn('mt-5 flex flex-1 flex-col', plan.variant === 'therapist' ? 'lg:mt-0' : '')}>
          {plan.extraFeaturesLabel && plan.extraFeatures?.length ? (
            <p className="mb-3 text-sm font-bold text-forest/80">{plan.extraFeaturesLabel}</p>
          ) : null}
          <FeatureList items={allFeatures} checkClass={checkClass} />
          {plan.addons?.length ? (
            <div className="mt-4 rounded-xl border border-sky-200/80 bg-sky-50/60 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-sky-900/80">Ampliaciones disponibles</p>
              <ul className="mt-2 space-y-1 text-sm text-forest/80">
                {plan.addons.map((addon) => (
                  <li key={addon}>• {addon}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {plan.variant === 'free' || plan.variant === 'voice' || plan.variant === 'identity' ? (
        <Link href="/register" className={`${ctaClass} block text-center`}>
          {plan.variant === 'free' ? plan.cta : 'Registrarse'}
        </Link>
      ) : (
        <button type="button" disabled className={`${ctaClass} cursor-not-allowed opacity-60`}>
          {plan.cta}
        </button>
      )}
    </article>
  )
}

export default function PlanesPricingPage() {
  const [interval, setInterval] = useState<BillingInterval>('month')

  useEffect(() => {
    if (window.location.hash !== '#plan-terapeuta') return
    const el = document.getElementById('plan-terapeuta')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const consumerPlans = PLANS.filter((p) => p.variant !== 'therapist')
  const therapistPlan = PLANS.find((p) => p.variant === 'therapist')

  const selectYearly = () => setInterval('year')

  return (
    <div className="space-y-12">
      <BillingToggle interval={interval} onChange={setInterval} />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {consumerPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            onSelectYearly={selectYearly}
          />
        ))}
      </div>

      {therapistPlan ? (
        <div id="plan-terapeuta" className="scroll-mt-36 grid gap-6 sm:scroll-mt-32">
          <PlanCard
            plan={therapistPlan}
            interval={interval}
            onSelectYearly={selectYearly}
          />
        </div>
      ) : null}

      <section aria-labelledby="testimonios-planes" className="rounded-[22px] border border-black/[0.06] bg-white p-6 sm:p-8">
        <h2 id="testimonios-planes" className="text-center text-2xl font-extrabold text-forest sm:text-3xl">
          Lo que dicen quienes ya usan LumaGrid
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.author}
              className="flex h-full flex-col rounded-2xl border border-black/[0.06] bg-canvas/40 p-5"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-forest/85">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 border-t border-black/[0.06] pt-4">
                <p className="text-sm font-bold text-forest">{t.author}</p>
                <p className="text-xs text-forest/60">{t.role}</p>
                <p className="mt-1 text-xs font-semibold text-violet-700">{t.plan}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="rounded-[22px] border border-black/[0.06] bg-white p-6 text-sm leading-relaxed text-forest/80 sm:p-8">
        <ul className="space-y-3">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Todos los planes de pago incluyen cancelación en cualquier momento.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Pago seguro con Stripe. Aceptamos tarjeta, Apple Pay y Google Pay.
          </li>
        </ul>
        <p className="mt-6 text-forest/75">
          ¿Dudas? Escríbenos a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-blue underline-offset-2 hover:underline">
            {CONTACT_EMAIL}
          </a>{' '}
          o{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agendar%20demo%20Plan%20Terapeuta`}
            className="font-semibold text-accent-blue underline-offset-2 hover:underline"
          >
            agenda una demo con nuestro equipo
          </a>{' '}
          (especialmente útil para el Plan Terapeuta).
        </p>
      </footer>
    </div>
  )
}
