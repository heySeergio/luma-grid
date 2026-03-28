'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Symbol } from '@/lib/supabase/types'
import type { ScannerPattern } from '@/lib/supabase/types'

interface Props {
  symbols: Symbol[]
  pattern: ScannerPattern
  speed: number
  scanKey: string
  onSelect: (symbol: Symbol) => void
}

export default function ScannerOverlay({ symbols, pattern: _pattern, speed, scanKey, onSelect }: Props) {
  void _pattern
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const currentIndexRef = useRef(0)

  const sorted = [...symbols].sort((a, b) => {
    if (a.position_y !== b.position_y) return a.position_y - b.position_y
    return a.position_x - b.position_x
  })

  const advance = useCallback(() => {
    setCurrentIndex(prev => {
      const next = (prev + 1) % sorted.length
      currentIndexRef.current = next
      return next
    })
  }, [sorted.length])

  const handleActivation = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      return
    }
    const symbol = sorted[currentIndexRef.current]
    if (symbol) {
      onSelect(symbol)
      setIsPaused(true)
      setTimeout(() => setIsPaused(false), 1000)
    }
  }, [sorted, onSelect, isPaused])

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

  // This component just manages state and renders highlight styles via CSS
  // The actual highlighting is done via data attributes on the grid cells
  useEffect(() => {
    const cells = document.querySelectorAll('[data-symbol-id]')
    cells.forEach((cell, i) => {
      if (i === currentIndex) {
        cell.classList.add('scanner-active')
      } else {
        cell.classList.remove('scanner-active')
      }
    })
  }, [currentIndex])

  return (
    <div
      className="absolute inset-0 cursor-pointer"
      onClick={handleActivation}
      aria-label="Área del escáner - haz clic para seleccionar"
    />
  )
}
