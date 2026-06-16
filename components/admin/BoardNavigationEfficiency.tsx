'use client'

import { useCallback, useState } from 'react'
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { getProfileBoardEfficiencyReport } from '@/app/actions/boardEfficiency'
import UsagePeriodPicker from '@/components/admin/UsagePeriodPicker'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import type { BoardEfficiencyReport } from '@/lib/usageEvaluation/boardEfficiencyTypes'

function formatDateTimeShort(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRatio(value: number | null, digits = 0) {
  if (value == null) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString('es-ES', { maximumFractionDigits: digits })
}

type Props = {
  profileId: string
  profileName?: string | null
  onOpenAccountSettings: () => void
}

export default function BoardNavigationEfficiency({
  profileId,
  profileName = null,
  onOpenAccountSettings,
}: Props) {
  const [data, setData] = useState<BoardEfficiencyReport | null>(null)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const result = await getProfileBoardEfficiencyReport(profileId, {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      })
      if (!result) throw new Error('No se pudo cargar el informe.')
      setData(result)
    },
    [profileId],
  )

  const period = useUsageReportPeriod(fetchWithRange, { profileId })
  const friction = data?.friction

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
      />

      {period.loading ? (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Cargando eficiencia del tablero…
        </div>
      ) : null}

      {period.error ? <p className="text-sm text-amber-800 dark:text-amber-200">{period.error}</p> : null}

      {data && !period.loading ? (
        <>
          {!data.shareUsageEnabled ? (
            <PrivacyBanner onOpenAccountSettings={onOpenAccountSettings} />
          ) : (
            <>
              <div className="rounded-xl border border-slate-200/70 bg-white/50 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-900/30">
                <p className="text-xs font-medium text-[var(--app-muted-foreground)]">Periodo del informe</p>
                <p className="mt-0.5 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {formatDateTimeShort(data.currentRange.startIso)} → {formatDateTimeShort(data.currentRange.endIso)}
                </p>
              </div>

              {friction && friction.totalEvents === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Aún no hay eventos de navegación en este periodo. Usa carpetas, volver atrás o correcciones en el tablero.
                </p>
              ) : friction ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Acciones de navegación"
                      value={friction.totalEvents}
                      hint={`${formatNumber(friction.navigationEventsPerDay)} / día`}
                      delta={data.deltas.totalEventsPercent}
                      deltaSuffix="%"
                    />
                    <StatCard
                      label="Ratio retirada"
                      value={formatRatio(friction.retreatRatio)}
                      hint="(atrás + inicio) / entradas en carpeta"
                      delta={data.deltas.retreatRatio != null ? data.deltas.retreatRatio * 100 : null}
                      deltaSuffix=" pp"
                    />
                    <StatCard
                      label="Correcciones"
                      value={friction.correctionCount}
                      hint={
                        friction.avgPhraseLengthOnCorrection != null
                          ? `Media ${formatNumber(friction.avgPhraseLengthOnCorrection)} símb. al corregir`
                          : undefined
                      }
                    />
                    <StatCard
                      label="Correcciones / enunciado"
                      value={
                        friction.correctionsPerUtterance != null
                          ? formatNumber(friction.correctionsPerUtterance, 2)
                          : '—'
                      }
                      hint="Borrar último + vaciar frase"
                      delta={
                        data.deltas.correctionsPerUtterance != null
                          ? data.deltas.correctionsPerUtterance
                          : null
                      }
                    />
                  </div>

                  {data.actionBreakdown.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">
                        Desglose por acción
                      </h3>
                      <ul className="space-y-1.5 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
                        {data.actionBreakdown.map((row) => (
                          <li
                            key={row.action}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200">{row.label}</span>
                            <span className="tabular-nums text-slate-600 dark:text-slate-400">
                              {row.count}{' '}
                              <span className="text-xs">({Math.round(row.percent)}%)</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Un ratio de retirada alto puede indicar dificultad para encontrar pictogramas. Las correcciones
                    frecuentes sugieren fricción al componer mensajes. Estas métricas son orientativas, no un diagnóstico.
                  </p>
                </>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  )
}

function PrivacyBanner({ onOpenAccountSettings }: { onOpenAccountSettings: () => void }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">Eficiencia del tablero no disponible</p>
      <p className="mt-1 text-xs leading-relaxed">
        Activa compartir pulsaciones para predicciones en{' '}
        <button
          type="button"
          onClick={onOpenAccountSettings}
          className="font-semibold underline decoration-amber-600/60 underline-offset-2"
        >
          Cuenta y preferencias
        </button>{' '}
        para registrar navegación y correcciones en el tablero.
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  delta,
  deltaSuffix = '',
}: {
  label: string
  value: string | number
  hint?: string
  delta?: number | null
  deltaSuffix?: string
}) {
  const flat = delta == null || delta === 0
  const up = delta != null && delta > 0

  return (
    <div className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-3 py-2.5 dark:border-slate-600/60">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      {delta != null ? (
        <div className="mt-1 flex items-center gap-1 text-xs font-medium">
          {flat ? (
            <Minus className="h-3 w-3 text-slate-400" aria-hidden />
          ) : up ? (
            <TrendingUp className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden />
          ) : (
            <TrendingDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
          )}
          {delta > 0 ? '+' : ''}
          {typeof delta === 'number' ? formatNumber(delta, deltaSuffix === '%' ? 0 : 2) : delta}
          {deltaSuffix} vs periodo anterior
        </div>
      ) : null}
    </div>
  )
}

