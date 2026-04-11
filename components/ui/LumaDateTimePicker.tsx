'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/** Valor compatible con el antiguo `datetime-local` (zona local). */
export function formatDateTimeLocalValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

export function parseDateTimeLocal(s: string): Date | null {
  if (!s.trim()) return null
  const [datePart, timePart] = s.split('T')
  if (!datePart || !timePart) return null
  const [y, mo, d] = datePart.split('-').map((x) => Number(x))
  const [h, mi] = timePart.split(':').map((x) => Number(x))
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isWeekendIndex(colIndex: number) {
  return colIndex === 5 || colIndex === 6
}

type Cell = { date: Date; inCurrentMonth: boolean }

function buildMonthCells(viewYear: number, viewMonth: number): Cell[] {
  const first = new Date(viewYear, viewMonth, 1)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: Cell[] = []

  const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate()
  for (let i = 0; i < startPad; i++) {
    const day = prevMonthLast - startPad + i + 1
    cells.push({ date: new Date(viewYear, viewMonth - 1, day), inCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inCurrentMonth: true })
  }
  const rest = 42 - cells.length
  for (let d = 1; d <= rest; d++) {
    cells.push({ date: new Date(viewYear, viewMonth + 1, d), inCurrentMonth: false })
  }
  return cells
}

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  id?: string
  /** Valor mínimo inclusive (`yyyy-MM-ddTHH:mm` local). */
  min?: string
  /** Valor máximo inclusive. */
  max?: string
}

export default function LumaDateTimePicker({ label, value, onChange, id, min, max }: Props) {
  const autoId = useId()
  const fieldId = id ?? `luma-dt-${autoId}`
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const parsed = parseDateTimeLocal(value)
  const now = new Date()
  const initialView = parsed ?? now
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
  }, [value])

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

  const minD = min ? parseDateTimeLocal(min) : null
  const maxD = max ? parseDateTimeLocal(max) : null

  const isDisabledDay = useCallback(
    (d: Date) => {
      if (minD && endOfDay(d) < minD) return true
      if (maxD && startOfDay(d) > maxD) return true
      return false
    },
    [minD, maxD],
  )

  const cells = buildMonthCells(viewYear, viewMonth)

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const selectDay = (d: Date) => {
    if (isDisabledDay(d)) return
    const h = parsed?.getHours() ?? now.getHours()
    const mi = parsed?.getMinutes() ?? now.getMinutes()
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi, 0, 0)
    if (minD && next < minD) {
      onChange(formatDateTimeLocalValue(minD))
      return
    }
    if (maxD && next > maxD) {
      onChange(formatDateTimeLocalValue(maxD))
      return
    }
    onChange(formatDateTimeLocalValue(next))
  }

  const setTime = (hour: number, minute: number) => {
    const base = parsed ?? now
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0, 0)
    if (minD && next < minD) {
      onChange(formatDateTimeLocalValue(minD))
      return
    }
    if (maxD && next > maxD) {
      onChange(formatDateTimeLocalValue(maxD))
      return
    }
    onChange(formatDateTimeLocalValue(next))
  }

  const displayLabel = value.trim()
    ? formatDateTimeShort(parsed ?? now)
    : 'Elegir fecha y hora'

  return (
    <div ref={rootRef} className="relative flex w-full min-w-0 flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <button
        type="button"
        id={fieldId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="app-input flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--app-foreground)]"
      >
        <span className={value.trim() ? '' : 'text-[var(--app-muted-foreground)]'}>{displayLabel}</span>
        <Calendar className="h-4 w-4 shrink-0 text-indigo-500 opacity-80 dark:text-indigo-400" aria-hidden />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`Calendario: ${label}`}
          className="absolute left-0 top-full z-[80] mt-1 w-[min(100%,20rem)] rounded-2xl border border-slate-200/90 bg-[var(--app-bg)] p-3 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] dark:border-slate-600/70 dark:bg-slate-900 dark:shadow-black/40"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="ui-icon-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-0 flex-1 text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
              {MONTH_NAMES[viewMonth]} de {viewYear}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              className="ui-icon-button flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, idx) => {
              const col = idx % 7
              const selected = parsed && sameDay(cell.date, parsed)
              const isToday = sameDay(cell.date, now)
              const disabled = isDisabledDay(cell.date)
              const weekend = isWeekendIndex(col)
              return (
                <button
                  key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}-${idx}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(cell.date)}
                  className={[
                    'flex h-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition',
                    !cell.inCurrentMonth ? 'text-slate-400/70 dark:text-slate-500' : '',
                    cell.inCurrentMonth && weekend && !selected ? 'text-rose-600/90 dark:text-rose-400/90' : '',
                    cell.inCurrentMonth && !weekend && !selected ? 'text-slate-800 dark:text-slate-100' : '',
                    selected
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/80 dark:bg-indigo-500'
                      : 'hover:bg-[var(--app-hover)]',
                    isToday && !selected ? 'ring-1 ring-indigo-400/50 dark:ring-indigo-500/40' : '',
                    disabled ? 'cursor-not-allowed opacity-35 hover:bg-transparent' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {cell.date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-600/60">
            <Clock className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            <label className="sr-only" htmlFor={`${fieldId}-h`}>
              Hora
            </label>
            <input
              id={`${fieldId}-h`}
              type="number"
              min={0}
              max={23}
              value={parsed ? parsed.getHours() : ''}
              placeholder="H"
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isNaN(v)) return
                const h = Math.min(23, Math.max(0, Math.floor(v)))
                const mi = parsed?.getMinutes() ?? 0
                setTime(h, mi)
              }}
              className="app-input w-14 rounded-lg px-2 py-1.5 text-center text-sm tabular-nums"
            />
            <span className="text-slate-500">:</span>
            <label className="sr-only" htmlFor={`${fieldId}-m`}>
              Minutos
            </label>
            <input
              id={`${fieldId}-m`}
              type="number"
              min={0}
              max={59}
              value={parsed ? parsed.getMinutes() : ''}
              placeholder="M"
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isNaN(v)) return
                const mi = Math.min(59, Math.max(0, Math.floor(v)))
                const h = parsed?.getHours() ?? now.getHours()
                setTime(h, mi)
              }}
              className="app-input w-14 rounded-lg px-2 py-1.5 text-center text-sm tabular-nums"
            />
          </div>

          <div className="mt-2 flex justify-end border-t border-slate-200/80 pt-2 dark:border-slate-600/60">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="rounded-lg border border-slate-300/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function formatDateTimeShort(d: Date) {
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
