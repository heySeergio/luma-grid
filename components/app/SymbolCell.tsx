'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Folder } from 'lucide-react'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'
import { getSymbolTextColor, resolveSymbolColor } from '@/lib/ui/symbolColors'

interface Props {
  symbol: Symbol
  isPredicted: boolean
  cellSize: GridCellSize
  sizeClass: string
  isFolder?: boolean
  onSelect: (symbol: Symbol) => void
}

export default function SymbolCell({ symbol, isPredicted, sizeClass, isFolder = false, onSelect }: Props) {
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
  const emojiSize: Record<string, string> = {
    'h-16': 'text-2xl',
    'h-24': 'text-4xl',
    'h-32': 'text-5xl',
    'h-full': 'text-2xl md:text-3xl',
  }

  const labelSize: Record<string, string> = {
    'h-16': 'text-xs',
    'h-24': 'text-sm',
    'h-32': 'text-base',
    'h-full': 'text-xs md:text-sm',
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`
        symbol-cell relative flex flex-col items-center justify-center rounded-[1.35rem] border
        ${sizeClass} w-full p-1.5 select-none
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
        <span className="ui-chip absolute right-1.5 top-1.5 rounded-lg p-1" style={{ color: textColor }}>
          <Folder size={10} />
        </span>
      )}
      <div className={`${emojiSize[sizeClass] || 'text-3xl'} mb-1 leading-none`} style={{ color: textColor }}>
        {symbol.imageUrl ? (
          <Image
            src={symbol.imageUrl}
            alt={symbol.label}
            width={64}
            height={64}
            className="object-contain w-full h-full"
            unoptimized
          />
        ) : (
          symbol.emoji || '❓'
        )}
      </div>
      <span
        className={`${labelSize[sizeClass] || 'text-xs'} w-full text-center font-semibold leading-tight line-clamp-2`}
        style={{ color: textColor }}
      >
        {symbol.label}
      </span>
    </button>
  )
}
