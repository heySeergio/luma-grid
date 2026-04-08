'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Folder } from 'lucide-react'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'
import { getSymbolTextColor, resolveSymbolColor } from '@/lib/ui/symbolColors'

export type SymbolGridDensity = 'sparse' | 'comfortable' | 'dense'

interface Props {
  symbol: Symbol
  isPredicted: boolean
  cellSize: GridCellSize
  sizeClass: string
  /** Tableros con pocas celdas: tipografía e imagen más grandes. */
  gridDensity?: SymbolGridDensity
  isFolder?: boolean
  onSelect: (symbol: Symbol) => void
}

export default function SymbolCell({
  symbol,
  isPredicted,
  sizeClass,
  gridDensity = 'dense',
  isFolder = false,
  onSelect,
}: Props) {
  const [isPopping, setIsPopping] = useState(false)
  const isLocked = symbol.state === 'locked'
  const backgroundColor = useMemo(() => resolveSymbolColor(symbol.color) || 'var(--app-surface-elevated)', [symbol.color])
  const textColor = useMemo(() => getSymbolTextColor(symbol.color), [symbol.color])

  const handleClick = () => {
    if (isLocked) return
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 200)
    onSelect(symbol)
  }
  const emojiSizeFull: Record<SymbolGridDensity, string> = {
    sparse: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
    comfortable: 'text-3xl sm:text-4xl md:text-5xl',
    dense: 'text-2xl md:text-3xl',
  }

  const labelSizeFull: Record<SymbolGridDensity, string> = {
    sparse: 'text-sm sm:text-base md:text-lg',
    comfortable: 'text-xs sm:text-sm md:text-base',
    dense: 'text-xs md:text-sm',
  }

  const emojiSize: Record<string, string> = {
    'h-16': 'text-2xl',
    'h-24': 'text-4xl',
    'h-32': 'text-5xl',
    'h-full': emojiSizeFull[gridDensity],
  }

  const labelSize: Record<string, string> = {
    'h-16': 'text-xs',
    'h-24': 'text-sm',
    'h-32': 'text-base',
    'h-full': labelSizeFull[gridDensity],
  }

  const imageBoxPx = gridDensity === 'sparse' ? 120 : gridDensity === 'comfortable' ? 88 : 64
  const folderBadgeSize = gridDensity === 'sparse' ? 14 : gridDensity === 'comfortable' ? 12 : 10
  const cellPadding =
    gridDensity === 'sparse' ? 'p-2 sm:p-2.5 md:p-3' : gridDensity === 'comfortable' ? 'p-2 md:p-2' : 'p-1.5'

  return (
    <button
      type="button"
      data-symbol-id={symbol.id}
      data-scanner-y={symbol.positionY}
      data-scanner-x={symbol.positionX}
      onClick={handleClick}
      disabled={isLocked}
      className={`
        symbol-cell relative flex h-full min-h-0 w-full flex-col items-stretch rounded-[1.35rem] border
        ${sizeClass} ${cellPadding} select-none
        ${isPopping ? 'animate-pop' : ''}
        ${isPredicted && !isLocked
          ? 'ring-1'
          : ''
        }
        ${!isLocked ? 'cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}
        transition-all duration-150
      `}
      style={{
        backgroundColor,
        borderColor: isPredicted && !isLocked ? 'var(--app-predicted-border)' : 'var(--app-border)',
        boxShadow: isPredicted && !isLocked
          ? '0 0 0 1px var(--app-predicted-border), 0 12px 28px -22px rgb(99 102 241 / 0.45)'
          : 'var(--card-shadow)',
        backgroundImage: isPredicted && !isLocked
          ? 'linear-gradient(180deg, color-mix(in srgb, var(--app-predicted) 68%, transparent), transparent 70%)'
          : undefined,
      }}
      aria-label={symbol.label}
    >
      {isFolder && (
        <span className="ui-chip absolute right-1.5 top-1.5 z-[1] rounded-lg p-1" style={{ color: textColor }}>
          <Folder size={folderBadgeSize} />
        </span>
      )}
      {/* Imagen o emoji arriba; etiqueta siempre debajo (layout fijo en columna) */}
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5 pt-0.5"
        style={{ color: textColor }}
      >
        {symbol.imageUrl ? (
          <div className="flex h-full max-h-full w-full flex-1 items-center justify-center">
            <Image
              src={symbol.imageUrl}
              alt={symbol.label}
              width={imageBoxPx}
              height={imageBoxPx}
              className="max-h-full max-w-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <span className={`${emojiSize[sizeClass] || 'text-3xl'} leading-none`}>
            {symbol.emoji || '❓'}
          </span>
        )}
      </div>
      <span
        className={`${labelSize[sizeClass] || 'text-xs'} shrink-0 px-0.5 pb-0.5 text-center font-semibold leading-tight line-clamp-2`}
        style={{ color: textColor }}
      >
        {symbol.label}
      </span>
    </button>
  )
}
