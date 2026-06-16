'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { getProfileFullEvaluation } from '@/app/actions/simpleEvaluation'
import BoardCommunicationEvaluation from '@/components/admin/BoardCommunicationEvaluation'
import BoardLexiconUsage from '@/components/admin/BoardLexiconUsage'
import BoardNavigationEfficiency from '@/components/admin/BoardNavigationEfficiency'
import SimpleEvaluationView from '@/components/admin/SimpleEvaluationView'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import type { EvaluationExportPayload } from '@/lib/usageEvaluation/evaluationExportTypes'
import type { FullEvaluationReport } from '@/lib/usageEvaluation/simpleEvaluationTypes'

type Props = {
  profileId: string
  profileName?: string | null
  onOpenAccountSettings: () => void
  onExportReady?: (payload: EvaluationExportPayload | null, loading: boolean) => void
}

export default function FullEvaluationView({
  profileId,
  profileName = null,
  onOpenAccountSettings,
  onExportReady,
}: Props) {
  const [data, setData] = useState<FullEvaluationReport | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const result = await getProfileFullEvaluation(profileId, {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      })
      if (!result) throw new Error('No se pudo cargar el informe.')
      setData(result)
    },
    [profileId],
  )

  const period = useUsageReportPeriod(fetchWithRange, { profileId })

  useEffect(() => {
    if (!onExportReady) return
    if (period.loading) {
      onExportReady(null, true)
      return
    }
    if (!data?.simple) {
      onExportReady(null, false)
      return
    }
    onExportReady(
      {
        profileName: profileName ?? null,
        evaluationMode: 'FULL',
        report: data.simple,
        insights: data.insights,
        detailed: data.detailed,
      },
      false,
    )
  }, [onExportReady, period.loading, data, profileName])

  return (
    <div className="space-y-6">
      <SimpleEvaluationView
        profileId={profileId}
        profileName={profileName}
        onOpenAccountSettings={onOpenAccountSettings}
        report={data?.simple ?? null}
        periodControls={period}
        hidePeriodPicker={false}
      />

      {data && data.insights.length > 0 ? (
        <section className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-800/50 dark:bg-violet-950/20">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lectura orientativa</h3>
            <span className="text-xs text-[var(--app-muted-foreground)]">(interpretación estimada)</span>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {data.insights.map((insight) => (
              <li key={insight.id} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                {insight.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200/80 dark:border-slate-600/60">
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
          aria-expanded={detailOpen}
        >
          Informe detallado
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition ${detailOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {detailOpen ? (
          <div className="space-y-8 border-t border-slate-200/80 px-4 py-4 dark:border-slate-600/60">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-foreground)]">
                Vocabulario en uso
              </h4>
              <BoardLexiconUsage
                profileId={profileId}
                profileName={profileName}
                onOpenAccountSettings={onOpenAccountSettings}
              />
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-foreground)]">
                Comportamiento comunicativo
              </h4>
              <BoardCommunicationEvaluation
                profileId={profileId}
                profileName={profileName}
                onOpenAccountSettings={onOpenAccountSettings}
              />
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted-foreground)]">
                Eficiencia de navegación
              </h4>
              <BoardNavigationEfficiency
                profileId={profileId}
                profileName={profileName}
                onOpenAccountSettings={onOpenAccountSettings}
              />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
