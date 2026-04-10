'use client'

import { useRef, useCallback, useState } from 'react'
import { Apple, BookOpen, Heart, MapPin, Sparkles, Users } from 'lucide-react'
import SymbolCell, { type SymbolGridDensity, type SymbolSelectChoice } from './SymbolCell'
import WordVariantsRadialOverlay from '@/components/app/WordVariantsRadialOverlay'
import { shouldShowFolderBadge } from '@/lib/data/defaultSymbols'
import { symbolHasVariantMenu } from '@/lib/symbolWordVariants'

function getGridDensity(gridCols: number, gridRows: number): SymbolGridDensity {
  const n = Math.max(1, gridCols * gridRows)
  if (n <= 12) return 'sparse'
  if (n <= 42) return 'comfortable'
  return 'dense'
}
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'

interface FolderItem {
  name: string
}

interface Props {
  symbols: Symbol[]
  predictedIds: string[]
  cellSize: GridCellSize
  onSymbolSelect: (symbol: Symbol, choice?: SymbolSelectChoice) => void
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
  const [radialSymbol, setRadialSymbol] = useState<Symbol | null>(null)

  const closeRadial = useCallback(() => setRadialSymbol(null), [])
  const handleVariantRadialOpen = useCallback((symbol: Symbol) => {
    setRadialSymbol(symbol)
  }, [])

  const sizeMap: Record<GridCellSize, string> = {
    small: 'h-full',
    medium: 'h-full',
    large: 'h-full',
  }

  const handleSelect = useCallback(
    (symbol: Symbol, choice?: SymbolSelectChoice) => {
      onSymbolSelect(symbol, choice)
    },
    [onSymbolSelect],
  )

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
      <div className="flex h-full min-h-0 items-center justify-center text-lg text-gray-400 dark:text-slate-500">
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
    sorted.reduce((acc, symbol) => Math.max(acc, symbol.positionY + 1), 0),
  )

  const gridDensity = getGridDensity(gridCols, gridRows)
  const gapPad =
    gridDensity === 'sparse'
      ? 'gap-2 md:gap-3 p-3 md:p-4'
      : gridDensity === 'comfortable'
        ? 'gap-2 p-2 md:p-3'
        : 'gap-1.5 p-2 md:p-3'
  const folderIconSize = gridDensity === 'sparse' ? 28 : gridDensity === 'comfortable' ? 24 : 20
  const folderLabelClass =
    gridDensity === 'sparse'
      ? 'text-sm font-bold md:text-base'
      : gridDensity === 'comfortable'
        ? 'text-xs font-bold md:text-sm'
        : 'text-[11px] font-bold md:text-xs'

  return (
    <>
    <div className="relative h-full min-h-0 w-full min-w-0">
    <div
      ref={gridRef}
      className={`aac-grid-surface grid h-full min-h-0 content-stretch overflow-hidden ${gapPad}`}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${Math.max(maxRow, 1)}, minmax(0, 1fr))`
      }}
    >
      {folders.map(folder => {
        const FolderIcon = folderIconMap[folder.name] || Users
        const folderColors = folderColorMap[folder.name] || 'from-gray-100 to-gray-50 border-gray-300 text-gray-900'
        const dimChrome = Boolean(radialSymbol)
        return (
          <button
            key={`folder-${folder.name}`}
            onClick={() => onFolderSelect?.(folder.name)}
            disabled={dimChrome}
            className={`
              symbol-cell flex flex-col items-center justify-center rounded-[1.35rem] border
              bg-gradient-to-br ${folderColors}
              ${sizeMap[cellSize]} w-full select-none p-1.5 shadow-sm
              transition-all duration-150
              ${dimChrome ? 'pointer-events-none' : ''}
            `}
            style={{
              borderColor: 'var(--app-border)',
              boxShadow: 'var(--card-shadow)',
            }}
            aria-label={`Abrir carpeta ${folder.name}`}
          >
            <div className="ui-chip mb-1 rounded-2xl p-2">
              <FolderIcon size={folderIconSize} />
            </div>
            <span className={`w-full text-center leading-tight line-clamp-2 ${folderLabelClass}`}>
              {folder.name}
            </span>
          </button>
        )
      })}

      {sorted.map((symbol, idx) => {
        const posX = symbol.positionX
        const posY = symbol.positionY

        return (
          <div
            key={`${symbol.gridId ?? 'main'}-${posX}-${posY}-${symbol.id}-${idx}`}
            style={{
              gridColumn: `${posX + 1} / span 1`,
              gridRow: `${posY + 1} / span 1`,
            }}
            className="h-full min-h-0"
          >
            {symbol.state !== 'hidden' && (
              <SymbolCell
                symbol={symbol}
                isPredicted={predictedIds.includes(symbol.id)}
                cellSize={cellSize}
                sizeClass={sizeMap[cellSize]}
                gridDensity={gridDensity}
                isFolder={shouldShowFolderBadge(symbol)}
                onSelect={handleSelect}
                onVariantRadialOpen={handleVariantRadialOpen}
              />
            )}
          </div>
        )
      })}
    </div>
      {radialSymbol && (
        <div
          className="pointer-events-none absolute inset-0 z-[8] bg-black/50"
          aria-hidden
        />
      )}
    </div>
    {radialSymbol?.wordVariants && symbolHasVariantMenu(radialSymbol.wordVariants) && (
      <WordVariantsRadialOverlay
        symbol={radialSymbol}
        cfg={radialSymbol.wordVariants}
        gridDensity={gridDensity}
        onClose={closeRadial}
        onPick={(phraseLabel, variantIndex) => {
          closeRadial()
          handleSelect(radialSymbol, { phraseLabel, variantIndex })
        }}
      />
    )}
    </>
  )
}
