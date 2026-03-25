'use client'

import Image from 'next/image'
import { Folder } from 'lucide-react'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'

interface Props {
  symbol: Symbol
  isPredicted: boolean
  cellSize: GridCellSize
  sizeClass: string
  isFolder?: boolean
  onSelect: (symbol: Symbol) => void
}

export default function SymbolCell({ symbol, isPredicted, sizeClass, isFolder = false, onSelect }: Props) {
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
      onClick={() => onSelect(symbol)}
      className={`
        symbol-cell relative flex flex-col items-center justify-center rounded-lg border-2
        ${sizeClass} w-full p-1.5 select-none
        ${isPredicted
          ? 'border-violet-500 shadow-md shadow-violet-100 ring-1 ring-violet-300'
          : 'border-slate-300 shadow-sm'
        }
        hover:border-slate-400 hover:shadow-md
        transition-all duration-100
      `}
      style={{ backgroundColor: symbol.color || '#ffffff' }}
      aria-label={symbol.label}
    >
      {isFolder && (
        <span className="absolute right-1 top-1 rounded-sm bg-white/85 border border-slate-300 p-0.5 text-slate-700">
          <Folder size={10} />
        </span>
      )}
      <div className={`${emojiSize[sizeClass] || 'text-3xl'} leading-none mb-1`}>
        {symbol.image_url ? (
          <Image
            src={symbol.image_url}
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
      <span className={`${labelSize[sizeClass] || 'text-xs'} font-bold text-slate-900 text-center leading-tight line-clamp-2 w-full`}>
        {symbol.label}
      </span>
    </button>
  )
}
