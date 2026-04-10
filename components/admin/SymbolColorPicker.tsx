'use client'

import { useEffect, useId, useState } from 'react'
import {
  EXTRA_SYMBOL_HEX_SWATCHES,
  isHexColor,
  normalizeSymbolColor,
  PRESET_SYMBOL_COLORS,
  resolveSymbolColor,
} from '@/lib/ui/symbolColors'

type Props = {
  color: string
  onChange: (color: string) => void
}

export function SymbolColorPicker({ color, onChange }: Props) {
  const normalized = normalizeSymbolColor(color)
  const hexFieldId = useId()
  const [hexDraft, setHexDraft] = useState('')

  useEffect(() => {
    setHexDraft(isHexColor(normalized) ? normalized : '')
  }, [normalized])

  const commitHexFromDraft = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setHexDraft('')
      return
    }
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (isHexColor(withHash)) {
      const lower = withHash.toLowerCase()
      onChange(lower)
      setHexDraft(lower)
    } else {
      setHexDraft(isHexColor(normalized) ? normalized : '')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_SYMBOL_COLORS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`h-9 w-9 rounded-full border-2 transition ${
              normalized === preset.value
                ? 'scale-105 border-slate-900 dark:border-slate-100'
                : 'border-white hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-500'
            }`}
            style={{ backgroundColor: preset.cssVar }}
            aria-label={`Seleccionar color ${preset.value}`}
          />
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Más colores
        </p>
        <div className="ui-floating-panel grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded-2xl p-2 sm:max-h-40 sm:grid-cols-10">
          {EXTRA_SYMBOL_HEX_SWATCHES.map((hex) => {
            const selected =
              isHexColor(normalized) && normalized.toLowerCase() === hex.toLowerCase()
            return (
              <button
                key={hex}
                type="button"
                onClick={() => onChange(hex)}
                className={`size-5 shrink-0 justify-self-center rounded-md border transition ${
                  selected
                    ? 'border-slate-900 ring-1 ring-slate-900 ring-offset-1 ring-offset-[var(--app-surface-elevated)] dark:border-slate-100 dark:ring-slate-100 dark:ring-offset-[var(--app-surface-elevated)]'
                    : 'border-[var(--app-border)] hover:border-slate-400 dark:hover:border-slate-500'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Seleccionar color ${hex}`}
              />
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div
          className="h-10 w-10 shrink-0 rounded-xl border border-[var(--app-border)] shadow-inner"
          style={{ backgroundColor: resolveSymbolColor(color) }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={hexFieldId} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Hex personalizado
          </label>
          <input
            id={hexFieldId}
            type="text"
            autoComplete="off"
            spellCheck={false}
            className="app-input w-full rounded-xl px-3 py-2 font-mono text-sm"
            placeholder="#475569"
            value={hexDraft}
            onChange={(e) => {
              const next = e.target.value
              setHexDraft(next)
              const trimmed = next.trim()
              const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
              if (isHexColor(withHash)) {
                onChange(withHash.toLowerCase())
              }
            }}
            onBlur={() => commitHexFromDraft(hexDraft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitHexFromDraft(hexDraft)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
        </div>
        <span className="break-all font-mono text-sm text-slate-500 sm:max-w-[12rem] sm:pb-2 dark:text-slate-400">
          {normalized}
        </span>
      </div>
    </div>
  )
}
