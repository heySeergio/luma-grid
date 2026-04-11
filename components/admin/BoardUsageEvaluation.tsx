'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getProfileBoardUsageEvaluation } from '@/app/actions/usageEvaluation'
import type { BoardUsageEvaluationResult } from '@/lib/usageEvaluation/types'
import {
  presetToRange,
  USAGE_EVAL_MAX_RANGE_MS,
  type UsageRangePreset,
} from '@/lib/usageEvaluation/ranges'
import LumaDateTimePicker, { formatDateTimeLocalValue } from '@/components/ui/LumaDateTimePicker'
import { downloadBoardUsageEvaluationPdf } from '@/lib/usageEvaluation/downloadEvaluationPdf'

function formatDateTimeShort(d: Date) {
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  profileId: string
  isDemo: boolean
  onOpenAccountSettings: () => void
}

export default function BoardUsageEvaluation({
  profileId,
  isDemo,
  onOpenAccountSettings,
}: Props) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [preset, setPreset] = useState<UsageRangePreset>('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<BoardUsageEvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      if (!profileId) return
      setLoading(true)
      setError(null)
      try {
        const result = await getProfileBoardUsageEvaluation(profileId, {
          startIso: start.toISOString(),
          endIso: end.toISOString(),
        })
        if (!result) {
          setError('No se pudo cargar el informe.')
          setData(null)
        } else {
          setData(result)
        }
      } catch {
        setError('Error al cargar el informe.')
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [profileId],
  )

  const loadPreset = useCallback(async () => {
    const anchor = new Date()
    const { start, end } = presetToRange(preset, anchor)
    await fetchWithRange(start, end)
  }, [preset, fetchWithRange])

  const loadCustom = useCallback(async () => {
    const s = customStart ? new Date(customStart) : null
    const e = customEnd ? new Date(customEnd) : null
    if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      setError('Indica fecha y hora de inicio y fin válidas.')
      return
    }
    if (s >= e) {
      setError('El inicio debe ser anterior al fin.')
      return
    }
    if (e.getTime() - s.getTime() > USAGE_EVAL_MAX_RANGE_MS) {
      setError('El periodo no puede superar 90 días.')
      return
    }
    setError(null)
    await fetchWithRange(s, e)
  }, [customStart, customEnd, fetchWithRange])

  useEffect(() => {
    if (mode !== 'preset') return
    void loadPreset()
  }, [profileId, mode, preset, loadPreset])

  const deltaBlock = (label: string, current: number, delta: number, pct: number | null) => {
    const up = delta > 0
    const flat = delta === 0
    return (
      <div className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-3 py-2.5 dark:border-slate-600/60">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted-foreground)]">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{current}</p>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          {flat ? (
            <Minus className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          ) : up ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
          )}
          <span className={flat ? 'text-slate-500' : up ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'}>
            {delta > 0 ? '+' : ''}
            {delta} vs periodo anterior
            {pct != null ? ` (${pct > 0 ? '+' : ''}${pct.toFixed(0)}%)` : previousZeroLabel(delta)}
          </span>
        </div>
      </div>
    )
  }

  function previousZeroLabel(delta: number) {
    if (delta === 0) return ''
    return ' (sin datos en el periodo anterior)'
  }

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Periodo</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('preset')
                setPreset('last7')
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'preset' && preset === 'last7'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('preset')
                setPreset('last30')
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'preset' && preset === 'last30'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('preset')
                setPreset('last90')
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'preset' && preset === 'last90'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              Últimos 90 días
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
          {data && !loading ? (
            <button
              type="button"
              onClick={() => downloadBoardUsageEvaluationPdf(data, { isDemo })}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              Descargar Evaluación en PDF
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMode(mode === 'custom' ? 'preset' : 'custom')}
            className="text-xs font-semibold text-indigo-600 underline decoration-indigo-400/60 underline-offset-2 dark:text-indigo-300"
          >
            {mode === 'custom' ? 'Usar periodos rápidos' : 'Rango personalizado (hasta 90 días)'}
          </button>
        </div>
      </div>

      {mode === 'custom' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 p-3 dark:border-slate-600/60 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <LumaDateTimePicker
              label="Desde"
              value={customStart}
              onChange={setCustomStart}
              max={formatDateTimeLocalValue(new Date())}
            />
          </div>
          <div className="min-w-0 flex-1">
            <LumaDateTimePicker
              label="Hasta"
              value={customEnd}
              onChange={setCustomEnd}
              min={customStart || undefined}
              max={formatDateTimeLocalValue(new Date())}
            />
          </div>
          <button type="button" onClick={() => void loadCustom()} className="ui-primary-button shrink-0 rounded-xl px-4 py-2 text-sm font-semibold">
            Aplicar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando informe…
        </div>
      ) : null}

      {error ? <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p> : null}

      {data && !loading ? (
        <>
          {!data.shareUsageEnabled ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-semibold">Uso del tablero no disponible para desglose</p>
              <p className="mt-1 text-xs leading-relaxed">
                Tienes desactivada la opción de compartir pulsaciones para predicciones. Actívala en{' '}
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="font-semibold underline decoration-amber-600/60 underline-offset-2"
                >
                  Cuenta y preferencias
                </button>{' '}
                para registrar toques y poder ver categorías y símbolos más usados en este informe.
              </p>
            </div>
          ) : null}

          {isDemo ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tablero de demostración: los datos reflejan solo la actividad registrada en este tablero si existe.
            </p>
          ) : null}

          {data.shareUsageEnabled ? (
            <>
              <div className="rounded-xl border border-slate-200/70 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-900/30">
                <p className="text-xs font-medium text-[var(--app-muted-foreground)]">Periodo del informe</p>
                <p className="mt-0.5 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {formatDateTimeShort(new Date(data.currentRange.startIso))} → {formatDateTimeShort(new Date(data.currentRange.endIso))}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--app-muted-foreground)]">Periodo de comparación (anterior)</p>
                <p className="mt-0.5 text-base text-slate-700 dark:text-slate-300">
                  {formatDateTimeShort(new Date(data.previousRange.startIso))} → {formatDateTimeShort(new Date(data.previousRange.endIso))}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {deltaBlock(
                  'Toques registrados',
                  data.current.totalTouches,
                  data.deltas.totalTouches,
                  data.deltas.totalTouchesPercent,
                )}
                {deltaBlock(
                  'Sesiones de frase (aprox.)',
                  data.current.distinctSessions,
                  data.deltas.distinctSessions,
                  data.deltas.distinctSessionsPercent,
                )}
              </div>

              {data.current.totalTouches === 0 && data.previous.totalTouches === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No hay actividad registrada en estos periodos. Usa el tablero con la opción de compartir uso activada para acumular datos.
                </p>
              ) : (
                <>
                  {data.deltas.byCategory.length > 0 || data.current.topSymbols.length > 0 ? (
                    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
                      {data.deltas.byCategory.length > 0 ? (
                        <div
                          className={`min-w-0 ${data.current.topSymbols.length === 0 ? 'lg:col-span-2' : ''}`}
                        >
                          <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
                            Por categoría de símbolo
                          </h3>
                          <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-600/50">
                            <table className="w-full min-w-[280px] text-left text-sm">
                              <thead className="bg-[var(--app-surface-muted)]">
                                <tr>
                                  <th className="whitespace-nowrap px-3 py-2.5 pr-4 font-semibold">Categoría</th>
                                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums">
                                    Este periodo
                                  </th>
                                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums">
                                    Anterior
                                  </th>
                                  <th className="whitespace-nowrap px-2 py-2.5 pl-3 text-right font-semibold tabular-nums">
                                    Cambio
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.deltas.byCategory.slice(0, 20).map((row) => (
                                  <tr key={row.category} className="border-t border-slate-100 dark:border-slate-700/80">
                                    <td className="px-3 py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">
                                      {row.category}
                                    </td>
                                    <td className="px-2 py-2 text-right tabular-nums">{row.currentCount}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{row.previousCount}</td>
                                    <td className="px-2 py-2 pl-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
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
                        <div
                          className={`min-w-0 ${data.deltas.byCategory.length === 0 ? 'lg:col-span-2' : ''}`}
                        >
                          <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
                            Símbolos más pulsados
                          </h3>
                          <ul className="w-full space-y-1.5 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
                            {data.current.topSymbols.map((s, i) => (
                              <li
                                key={`${s.symbolId ?? 'o'}-${s.label}-${i}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0 text-sm"
                              >
                                <span className="min-w-0 font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                                <span className="justify-self-end tabular-nums text-slate-600 dark:text-slate-400">
                                  {s.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : null}

          <div className="border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
            <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-slate-100">Frases rápidas / frecuentes</h3>
            <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Ordenadas por veces usadas en total (acumulado en la cuenta), no filtradas por las fechas del informe.
            </p>
            {data.topPhrasesAllTime.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">Aún no hay frases guardadas con uso.</p>
            ) : (
              <ul className="w-full space-y-2 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
                {data.topPhrasesAllTime.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0 text-sm"
                  >
                    <span className="min-w-0 text-slate-800 dark:text-slate-200">&ldquo;{p.text}&rdquo;</span>
                    <span className="justify-self-end tabular-nums text-slate-600 dark:text-slate-400">
                      {p.useCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
