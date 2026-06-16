'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type LumaSelectOption = {
  value: string
  label: string
}

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: LumaSelectOption[]
  /** Etiqueta accesible; si se omite, no se muestra. */
  label?: string
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export default function LumaSelect({
  id,
  value,
  onChange,
  options,
  label,
  placeholder = 'Seleccionar',
  className = '',
  triggerClassName = '',
}: Props) {
  const autoId = useId()
  const fieldId = id ?? `luma-select-${autoId}`
  const listboxId = `${fieldId}-listbox`
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((option) => option.value === value)
  const displayLabel = selected?.label ?? placeholder

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {label ? (
        <label htmlFor={fieldId} className="sr-only">
          {label}
        </label>
      ) : null}
      <button
        type="button"
        id={fieldId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        className={`app-input flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs font-semibold text-[var(--app-foreground)] sm:px-2.5 sm:text-sm ${triggerClassName}`}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--app-muted-foreground)] transition-transform sm:h-4 sm:w-4 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label ?? placeholder}
          className="ui-floating-panel absolute left-0 top-full z-[80] mt-1 max-h-[min(50vh,16rem)] min-w-full overflow-y-auto rounded-xl py-1"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value || '__empty__'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100'
                      : 'text-slate-800 hover:bg-slate-100/90 dark:text-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected ? <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
