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
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [])

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
        className="inline-grid touch-none select-none gap-0.5 rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 dark:border-slate-600 dark:bg-slate-800/80"
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
              className={`h-4 w-4 rounded-sm border transition sm:h-[18px] sm:w-[18px] ${
                inSelection
                  ? 'border-orange-500 bg-orange-500/85 shadow-sm dark:border-orange-400 dark:bg-orange-500/70'
                  : 'border-slate-300/90 bg-white dark:border-slate-500 dark:bg-slate-700'
              }`}
              aria-hidden
              onPointerDown={(e) => {
                e.preventDefault()
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
