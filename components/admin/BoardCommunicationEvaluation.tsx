'use client'

import { useCallback, useState } from 'react'
import { Download, Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getProfileCommunicationEvaluation } from '@/app/actions/communicationEvaluation'
import { getProfileLexiconUsageReport } from '@/app/actions/lexiconUsage'
import UsagePeriodPicker from '@/components/admin/UsagePeriodPicker'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import {
  formatCompositionDuration,
} from '@/lib/usageEvaluation/aggregates/communicationEvaluation'
import type { CommunicationEvaluationReport } from '@/lib/usageEvaluation/communicationEvalTypes'
import { downloadClinicalReportPdf } from '@/lib/usageEvaluation/downloadClinicalReportPdf'

function formatDateTimeShort(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

type Props = {
  profileId: string
  profileName?: string | null
  onOpenAccountSettings: () => void
}

export default function BoardCommunicationEvaluation({
  profileId,
  profileName = null,
  onOpenAccountSettings,
}: Props) {
  const [data, setData] = useState<CommunicationEvaluationReport | null>(null)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const result = await getProfileCommunicationEvaluation(profileId, {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      })
      if (!result) throw new Error('No se pudo cargar el informe.')
      setData(result)
    },
    [profileId],
  )

  const period = useUsageReportPeriod(fetchWithRange, { profileId })
  const comm = data?.communication

  const deltaBlock = (
    label: string,
    current: number | string,
    delta: number | null,
    pct: number | null,
    formatDelta?: (d: number) => string,
  ) => {
    const flat = delta == null || delta === 0
    const up = delta != null && delta > 0
    const deltaText =
      delta == null
        ? ''
        : `${delta > 0 ? '+' : ''}${formatDelta ? formatDelta(delta) : delta} vs periodo anterior${pct != null ? ` (${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)` : previousZeroLabel(delta)}`

    return (
      <div className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-3 py-2.5 dark:border-slate-600/60">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted-foreground)]">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{current}</p>
        {delta != null ? (
          <div className="mt-1 flex items-center gap-1.5 text-sm">
            {flat ? (
              <Minus className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            ) : up ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
            )}
            <span
              className={
                flat ? 'text-slate-500' : up ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'
              }
            >
              {deltaText}
            </span>
          </div>
        ) : null}
      </div>
    )
  }

  function previousZeroLabel(delta: number) {
    if (delta === 0) return ''
    return ' (sin datos en el periodo anterior)'
  }

  const handleDownloadPdf = useCallback(async () => {
    if (!data) return
    const lexicon = await getProfileLexiconUsageReport(profileId, {
      startIso: data.currentRange.startIso,
      endIso: data.currentRange.endIso,
    })
    downloadClinicalReportPdf({
      communication: data,
      lexicon,
    })
  }, [data, profileId])

  return (
    <div className="space-y-5 text-sm">
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
        trailingActions={
          data && !period.loading ? (
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              Informe clínico PDF
            </button>
          ) : null
        }
      />

      {period.loading ? (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando informe…
        </div>
      ) : null}

      {period.error ? <p className="text-sm text-amber-800 dark:text-amber-200">{period.error}</p> : null}

      {data && comm && !period.loading ? (
        <>
          {!data.shareUsageEnabled ? (
            <PrivacyBanner onOpenAccountSettings={onOpenAccountSettings} />
          ) : (
            <>
              <PeriodBanner data={data} />

              <section>
                <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Comunicación (enunciados hablados)</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {deltaBlock(
                    'Enunciados',
                    comm.summary.utteranceCount,
                    comm.deltas.utteranceCount,
                    comm.deltas.utteranceCountPercent,
                  )}
                  {deltaBlock(
                    'LME (símbolos / enunciado)',
                    comm.summary.avgSymbolsPerUtterance.toFixed(1),
                    comm.deltas.avgSymbolsPerUtterance,
                    null,
                    (d) => d.toFixed(1),
                  )}
                  {deltaBlock(
                    'Enunciados / día',
                    comm.summary.utterancesPerDay.toFixed(1),
                    comm.deltas.utterancesPerDay,
                    null,
                    (d) => d.toFixed(1),
                  )}
                  {deltaBlock(
                    'Latencia composición (media)',
                    formatCompositionDuration(comm.summary.avgCompositionMs),
                    comm.deltas.avgCompositionMs,
                    null,
                    (d) => formatCompositionDuration(Math.abs(d)),
                  )}
                </div>
                {comm.summary.utteranceCount === 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    Aún no hay enunciados registrados en este periodo. Pulsa «Hablar» en el tablero para acumular datos de LME y funciones comunicativas.
                  </p>
                ) : null}
              </section>

              {comm.communicativeFunctions.length > 0 ? (
                <section>
                  <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">Funciones comunicativas</h3>
                  <p className="mb-3 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                    Clasificación automática (estimada) según el primer símbolo o la forma del enunciado. No sustituye la evaluación profesional.
                  </p>
                  <ul className="space-y-2 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
                    {comm.communicativeFunctions.map((row) => (
                      <li key={row.function} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{row.label}</span>
                        <span className="tabular-nums text-slate-600 dark:text-slate-400">{row.count}</span>
                        <span className="w-12 text-right tabular-nums text-slate-500 dark:text-slate-400">
                          {row.percent.toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {comm.timeSeries.length > 1 ? (
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">Evolución semanal</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-600/50">
                    <table className="w-full min-w-[280px] text-left text-sm">
                      <thead className="bg-[var(--app-surface-muted)]">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">Semana</th>
                          <th className="px-2 py-2.5 text-right font-semibold tabular-nums">Enunciados</th>
                          <th className="px-2 py-2.5 pl-3 text-right font-semibold tabular-nums">LME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comm.timeSeries.map((b) => (
                          <tr key={b.bucketStartIso} className="border-t border-slate-100 dark:border-slate-700/80">
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                              {formatShortDate(b.bucketStartIso)} – {formatShortDate(b.bucketEndIso)}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">{b.utteranceCount}</td>
                            <td className="px-2 py-2 pl-3 text-right tabular-nums">{b.lme.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              <section className="border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
                <h3 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Actividad en tablero (toques)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {deltaBlock(
                    'Toques registrados',
                    data.current.totalTouches,
                    data.deltas.totalTouches,
                    data.deltas.totalTouchesPercent,
                  )}
                  {deltaBlock(
                    'Sesiones de composición (aprox.)',
                    data.current.distinctSessions,
                    data.deltas.distinctSessions,
                    data.deltas.distinctSessionsPercent,
                  )}
                </div>

                {data.current.totalTouches === 0 && data.previous.totalTouches === 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    No hay toques registrados en estos periodos.
                  </p>
                ) : (
                  <TouchDetailTables data={data} />
                )}
              </section>
            </>
          )}

          <PhrasesSection phrases={data.topPhrasesAllTime} />
        </>
      ) : null}
    </div>
  )
}

function PrivacyBanner({ onOpenAccountSettings }: { onOpenAccountSettings: () => void }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">Evaluación no disponible para desglose</p>
      <p className="mt-1 text-xs leading-relaxed">
        Tienes desactivada la opción de compartir pulsaciones. Actívala en{' '}
        <button type="button" onClick={onOpenAccountSettings} className="font-semibold underline decoration-amber-600/60 underline-offset-2">
          Cuenta y preferencias
        </button>{' '}
        para registrar enunciados y toques en este informe.
      </p>
    </div>
  )
}

function PeriodBanner({ data }: { data: CommunicationEvaluationReport }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-900/30">
      <p className="text-xs font-medium text-[var(--app-muted-foreground)]">Periodo del informe</p>
      <p className="mt-0.5 text-base font-semibold text-slate-800 dark:text-slate-100">
        {formatDateTimeShort(data.currentRange.startIso)} → {formatDateTimeShort(data.currentRange.endIso)}
      </p>
      <p className="mt-2 text-xs font-medium text-[var(--app-muted-foreground)]">Periodo de comparación (anterior)</p>
      <p className="mt-0.5 text-base text-slate-700 dark:text-slate-300">
        {formatDateTimeShort(data.previousRange.startIso)} → {formatDateTimeShort(data.previousRange.endIso)}
      </p>
    </div>
  )
}

function TouchDetailTables({ data }: { data: CommunicationEvaluationReport }) {
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-2 lg:items-start">
      {data.deltas.byCategory.length > 0 ? (
        <div className={data.current.topSymbols.length === 0 ? 'lg:col-span-2' : 'min-w-0'}>
          <h4 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">Por categoría</h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-600/50">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-[var(--app-surface-muted)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Categoría</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Actual</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Anterior</th>
                  <th className="px-2 py-2.5 pl-3 text-right font-semibold">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {data.deltas.byCategory.slice(0, 15).map((row) => (
                  <tr key={row.category} className="border-t border-slate-100 dark:border-slate-700/80">
                    <td className="px-3 py-2 font-medium">{row.category}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.currentCount}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.previousCount}</td>
                    <td className="px-2 py-2 pl-3 text-right tabular-nums">
                      {row.delta > 0 ? '+' : ''}
                      {row.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {data.current.topSymbols.length > 0 ? (
        <div className="min-w-0">
          <h4 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">Símbolos más pulsados</h4>
          <ul className="space-y-1.5 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
            {data.current.topSymbols.map((s, i) => (
              <li key={`${s.symbolId ?? 'o'}-${i}`} className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                <span className="tabular-nums text-slate-600 dark:text-slate-400">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function PhrasesSection({ phrases }: { phrases: CommunicationEvaluationReport['topPhrasesAllTime'] }) {
  return (
    <div className="border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
      <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">Frases rápidas / frecuentes</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Acumulado en la cuenta, no filtrado por fechas del informe.
      </p>
      {phrases.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">Aún no hay frases guardadas con uso.</p>
      ) : (
        <ul className="space-y-2 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
          {phrases.map((p) => (
            <li key={p.id} className="flex justify-between gap-4 text-sm">
              <span className="min-w-0 text-slate-800 dark:text-slate-200">&ldquo;{p.text}&rdquo;</span>
              <span className="tabular-nums text-slate-600 dark:text-slate-400">{p.useCount}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
