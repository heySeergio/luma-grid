'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Máximo visible en el selector (como Word); el admin permite hasta 20×20 vía “Dimensiones”. */
export const PROFILE_GRID_PICKER_MAX_COLS = 14
export const PROFILE_GRID_PICKER_MAX_ROWS = 10

type Props = {
  cols: number
  rows: number
  onChange: (cols: number, rows: number) => void
  className?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function ProfileGridDimensionPicker({ cols, rows, onChange, className }: Props) {
  const [hoverC, setHoverC] = useState(cols)
  const [hoverR, setHoverR] = useState(rows)
  const draggingRef = useRef(false)
  const hoverRef = useRef({ c: cols, r: rows })
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setHoverC(cols)
    setHoverR(rows)
    hoverRef.current = { c: cols, r: rows }
  }, [cols, rows])

  const setHover = useCallback((c: number, r: number) => {
    const nc = clamp(c, 1, PROFILE_GRID_PICKER_MAX_COLS)
    const nr = clamp(r, 1, PROFILE_GRID_PICKER_MAX_ROWS)
    hoverRef.current = { c: nc, r: nr }
    setHoverC(nc)
    setHoverR(nr)
  }, [])

  useEffect(() => {
    const endDrag = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      const { c, r } = hoverRef.current
      onChangeRef.current(c, r)
    }
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const cell = el?.closest?.('[data-grid-picker-cell]') as HTMLElement | null
      if (!cell) return
      const ci = Number(cell.dataset.col)
      const ri = Number(cell.dataset.row)
      if (!Number.isFinite(ci) || !Number.isFinite(ri)) return
      setHover(ci + 1, ri + 1)
    }
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('pointermove', onWindowPointerMove)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('pointermove', onWindowPointerMove)
    }
  }, [setHover])

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Tablero de {hoverC}×{hoverR}
      </p>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        Arrastra o haz clic para elegir columnas y filas.
      </p>
      <div
        role="grid"
        aria-label="Seleccionar tamaño del tablero"
        className="inline-grid cursor-grab touch-none select-none gap-0.5 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-800/80"
        style={{
          gridTemplateColumns: `repeat(${PROFILE_GRID_PICKER_MAX_COLS}, minmax(0, 1fr))`,
        }}
        onPointerLeave={() => {
          if (!draggingRef.current) {
            setHover(cols, rows)
          }
        }}
      >
        {Array.from({ length: PROFILE_GRID_PICKER_MAX_ROWS * PROFILE_GRID_PICKER_MAX_COLS }, (_, i) => {
          const ci = i % PROFILE_GRID_PICKER_MAX_COLS
          const ri = Math.floor(i / PROFILE_GRID_PICKER_MAX_COLS)
          const inSelection = ci < hoverC && ri < hoverR
          return (
            <button
              key={`${ci}-${ri}`}
              type="button"
              tabIndex={-1}
              data-grid-picker-cell
              data-col={ci}
              data-row={ri}
              className={`h-4 w-4 rounded-sm border transition sm:h-[18px] sm:w-[18px] ${
                inSelection ? 'shadow-sm' : 'border-slate-300/90 bg-white dark:border-slate-500 dark:bg-slate-700'
              }`}
              style={
                inSelection
                  ? {
                      borderColor: 'var(--accent)',
                      background: 'color-mix(in srgb, var(--accent) 78%, transparent)',
                      boxShadow: '0 1px 2px rgb(15 23 42 / 0.08)',
                    }
                  : undefined
              }
              aria-hidden
              onPointerDown={(e) => {
                e.preventDefault()
                try {
                  e.currentTarget.setPointerCapture(e.pointerId)
                } catch {
                  /* ignore */
                }
                draggingRef.current = true
                setHover(ci + 1, ri + 1)
              }}
              onPointerEnter={() => {
                if (draggingRef.current) {
                  setHover(ci + 1, ri + 1)
                }
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
