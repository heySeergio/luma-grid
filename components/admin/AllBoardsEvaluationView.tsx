'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getProfileSimpleEvaluation } from '@/app/actions/simpleEvaluation'
import UsagePeriodPicker from '@/components/admin/UsagePeriodPicker'
import type { AdminNavProfile } from '@/components/admin/AdminPanelNav'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import type { SimpleEvaluationReport } from '@/lib/usageEvaluation/simpleEvaluationTypes'

type BoardReport = {
  profile: AdminNavProfile
  report: SimpleEvaluationReport | null
}

type Props = {
  profiles: AdminNavProfile[]
  onOpenAccountSettings: () => void
  onSelectProfile: (id: string) => void
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export default function AllBoardsEvaluationView({
  profiles,
  onOpenAccountSettings,
  onSelectProfile,
}: Props) {
  const [boardReports, setBoardReports] = useState<BoardReport[]>([])

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const rows = await Promise.all(
        profiles.map(async (profile) => {
          const report = await getProfileSimpleEvaluation(profile.id, {
            startIso: start.toISOString(),
            endIso: end.toISOString(),
          })
          return { profile, report }
        }),
      )
      setBoardReports(rows)
    },
    [profiles],
  )

  const period = useUsageReportPeriod(fetchWithRange, {
    profileId: profiles[0]?.id ?? '',
    enabled: profiles.length > 0,
  })

  useEffect(() => {
    setBoardReports([])
  }, [profiles])

  const shareDisabled = boardReports.some((row) => row.report && !row.report.shareUsageEnabled)

  return (
    <div className="space-y-5 text-sm">
      {shareDisabled ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          Algunos tableros tienen la captura de uso desactivada. Actívala en{' '}
          <button
            type="button"
            onClick={onOpenAccountSettings}
            className="font-semibold underline underline-offset-2"
          >
            Cuenta
          </button>{' '}
          para ver métricas completas.
        </p>
      ) : null}

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

      {period.loading ? (
        <div className="flex items-center gap-2 text-[var(--app-muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando métricas de todos los tableros…
        </div>
      ) : period.error ? (
        <p className="text-red-600 dark:text-red-400" role="alert">
          {period.error}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {boardReports.map(({ profile, report }) => (
            <section
              key={profile.id}
              className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] p-4 dark:border-slate-600/60"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{profile.name}</h4>
                <button
                  type="button"
                  onClick={() => onSelectProfile(profile.id)}
                  className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  Ver detalle
                </button>
              </div>
              {!report || !report.shareUsageEnabled ? (
                <p className="text-xs text-[var(--app-muted-foreground)]">Sin datos de uso en este periodo.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-[var(--app-muted-foreground)]">Días activos</dt>
                    <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {report.consistency.activeDays}/{report.consistency.totalDays}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--app-muted-foreground)]">Constancia</dt>
                    <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {pct(report.consistency.consistencyRatio)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--app-muted-foreground)]">Palabra top</dt>
                    <dd className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      {report.topWords[0]?.label ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--app-muted-foreground)]">Vocab. nuevo</dt>
                    <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {report.newVocabulary.adoptedCount}/{report.newVocabulary.introducedInPeriod}
                    </dd>
                  </div>
                </dl>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
