'use client'

import { useCallback, useState } from 'react'
import { Download, EyeOff, Loader2 } from 'lucide-react'
import { getProfileLexiconUsageReport } from '@/app/actions/lexiconUsage'
import { getProfileCommunicationEvaluation } from '@/app/actions/communicationEvaluation'
import UsagePeriodPicker from '@/components/admin/UsagePeriodPicker'
import { useUsageReportPeriod } from '@/lib/hooks/useUsageReportPeriod'
import type { LexiconUsageReport } from '@/lib/usageEvaluation/lexiconUsageTypes'
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

const TIER_LABEL = {
  core: 'Núcleo',
  extended: 'Periférico',
  unknown: 'Sin clasificar',
} as const

type Props = {
  profileId: string
  profileName?: string | null
  onOpenAccountSettings: () => void
}

export default function BoardLexiconUsage({ profileId, profileName = null, onOpenAccountSettings }: Props) {
  const [data, setData] = useState<LexiconUsageReport | null>(null)

  const fetchWithRange = useCallback(
    async (start: Date, end: Date) => {
      const result = await getProfileLexiconUsageReport(profileId, {
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      })
      if (!result) {
        throw new Error('No se pudo cargar el informe.')
      }
      setData(result)
    },
    [profileId],
  )

  const period = useUsageReportPeriod(fetchWithRange, { profileId })

  const handleDownloadPdf = useCallback(async () => {
    if (!data) return
    const communication = await getProfileCommunicationEvaluation(profileId, {
      startIso: data.currentRange.startIso,
      endIso: data.currentRange.endIso,
    })
    if (!communication) return
    downloadClinicalReportPdf({ communication, lexicon: data })
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
          data && !period.loading && data.shareUsageEnabled ? (
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
          Cargando vocabulario en uso…
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

              <CoreCoverageBlock stats={data.coreCoverage} />

              {data.activeVocabulary.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No hay vocabulario activo en este periodo. Usa el tablero con la opción de compartir uso activada.
                </p>
              ) : (
                <ActiveVocabularyTable items={data.activeVocabulary} />
              )}

              <AdoptionBlock adoption={data.adoption} />

              {data.frequentSequences.length > 0 ? (
                <SequencesBlock sequences={data.frequentSequences} />
              ) : null}

              {data.ignoredSymbols.length > 0 ? (
                <IgnoredBlock symbols={data.ignoredSymbols} />
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
      <p className="font-semibold">Vocabulario en uso no disponible</p>
      <p className="mt-1 text-xs leading-relaxed">
        Activa compartir pulsaciones para predicciones en{' '}
        <button
          type="button"
          onClick={onOpenAccountSettings}
          className="font-semibold underline decoration-amber-600/60 underline-offset-2"
        >
          Cuenta y preferencias
        </button>{' '}
        para registrar el vocabulario que usa el comunicador.
      </p>
    </div>
  )
}

function CoreCoverageBlock({ stats }: { stats: LexiconUsageReport['coreCoverage'] }) {
  const corePct =
    stats.coreLexemesTotal > 0
      ? Math.round((stats.coreLexemesUsed / stats.coreLexemesTotal) * 100)
      : null
  const boardCorePct =
    stats.boardCoreSymbolsTotal > 0
      ? Math.round((stats.boardCoreSymbolsUsed / stats.boardCoreSymbolsTotal) * 100)
      : null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Lexemas activos" value={stats.activeLexemeCount} />
      <StatCard
        label="Núcleo usado (catálogo)"
        value={stats.coreLexemesUsed}
        hint={corePct != null ? `${corePct}% del núcleo estándar` : undefined}
      />
      <StatCard
        label="Núcleo en tablero usado"
        value={stats.boardCoreSymbolsUsed}
        hint={boardCorePct != null ? `de ${stats.boardCoreSymbolsTotal} pictos núcleo en tablero` : undefined}
      />
      <StatCard label="Vocabulario temático usado" value={stats.thematicUsedCount} hint="Lexemas periféricos o no núcleo" />
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-3 py-2.5 dark:border-slate-600/60">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  )
}

function ActiveVocabularyTable({ items }: { items: LexiconUsageReport['activeVocabulary'] }) {
  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">Vocabulario activo</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Palabras o pictogramas pulsados en el periodo, ordenados por frecuencia. Incluye uso aunque el símbolo ya no esté en el tablero.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-600/50">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-[var(--app-surface-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Término</th>
              <th className="px-2 py-2.5 text-right font-semibold tabular-nums">Usos</th>
              <th className="px-2 py-2.5 font-semibold">Tipo</th>
              <th className="px-2 py-2.5 pl-3 font-semibold">En tablero</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={`${row.lexemeId ?? row.symbolId ?? row.label}-${i}`} className="border-t border-slate-100 dark:border-slate-700/80">
                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
                <td className="px-2 py-2 text-right tabular-nums">{row.count}</td>
                <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{TIER_LABEL[row.tier]}</td>
                <td className="px-2 py-2 pl-3 text-slate-600 dark:text-slate-400">{row.isOnBoard ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SequencesBlock({ sequences }: { sequences: LexiconUsageReport['frequentSequences'] }) {
  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">Combinaciones frecuentes</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Secuencias de 2–3 símbolos repetidas al componer frases (mínimo 2 apariciones en el periodo).
      </p>
      <ul className="space-y-1.5 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
        {sequences.map((s, i) => (
          <li key={`${s.kind}-${s.tokens.join('-')}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              &ldquo;{s.tokens.join(' + ')}&rdquo;
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                ({s.kind === 'bigram' ? '2 palabras' : '3 palabras'})
              </span>
            </span>
            <span className="tabular-nums text-slate-600 dark:text-slate-400">{s.count}×</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdoptionBlock({ adoption }: { adoption: LexiconUsageReport['adoption'] }) {
  if (adoption.introducedInPeriod === 0) {
    return (
      <div className="rounded-xl border border-slate-200/70 bg-white/40 px-4 py-3 dark:border-slate-600/50 dark:bg-slate-900/25">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Adopción de vocabulario nuevo</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          No se añadieron pictogramas nuevos al tablero en este periodo.
        </p>
      </div>
    )
  }

  const rateLabel =
    adoption.adoptionRate != null ? `${Math.round(adoption.adoptionRate * 100)}%` : '—'

  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">Adopción de vocabulario nuevo</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Símbolos añadidos al tablero en el periodo. «Adoptado» = al menos un uso en los{' '}
        {adoption.adoptionWindowDays} días siguientes (fecha de alta del picto).
      </p>
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <StatMini label="Añadidos en periodo" value={adoption.introducedInPeriod} />
        <StatMini label="Adoptados" value={adoption.adoptedCount} />
        <StatMini label="Tasa adopción" value={rateLabel} />
      </div>
      {adoption.cohort.length > 0 ? (
        <ul className="space-y-1.5 rounded-lg border border-slate-200/60 p-3 dark:border-slate-600/50">
          {adoption.cohort.map((c) => (
            <li key={c.symbolId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-200">{c.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.adopted
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                    : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {c.adopted ? 'Adoptado' : 'Sin uso'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-[var(--app-surface-muted)] px-3 py-2 dark:border-slate-600/60">
      <p className="text-xs text-[var(--app-muted-foreground)]">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function IgnoredBlock({ symbols }: { symbols: LexiconUsageReport['ignoredSymbols'] }) {
  const maxDays = Math.max(...symbols.map((s) => s.daysOnBoard), 1)

  return (
    <div>
      <h3 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-100">Palabras ignoradas</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Pictogramas visibles en el tablero sin ningún uso en el periodo. Candidatos a reposicionar o retirar.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-600/50">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-[var(--app-surface-muted)]">
            <tr>
              <th className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200">Término</th>
              <th className="px-2 py-2.5 font-semibold text-slate-700 dark:text-slate-200">Categoría</th>
              <th className="px-2 py-2.5 font-semibold text-slate-700 dark:text-slate-200">Usos en periodo</th>
              <th className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200">Tiempo en tablero</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((s) => {
              const tenurePct = Math.max(8, Math.round((s.daysOnBoard / maxDays) * 100))
              return (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700/80">
                  <td className="px-3 py-2.5">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-coral/20 bg-coral/10 text-coral dark:border-coral/30 dark:bg-coral/15"
                        aria-hidden
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="inline-flex rounded-full border border-forest/10 bg-forest/[0.06] px-2 py-0.5 text-xs font-medium text-forest dark:border-forest/25 dark:bg-forest/20 dark:text-[#c8ddd2]">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex min-w-[5.5rem] items-center gap-2">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full border border-dashed border-coral/35 bg-coral/[0.06] dark:border-coral/40 dark:bg-coral/10"
                        role="img"
                        aria-label="0 usos en el periodo"
                      />
                      <span className="shrink-0 tabular-nums text-xs font-semibold text-coral dark:text-[#f0a090]">0</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-[7.5rem] items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cta-yellow via-accent-blue/90 to-accent-blue"
                          style={{ width: `${tenurePct}%` }}
                          role="presentation"
                        />
                      </div>
                      <span className="shrink-0 tabular-nums text-xs font-medium text-slate-600 dark:text-slate-400">
                        {s.daysOnBoard} d
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
