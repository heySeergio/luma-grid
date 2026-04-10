'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { Folder, Layers } from 'lucide-react'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'
import { getSymbolTextColor, resolveSymbolColor } from '@/lib/ui/symbolColors'
import {
  defaultPhraseLabel,
  symbolHasVariantMenu,
} from '@/lib/symbolWordVariants'

export type SymbolGridDensity = 'sparse' | 'comfortable' | 'dense'

export type SymbolSelectChoice = { phraseLabel: string; variantIndex: number }

interface Props {
  symbol: Symbol
  isPredicted: boolean
  cellSize: GridCellSize
  sizeClass: string
  /** Tableros con pocas celdas: tipografía e imagen más grandes. */
  gridDensity?: SymbolGridDensity
  isFolder?: boolean
  onSelect: (symbol: Symbol, choice?: SymbolSelectChoice) => void
  /** Abrir selector de formas alrededor de la celda (mantener pulsado o icono de capas). */
  onVariantRadialOpen?: (symbol: Symbol) => void
}

const LONG_PRESS_MS = 480

export default function SymbolCell({
  symbol,
  isPredicted,
  sizeClass,
  gridDensity = 'dense',
  isFolder = false,
  onSelect,
  onVariantRadialOpen,
}: Props) {
  const [isPopping, setIsPopping] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const isLocked = symbol.state === 'locked'
  const menuCfg = symbol.wordVariants
  const hasVariantMenu = symbolHasVariantMenu(menuCfg)
  const backgroundColor = resolveSymbolColor(symbol.color) || 'var(--app-surface-elevated)'
  const textColor = getSymbolTextColor(symbol.color)

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const emitDefault = useCallback(() => {
    if (isLocked) return
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 200)
    if (hasVariantMenu && menuCfg) {
      onSelect(symbol, {
        phraseLabel: defaultPhraseLabel(symbol.label, menuCfg),
        variantIndex: menuCfg.defaultIndex,
      })
    } else {
      onSelect(symbol)
    }
  }, [hasVariantMenu, isLocked, menuCfg, onSelect, symbol])

  const openRadial = useCallback(() => {
    if (isLocked || !hasVariantMenu || !onVariantRadialOpen) return
    onVariantRadialOpen(symbol)
  }, [hasVariantMenu, isLocked, onVariantRadialOpen, symbol])

  const onMainPointerDown = (e: React.PointerEvent) => {
    if (isLocked || !hasVariantMenu) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    longPressFiredRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      longPressTimerRef.current = null
      openRadial()
    }, LONG_PRESS_MS)
  }

  const onMainPointerEnd = () => {
    clearLongPressTimer()
  }

  const handleMainClick = () => {
    if (isLocked) return
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    emitDefault()
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

  const hasGlyph =
    Boolean(typeof symbol.imageUrl === 'string' && symbol.imageUrl.trim()) ||
    Boolean(typeof symbol.emoji === 'string' && symbol.emoji.trim())

  return (
    <div
      className="relative h-full min-h-0 w-full"
      data-symbol-id={symbol.id}
      data-scanner-y={symbol.positionY}
      data-scanner-x={symbol.positionX}
    >
      <button
        type="button"
        onClick={handleMainClick}
        onPointerDown={onMainPointerDown}
        onPointerUp={onMainPointerEnd}
        onPointerCancel={onMainPointerEnd}
        onPointerLeave={onMainPointerEnd}
        disabled={isLocked}
        aria-label={symbol.label}
        aria-haspopup={hasVariantMenu ? 'dialog' : undefined}
        aria-expanded={undefined}
        className={`
        symbol-cell relative flex h-full min-h-0 w-full flex-col items-stretch rounded-[1.35rem] border
        ${hasGlyph ? '' : 'justify-center'}
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
      >
        {isFolder && (
          <span
            className="ui-chip pointer-events-none absolute right-1.5 top-1.5 z-[1] inline-flex items-center justify-center rounded-lg p-1"
            style={{ color: textColor }}
            aria-hidden
          >
            <Folder size={folderBadgeSize} strokeWidth={2} />
          </span>
        )}
        {!hasGlyph ? (
          <span
            className={`flex min-h-0 w-full flex-1 items-center justify-center px-1 text-center font-semibold leading-tight ${labelSizeFull[gridDensity]} line-clamp-4`}
            style={{ color: textColor }}
          >
            {symbol.label}
          </span>
        ) : (
          <>
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
                <span className={`${emojiSize[sizeClass] || 'text-3xl'} leading-none`}>{symbol.emoji}</span>
              )}
            </div>
            <span
              className={`${labelSize[sizeClass] || 'text-xs'} shrink-0 px-0.5 pb-0.5 text-center font-semibold leading-tight line-clamp-2`}
              style={{ color: textColor }}
            >
              {symbol.label}
            </span>
          </>
        )}
      </button>

      {hasVariantMenu && !isLocked && (
        <button
          type="button"
          className="ui-chip absolute left-1.5 top-1.5 z-[2] inline-flex items-center justify-center rounded-lg p-1"
          style={{ color: textColor }}
          aria-label="Elegir otra forma (formas alrededor)"
          title="Formas alrededor — o mantén pulsada la celda"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            openRadial()
          }}
        >
          <Layers size={folderBadgeSize} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
