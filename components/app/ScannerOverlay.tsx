'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { Symbol } from '@/lib/supabase/types'
import type { ScannerPattern } from '@/lib/supabase/types'

interface Props {
  symbols: Symbol[]
  pattern: ScannerPattern
  speed: number
  scanKey: string
  onSelect: (symbol: Symbol) => void
}

type RowSub = 'rows' | 'cells'
type QuadSub = 'quads' | 'cells'

function sortGrid(symbols: Symbol[]) {
  return [...symbols].sort((a, b) => {
    if (a.positionY !== b.positionY) return a.positionY - b.positionY
    return a.positionX - b.positionX
  })
}

/** Agrupa símbolos por fila (positionY), ordenado por Y. */
function rowsFromSymbols(sorted: Symbol[]) {
  const byY = new Map<number, Symbol[]>()
  for (const s of sorted) {
    if (s.state === 'hidden') continue
    const y = s.positionY
    const list = byY.get(y) ?? []
    list.push(s)
    byY.set(y, list)
  }
  const uniqueYs = Array.from(byY.keys()).sort((a, b) => a - b)
  return { uniqueYs, byY }
}

/** Cuadrantes por punto medio del bounding box de celdas ocupadas. */
function quadrantBuckets(sorted: Symbol[]) {
  const visible = sorted.filter((s) => s.state !== 'hidden')
  if (visible.length === 0) {
    return { order: [] as number[], byQuad: [[], [], [], []] as Symbol[][] }
  }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const s of visible) {
    minX = Math.min(minX, s.positionX)
    maxX = Math.max(maxX, s.positionX)
    minY = Math.min(minY, s.positionY)
    maxY = Math.max(maxY, s.positionY)
  }
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const byQuad: Symbol[][] = [[], [], [], []]
  for (const s of visible) {
    const left = s.positionX <= midX
    const top = s.positionY <= midY
    const q = (top ? 0 : 2) + (left ? 0 : 1)
    byQuad[q].push(s)
  }
  for (const q of byQuad) {
    q.sort((a, b) => {
      if (a.positionY !== b.positionY) return a.positionY - b.positionY
      return a.positionX - b.positionX
    })
  }
  const order = [0, 1, 2, 3].filter((i) => byQuad[i].length > 0)
  return { order, byQuad }
}

export default function ScannerOverlay({ symbols, pattern, speed, scanKey, onSelect }: Props) {
  const sorted = useMemo(() => sortGrid(symbols), [symbols])
  const symbolKey = useMemo(() => sorted.map((s) => s.id).join('|'), [sorted])
  const { uniqueYs, byY } = useMemo(() => rowsFromSymbols(sorted), [sorted])
  const quadData = useMemo(() => quadrantBuckets(sorted), [sorted])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [rowSub, setRowSub] = useState<RowSub>('rows')
  const [rowIdx, setRowIdx] = useState(0)
  const [cellInRowIdx, setCellInRowIdx] = useState(0)

  const [quadSub, setQuadSub] = useState<QuadSub>('quads')
  const [quadOrderIdx, setQuadOrderIdx] = useState(0)
  const [cellInQuadIdx, setCellInQuadIdx] = useState(0)

  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const currentIndexRef = useRef(0)
  const rowIdxRef = useRef(0)
  const cellInRowIdxRef = useRef(0)
  const quadOrderIdxRef = useRef(0)
  const cellInQuadIdxRef = useRef(0)
  const rowSubRef = useRef<RowSub>('rows')
  const quadSubRef = useRef<QuadSub>('quads')

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])
  useEffect(() => {
    rowIdxRef.current = rowIdx
  }, [rowIdx])
  useEffect(() => {
    cellInRowIdxRef.current = cellInRowIdx
  }, [cellInRowIdx])
  useEffect(() => {
    quadOrderIdxRef.current = quadOrderIdx
  }, [quadOrderIdx])
  useEffect(() => {
    cellInQuadIdxRef.current = cellInQuadIdx
  }, [cellInQuadIdx])
  useEffect(() => {
    rowSubRef.current = rowSub
  }, [rowSub])
  useEffect(() => {
    quadSubRef.current = quadSub
  }, [quadSub])

  const advanceLinear = useCallback(() => {
    if (sorted.length === 0) return
    setCurrentIndex((prev) => {
      const next = (prev + 1) % sorted.length
      currentIndexRef.current = next
      return next
    })
  }, [sorted.length])

  const advanceRow = useCallback(() => {
    if (uniqueYs.length === 0) return
    if (rowSubRef.current === 'rows') {
      setRowIdx((prev) => {
        const next = (prev + 1) % uniqueYs.length
        rowIdxRef.current = next
        return next
      })
    } else {
      const y = uniqueYs[rowIdxRef.current]
      const rowSymbols = y !== undefined ? byY.get(y) ?? [] : []
      if (rowSymbols.length === 0) return
      setCellInRowIdx((prev) => {
        const next = (prev + 1) % rowSymbols.length
        cellInRowIdxRef.current = next
        return next
      })
    }
  }, [uniqueYs, byY])

  const advanceQuad = useCallback(() => {
    const { order, byQuad } = quadData
    if (order.length === 0) return
    if (quadSubRef.current === 'quads') {
      setQuadOrderIdx((prev) => {
        const next = (prev + 1) % order.length
        quadOrderIdxRef.current = next
        return next
      })
    } else {
      const q = order[quadOrderIdxRef.current]
      const cells = q !== undefined ? byQuad[q] ?? [] : []
      if (cells.length === 0) return
      setCellInQuadIdx((prev) => {
        const next = (prev + 1) % cells.length
        cellInQuadIdxRef.current = next
        return next
      })
    }
  }, [quadData])

  const advance = useCallback(() => {
    if (pattern === 'cell') advanceLinear()
    else if (pattern === 'row') advanceRow()
    else advanceQuad()
  }, [pattern, advanceLinear, advanceRow, advanceQuad])

  const resetAfterSelect = useCallback(() => {
    setRowSub('rows')
    setRowIdx(0)
    rowIdxRef.current = 0
    setCellInRowIdx(0)
    cellInRowIdxRef.current = 0
    setQuadSub('quads')
    setQuadOrderIdx(0)
    quadOrderIdxRef.current = 0
    setCellInQuadIdx(0)
    cellInQuadIdxRef.current = 0
    setCurrentIndex(0)
    currentIndexRef.current = 0
  }, [])

  useEffect(() => {
    resetAfterSelect()
  }, [pattern, symbolKey, resetAfterSelect])

  const handleActivation = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      return
    }

    if (pattern === 'cell') {
      const sym = sorted[currentIndexRef.current]
      if (sym) {
        onSelect(sym)
        setIsPaused(true)
        setTimeout(() => setIsPaused(false), 1000)
      }
      return
    }

    if (pattern === 'row') {
      if (uniqueYs.length === 0) return
      if (rowSubRef.current === 'rows') {
        setRowSub('cells')
        setCellInRowIdx(0)
        cellInRowIdxRef.current = 0
        return
      }
      const y = uniqueYs[rowIdxRef.current]
      const rowSymbols = y !== undefined ? byY.get(y) ?? [] : []
      const sym = rowSymbols[cellInRowIdxRef.current]
      if (sym) {
        onSelect(sym)
        setIsPaused(true)
        setTimeout(() => {
          setIsPaused(false)
          resetAfterSelect()
        }, 1000)
      }
      return
    }

    /* quadrant */
    const { order, byQuad } = quadData
    if (order.length === 0) return
    if (quadSubRef.current === 'quads') {
      setQuadSub('cells')
      setCellInQuadIdx(0)
      cellInQuadIdxRef.current = 0
      return
    }
    const q = order[quadOrderIdxRef.current]
    const cells = q !== undefined ? byQuad[q] ?? [] : []
    const sym = cells[cellInQuadIdxRef.current]
    if (sym) {
      onSelect(sym)
      setIsPaused(true)
      setTimeout(() => {
        setIsPaused(false)
        resetAfterSelect()
      }, 1000)
    }
  }, [isPaused, pattern, sorted, uniqueYs, byY, quadData, onSelect, resetAfterSelect])

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(advance, speed * 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [speed, isPaused, advance])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === scanKey || e.key === scanKey || e.code === 'Space') {
        e.preventDefault()
        handleActivation()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleActivation, scanKey])

  useEffect(() => {
    const cells = document.querySelectorAll('[data-symbol-id]')
    cells.forEach((el) => {
      el.classList.remove('scanner-active', 'scanner-row-active', 'scanner-quad-active')
    })

    if (pattern === 'cell') {
      const id = sorted[currentIndex]?.id
      if (!id) return
      cells.forEach((el) => {
        if (el.getAttribute('data-symbol-id') === id) el.classList.add('scanner-active')
      })
      return
    }

    if (pattern === 'row') {
      if (rowSub === 'rows') {
        const y = uniqueYs[rowIdx]
        if (y === undefined) return
        cells.forEach((el) => {
          if (el.getAttribute('data-scanner-y') === String(y)) el.classList.add('scanner-row-active')
        })
      } else {
        const y = uniqueYs[rowIdx]
        const rowSymbols = y !== undefined ? byY.get(y) ?? [] : []
        const sym = rowSymbols[cellInRowIdx]
        const id = sym?.id
        if (!id) return
        cells.forEach((el) => {
          if (el.getAttribute('data-symbol-id') === id) el.classList.add('scanner-active')
        })
      }
      return
    }

    /* quadrant */
    const { order, byQuad } = quadData
    if (order.length === 0) return
    if (quadSub === 'quads') {
      const q = order[quadOrderIdx]
      if (q === undefined) return
      const inQuad = byQuad[q] ?? []
      const inSet = new Set(inQuad.map((s) => s.id))
      cells.forEach((el) => {
        const id = el.getAttribute('data-symbol-id')
        if (id && inSet.has(id)) el.classList.add('scanner-quad-active')
      })
    } else {
      const q = order[quadOrderIdx]
      const cellsInQ = q !== undefined ? byQuad[q] ?? [] : []
      const sym = cellsInQ[cellInQuadIdx]
      const id = sym?.id
      if (!id) return
      cells.forEach((el) => {
        if (el.getAttribute('data-symbol-id') === id) el.classList.add('scanner-active')
      })
    }
  }, [
    pattern,
    sorted,
    currentIndex,
    rowSub,
    rowIdx,
    cellInRowIdx,
    uniqueYs,
    byY,
    quadSub,
    quadOrderIdx,
    cellInQuadIdx,
    quadData,
  ])

  return (
    <div
      className="absolute inset-0 cursor-pointer"
      onClick={handleActivation}
      aria-label="Área del escáner — activa para seleccionar o bajar de nivel"
    />
  )
}
