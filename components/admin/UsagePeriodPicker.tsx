'use client'

import type { ReactNode } from 'react'
import LumaDateTimePicker, { formatDateTimeLocalValue } from '@/components/ui/LumaDateTimePicker'
import type { UsageRangePreset } from '@/lib/usageEvaluation/ranges'

type Props = {
  mode: 'preset' | 'custom'
  setMode: (mode: 'preset' | 'custom') => void
  preset: UsageRangePreset
  setPreset: (preset: UsageRangePreset) => void
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
  onApplyCustom: () => void
  trailingActions?: ReactNode
}

export default function UsagePeriodPicker({
  mode,
  setMode,
  preset,
  setPreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onApplyCustom,
  trailingActions,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Periodo
          </span>
          <div className="flex flex-wrap gap-2">
            <PresetButton active={mode === 'preset' && preset === 'last7'} label="Últimos 7 días" onSelect={() => { setMode('preset'); setPreset('last7') }} />
            <PresetButton active={mode === 'preset' && preset === 'last30'} label="Últimos 30 días" onSelect={() => { setMode('preset'); setPreset('last30') }} />
            <PresetButton active={mode === 'preset' && preset === 'last90'} label="Últimos 90 días" onSelect={() => { setMode('preset'); setPreset('last90') }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
          {trailingActions}
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
            <LumaDateTimePicker label="Desde" value={customStart} onChange={setCustomStart} max={formatDateTimeLocalValue(new Date())} />
          </div>
          <div className="min-w-0 flex-1">
            <LumaDateTimePicker label="Hasta" value={customEnd} onChange={setCustomEnd} min={customStart || undefined} max={formatDateTimeLocalValue(new Date())} />
          </div>
          <button type="button" onClick={onApplyCustom} className="ui-primary-button shrink-0 rounded-xl px-4 py-2 text-sm font-semibold">
            Aplicar
          </button>
        </div>
      ) : null}
    </>
  )
}

function PresetButton({ active, label, onSelect }: { active: boolean; label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-indigo-600 text-white' : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function PresetGroup({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
