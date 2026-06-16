'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  Check,
  Eye,
  Heart,
  Info,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
} from 'lucide-react'
import { setProfileEvaluationMode } from '@/app/actions/evaluationMode'
import {
  EVALUATION_MODE_LABELS,
  type SelectableEvaluationMode,
} from '@/lib/evaluation/mode'

type Props = {
  profileId: string
  onModeSelected: (mode: SelectableEvaluationMode) => void
  fillHeight?: boolean
}

const MODE_COPY: Record<
  SelectableEvaluationMode,
  {
    description: string
    selectLabel: string
    pill: { icon: typeof Heart; label: string; className: string }
  }
> = {
  NONE: {
    description: 'El tablero es solo para hablar; no se registra ni analiza nada.',
    selectLabel: 'Elegir solo comunicación',
    pill: {
      icon: Heart,
      label: 'Privacidad total',
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300',
    },
  },
  SIMPLE: {
    description: 'Métricas clave para entender los patrones de comunicación.',
    selectLabel: 'Elegir evaluación sencilla',
    pill: {
      icon: Check,
      label: 'Datos simples y claros',
      className: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    },
  },
  FULL: {
    description: 'Métricas + interpretación clara y sugerencias para apoyar.',
    selectLabel: 'Elegir evaluación completa',
    pill: {
      icon: Sparkles,
      label: 'Lectura orientativa',
      className: 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    },
  },
}

const MODE_PERKS: Partial<Record<SelectableEvaluationMode, string[]>> = {
  SIMPLE: [
    'Palabras más usadas del periodo',
    'Vocabulario nuevo y tasa de adopción',
    'Constancia de uso (días activos)',
    'Franjas horarias de actividad',
    'Periodos de 7, 30 o 90 días',
  ],
  FULL: [
    'Todo lo de evaluación sencilla',
    'Lectura orientativa sobre los datos',
    'Sugerencias accionables para el tablero',
    'Informe detallado: vocabulario, comunicación y navegación',
    'Descarga de informe en PDF',
  ],
}

const SELECT_BUTTON_CLASS: Record<SelectableEvaluationMode, string> = {
  NONE:
    'border border-slate-300/90 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  SIMPLE:
    'border border-emerald-600/90 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500',
  FULL:
    'border border-violet-600/90 bg-violet-600 text-white hover:bg-violet-700 dark:border-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500',
}

function ModeIllustrationImage({
  src,
  priority,
  widthClass = 'w-1/2',
}: {
  src: string
  priority?: boolean
  widthClass?: string
}) {
  return (
    <div className={`relative mx-auto aspect-[4/3] shrink-0 opacity-90 ${widthClass}`} aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        className="object-contain object-center"
        sizes="(max-width: 1024px) 45vw, 220px"
        priority={priority}
      />
    </div>
  )
}

function NoneIllustration() {
  return (
    <ModeIllustrationImage
      src="/evaluation/modo-solo-comunicacion.png"
      priority
      widthClass="w-[65%]"
    />
  )
}

function SimpleIllustration() {
  return <ModeIllustrationImage src="/evaluation/modo-evaluacion-sencilla.png" />
}

function FullIllustration() {
  return <ModeIllustrationImage src="/evaluation/modo-evaluacion-completa.png" />
}

const ICON_BADGE: Record<
  SelectableEvaluationMode,
  { icon: typeof MessageSquare; badgeClass: string; iconClass: string }
> = {
  NONE: {
    icon: MessageSquare,
    badgeClass: 'bg-slate-400 dark:bg-slate-600',
    iconClass: 'text-white',
  },
  SIMPLE: {
    icon: Eye,
    badgeClass: 'bg-emerald-500 dark:bg-emerald-600',
    iconClass: 'text-white',
  },
  FULL: {
    icon: Sparkles,
    badgeClass: 'bg-violet-500 dark:bg-violet-600',
    iconClass: 'fill-yellow-400 text-yellow-400',
  },
}

const CARD_SURFACE: Record<SelectableEvaluationMode, string> = {
  NONE: 'border-slate-200/90 bg-slate-50/60 dark:border-slate-600/70 dark:bg-slate-900/35',
  SIMPLE: 'border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-slate-900/40',
  FULL: 'border-violet-400 bg-white ring-1 ring-violet-400/30 dark:border-violet-600 dark:bg-slate-900/40 dark:ring-violet-600/25',
}

function ModeIllustration({ mode }: { mode: SelectableEvaluationMode }) {
  if (mode === 'NONE') return <NoneIllustration />
  if (mode === 'SIMPLE') return <SimpleIllustration />
  return <FullIllustration />
}

function ModePerksList({ mode }: { mode: SelectableEvaluationMode }) {
  const perks = MODE_PERKS[mode]
  if (!perks?.length) return null

  const checkClass =
    mode === 'FULL'
      ? 'text-violet-600 dark:text-violet-400'
      : 'text-emerald-600 dark:text-emerald-400'

  return (
    <ul className="shrink-0 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
      {perks.map((perk) => (
        <li key={perk} className="flex items-start gap-2 leading-snug">
          <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${checkClass}`} strokeWidth={2.5} aria-hidden />
          {perk}
        </li>
      ))}
    </ul>
  )
}

type ModeCardProps = {
  mode: SelectableEvaluationMode
  busy: boolean
  disabled: boolean
  fillHeight: boolean
  onSelect: (mode: SelectableEvaluationMode) => void
}

function ModeCard({ mode, busy, disabled, fillHeight, onSelect }: ModeCardProps) {
  const labels = EVALUATION_MODE_LABELS[mode]
  const copy = MODE_COPY[mode]
  const badge = ICON_BADGE[mode]
  const BadgeIcon = badge.icon
  const PillIcon = copy.pill.icon
  const recommended = mode === 'FULL'

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 ${CARD_SURFACE[mode]} ${fillHeight ? 'min-h-0 h-full' : ''}`}
    >
      {recommended ? (
        <span className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-violet-600">
          <Star className="h-3 w-3 fill-amber-200 text-amber-200" aria-hidden />
          Recomendado
        </span>
      ) : null}

      <div className="flex shrink-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${badge.badgeClass}`}
        >
          <BadgeIcon className={`h-5 w-5 ${badge.iconClass}`} strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="font-semibold leading-tight text-slate-900 dark:text-slate-100">{labels.title}</p>
          <p className="mt-0.5 text-xs text-[var(--app-muted-foreground)]">{labels.subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 justify-center py-0.5">
        <ModeIllustration mode={mode} />
      </div>

      <p className="shrink-0 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{copy.description}</p>

      <ModePerksList mode={mode} />

      <span
        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${copy.pill.className}`}
      >
        <PillIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {copy.pill.label}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(mode)}
        className={`mt-auto w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${SELECT_BUTTON_CLASS[mode]}`}
      >
        {busy ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Guardando…
          </span>
        ) : (
          copy.selectLabel
        )}
      </button>

      {busy ? (
        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/40 dark:bg-slate-900/40" aria-hidden />
      ) : null}
    </article>
  )
}

export default function EvaluationModePicker({ profileId, onModeSelected, fillHeight = false }: Props) {
  const [saving, setSaving] = useState<SelectableEvaluationMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (mode: SelectableEvaluationMode) => {
    setSaving(mode)
    setError(null)
    const result = await setProfileEvaluationMode(profileId, mode)
    setSaving(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onModeSelected(mode)
  }

  const modes: SelectableEvaluationMode[] = ['NONE', 'SIMPLE', 'FULL']
  const disabled = saving != null

  return (
    <div className={`flex flex-col gap-5 ${fillHeight ? 'min-h-0 flex-1' : ''}`}>
      <p className="shrink-0 text-sm text-[var(--app-muted-foreground)]">
        Elige cuánto análisis quieres recibir como adulto.
      </p>

      <div className={`grid gap-4 lg:grid-cols-3 ${fillHeight ? 'min-h-0 flex-1 auto-rows-fr' : ''}`}>
        {modes.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            busy={saving === mode}
            disabled={disabled}
            fillHeight={fillHeight}
            onSelect={(m) => void handleSelect(m)}
          />
        ))}
      </div>

      {error ? (
        <p className="shrink-0 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <p className="flex shrink-0 items-start gap-2 text-xs leading-relaxed text-[var(--app-muted-foreground)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
        Esta configuración solo afecta a los reportes que ve el adulto. El tablero siempre es para comunicarse.
      </p>
    </div>
  )
}
