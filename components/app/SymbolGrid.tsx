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
}

export default function SymbolGrid({
  symbols,
  predictedIds,
  cellSize,
  onSymbolSelect,
  folders = [],
  onFolderSelect,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  const colsMap: Record<GridCellSize, string> = {
    small: 'grid-cols-[repeat(14,minmax(0,1fr))]',
    medium: 'grid-cols-[repeat(14,minmax(0,1fr))]',
    large: 'grid-cols-[repeat(14,minmax(0,1fr))]',
  }

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
    'Yo/Tú': 'from-blue-100 to-blue-50 border-blue-300 text-blue-900',
    Acciones: 'from-violet-100 to-violet-50 border-violet-300 text-violet-900',
    Comida: 'from-cyan-100 to-cyan-50 border-cyan-300 text-cyan-900',
    Lugares: 'from-amber-100 to-amber-50 border-amber-300 text-amber-900',
    Sentimientos: 'from-emerald-100 to-emerald-50 border-emerald-300 text-emerald-900',
    Tiempo: 'from-fuchsia-100 to-fuchsia-50 border-fuchsia-300 text-fuchsia-900',
  }

  if (symbols.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-lg">
        No hay símbolos disponibles
      </div>
    )
  }

  // Sort by position
  const sorted = [...symbols].sort((a, b) => {
    if (a.position_y !== b.position_y) return a.position_y - b.position_y
    return a.position_x - b.position_x
  })
  const maxRow = sorted.reduce((acc, symbol) => Math.max(acc, symbol.position_y), 0) + 1

  return (
    <div
      ref={gridRef}
      className={`aac-grid-surface grid ${colsMap[cellSize]} gap-1.5 p-2 overflow-hidden h-full content-start`}
      style={{ gridTemplateRows: `repeat(${Math.max(maxRow, 1)}, minmax(0, 1fr))` }}
    >
      {folders.map(folder => {
        const FolderIcon = folderIconMap[folder.name] || Users
        const folderColors = folderColorMap[folder.name] || 'from-gray-100 to-gray-50 border-gray-300 text-gray-900'
        return (
          <button
            key={`folder-${folder.name}`}
            onClick={() => onFolderSelect?.(folder.name)}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2
              bg-gradient-to-br ${folderColors}
              ${sizeMap[cellSize]} w-full p-1 select-none shadow-sm
              hover:shadow-md transition-all duration-100
            `}
            aria-label={`Abrir carpeta ${folder.name}`}
          >
            <div className="mb-1 rounded-lg bg-white/70 p-1.5">
              <FolderIcon size={20} />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-center leading-tight line-clamp-2 w-full">
              {folder.name}
            </span>
          </button>
        )
      })}

      {sorted.map(symbol => (
        <div
          key={symbol.id}
          style={{
            gridColumnStart: symbol.position_x + 1,
            gridRowStart: symbol.position_y + 1,
          }}
          className="h-full"
        >
          <SymbolCell
            symbol={symbol}
            isPredicted={predictedIds.includes(symbol.id)}
            cellSize={cellSize}
            sizeClass={sizeMap[cellSize]}
            isFolder={symbol.id.startsWith('folder-')}
            onSelect={handleSelect}
          />
        </div>
      ))}
    </div>
  )
}
