'use client'

import { useRef, useCallback } from 'react'
import { Apple, BookOpen, Heart, MapPin, Sparkles, Users } from 'lucide-react'
import SymbolCell from './SymbolCell'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'

interface FolderItem {
  name: string
}

interface Props {
  symbols: Symbol[]
  predictedIds: string[]
  cellSize: GridCellSize
  onSymbolSelect: (symbol: Symbol) => void
  folders?: FolderItem[]
  onFolderSelect?: (folderName: string) => void
  gridCols?: number
  gridRows?: number
}

export default function SymbolGrid({
  symbols,
  predictedIds,
  cellSize,
  onSymbolSelect,
  folders = [],
  onFolderSelect,
  gridCols = 14,
  gridRows = 8,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  const sizeMap: Record<GridCellSize, string> = {
    small: 'h-full',
    medium: 'h-full',
    large: 'h-full',
  }

  const handleSelect = useCallback((symbol: Symbol) => {
    onSymbolSelect(symbol)
  }, [onSymbolSelect])

  const folderIconMap: Record<string, typeof Users> = {
    'Yo/Tú': Users,
    Acciones: Sparkles,
    Comida: Apple,
    Lugares: MapPin,
    Sentimientos: Heart,
    Tiempo: BookOpen,
  }

  const folderColorMap: Record<string, string> = {
    'Yo/Tú': 'from-blue-200/70 to-white/80 text-blue-950 dark:from-blue-500/20 dark:to-slate-950 dark:text-blue-100',
    Acciones: 'from-violet-200/70 to-white/80 text-violet-950 dark:from-violet-500/20 dark:to-slate-950 dark:text-violet-100',
    Comida: 'from-cyan-200/70 to-white/80 text-cyan-950 dark:from-cyan-500/20 dark:to-slate-950 dark:text-cyan-100',
    Lugares: 'from-amber-200/75 to-white/80 text-amber-950 dark:from-amber-500/20 dark:to-slate-950 dark:text-amber-100',
    Sentimientos: 'from-emerald-200/75 to-white/80 text-emerald-950 dark:from-emerald-500/20 dark:to-slate-950 dark:text-emerald-100',
    Tiempo: 'from-fuchsia-200/70 to-white/80 text-fuchsia-950 dark:from-fuchsia-500/20 dark:to-slate-950 dark:text-fuchsia-100',
  }

  if (symbols.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-lg text-gray-400 dark:text-slate-500">
        No hay símbolos disponibles
      </div>
    )
  }

  // Sort by position
  const sorted = [...symbols].sort((a, b) => {
    if (a.positionY !== b.positionY) return a.positionY - b.positionY
    return a.positionX - b.positionX
  })
  const maxRow = Math.max(
    gridRows,
    sorted.reduce((acc, symbol) => Math.max(acc, symbol.positionY + 1), 0)
  )

  return (
    <div
      ref={gridRef}
      className="aac-grid-surface grid h-full content-start gap-1.5 overflow-hidden p-2 md:p-3"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${Math.max(maxRow, 1)}, minmax(0, 1fr))`
      }}
    >
      {folders.map(folder => {
        const FolderIcon = folderIconMap[folder.name] || Users
        const folderColors = folderColorMap[folder.name] || 'from-gray-100 to-gray-50 border-gray-300 text-gray-900'
        return (
          <button
            key={`folder-${folder.name}`}
            onClick={() => onFolderSelect?.(folder.name)}
            className={`
              symbol-cell flex flex-col items-center justify-center rounded-[1.35rem] border
              bg-gradient-to-br ${folderColors}
              ${sizeMap[cellSize]} w-full select-none p-1.5 shadow-sm
              transition-all duration-150
            `}
            style={{
              borderColor: 'var(--app-border)',
              boxShadow: 'var(--card-shadow)',
            }}
            aria-label={`Abrir carpeta ${folder.name}`}
          >
            <div className="ui-chip mb-1 rounded-2xl p-2">
              <FolderIcon size={20} />
            </div>
            <span className="w-full text-center text-[11px] font-bold leading-tight line-clamp-2 md:text-xs">
              {folder.name}
            </span>
          </button>
        )
      })}

      {sorted.map(symbol => {
        const posX = symbol.positionX
        const posY = symbol.positionY

        return (
          <div
            key={symbol.id}
            style={{
              gridColumnStart: posX + 1,
              gridRowStart: posY + 1,
            }}
            className="h-full"
          >
            {symbol.state !== 'hidden' && (
              <SymbolCell
                symbol={symbol}
                isPredicted={predictedIds.includes(symbol.id)}
                cellSize={cellSize}
                sizeClass={sizeMap[cellSize]}
                isFolder={symbol.id.startsWith('folder-')}
                onSelect={handleSelect}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
