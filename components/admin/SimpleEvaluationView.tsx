'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getProfileSimpleEvaluation } from '@/app/actions/simpleEvaluation'
import UsagePeriodPicker from '@/components/admin/UsagePeriodPicker'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import type { SelectableEvaluationMode } from '@/lib/evaluation/mode'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'
import type { SimpleEvaluationReport } from '@/lib/usageEvaluation/simpleEvaluationTypes'

type Props = {
  profileId: string
  profileName?: string | null
  onOpenAccountSettings: () => void
  report?: SimpleEvaluationReport | null
  periodControls?: ReturnType<typeof useUsageReportPeriod>
  hidePeriodPicker?: boolean
  evaluationMode?: SelectableEvaluationMode
  onExportReady?: (payload: EvaluationExportPayload | null, loading: boolean) => void
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export default function SimpleEvaluationView({
  profileId,
  profileName = null,
  onOpenAccountSettings,
  report: externalReport,
  periodControls: externalPeriod,
  hidePeriodPicker = false,
  evaluationMode = 'SIMPLE',
  onExportReady,
}: Props) {
  const [internalData, setInternalData] = useState<SimpleEvaluationReport | null>(null)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const result = await getProfileSimpleEvaluation(profileId, {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      })
      if (!result) throw new Error('No se pudo cargar el informe.')
      setInternalData(result)
    },
    [profileId],
  )

  const internalPeriod = useUsageReportPeriod(fetchWithRange, { profileId })
  const period = externalPeriod ?? internalPeriod
  const data = externalReport !== undefined ? externalReport : internalData

  useEffect(() => {
    if (!onExportReady) return
    if (period.loading) {
      onExportReady(null, true)
      return
    }
    if (!data) {
      onExportReady(null, false)
      return
    }
    onExportReady(
      {
        profileName: profileName ?? null,
        evaluationMode,
        report: data,
      },
      false,
    )
  }, [onExportReady, period.loading, data, profileName, evaluationMode])

  if (data && !data.shareUsageEnabled) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          La captura de uso está desactivada en tu cuenta. Actívala en{' '}
          <button
            type="button"
            onClick={onOpenAccountSettings}
            className="font-semibold underline underline-offset-2"
          >
            Cuenta
          </button>{' '}
          para ver métricas de evaluación.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-sm">
      {!hidePeriodPicker ? (
        <UsagePeriodPicker
          mode={period.mode}
          setMode={period.setMode}
          preset={period.preset}
          setPreset={period.setPreset}
          customStart={period.customStart}
          setCustomStart={period.setCustomStart}
          customEnd={period.customEnd}
          setCustomEnd={period.setCustomEnd}
          onApplyCustom={() => void period.loadCustom()}
        />
      ) : null}

      {period.loading ? (
        <div className="flex items-center gap-2 text-[var(--app-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando métricas…
        </div>
      ) : period.error ? (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {period.error}
        </p>
      ) : !data ? null : (
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard title="Palabras más usadas">
            {data.topWords.length === 0 ? (
              <p className="text-[var(--app-muted-foreground)]">Sin datos en este periodo.</p>
            ) : (
              <ol className="space-y-1.5">
                {data.topWords.map((w, i) => (
                  <li key={`${w.label}-${i}`} className="flex justify-between gap-2">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {i + 1}. {w.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--app-muted-foreground)]">{w.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </MetricCard>

          <MetricCard title="Vocabulario nuevo del periodo">
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {data.newVocabulary.adoptedCount}
              <span className="text-base font-normal text-[var(--app-muted-foreground)]">
                {' '}
                / {data.newVocabulary.introducedInPeriod} adoptadas
              </span>
            </p>
            {data.newVocabulary.adoptionRate != null ? (
              <p className="mt-1 text-[var(--app-muted-foreground)]">
                Tasa de adopción: {pct(data.newVocabulary.adoptionRate)}
              </p>
            ) : (
              <p className="mt-1 text-[var(--app-muted-foreground)]">No se añadieron palabras nuevas al tablero.</p>
            )}
            {data.newVocabulary.recentWords.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {data.newVocabulary.recentWords.map((w) => (
                  <li key={w.label} className="flex items-center gap-2">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${w.adopted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      aria-hidden
                    />
                    {w.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </MetricCard>

          <MetricCard title="Constancia de uso">
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {data.consistency.activeDays}
              <span className="text-base font-normal text-[var(--app-muted-foreground)]">
                {' '}
                / {data.consistency.totalDays} días
              </span>
            </p>
            <p className="mt-1 text-[var(--app-muted-foreground)]">
              {pct(data.consistency.consistencyRatio)} del periodo con actividad ·{' '}
              {data.consistency.distinctSessions} sesiones
            </p>
            {data.consistency.activeDaysDelta != null && data.consistency.activeDaysDelta !== 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                {data.consistency.activeDaysDelta > 0 ? '+' : ''}
                {data.consistency.activeDaysDelta} días vs periodo anterior
              </p>
            ) : null}
          </MetricCard>

          <MetricCard title="Franjas horarias de uso">
            {data.hourlyUsage.every((b) => b.count === 0) ? (
              <p className="text-[var(--app-muted-foreground)]">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-2">
                {data.hourlyUsage.map((b) => {
                  const max = Math.max(...data.hourlyUsage.map((x) => x.count), 1)
                  const width = Math.round((b.count / max) * 100)
                  return (
                    <li key={b.label}>
                      <div className="mb-0.5 flex justify-between text-xs">
                        <span>{b.label}</span>
                        <span className="tabular-nums text-[var(--app-muted-foreground)]">{b.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/60">
                        <div
                          className="h-full rounded-full bg-sky-500/80 dark:bg-sky-400/70"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {data.peakHourLabel ? (
              <p className="mt-2 text-xs text-[var(--app-muted-foreground)]">
                Mayor actividad: {data.peakHourLabel.toLowerCase()}
              </p>
            ) : null}
          </MetricCard>
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] p-4 dark:border-slate-600/60">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-foreground)]">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}
