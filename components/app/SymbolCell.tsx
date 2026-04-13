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
import SymbolCellAutoFitLabel from '@/components/app/SymbolCellAutoFitLabel'
import PictoEmoji from '@/components/ui/PictoEmoji'

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

/**
 * Tipografía: cqmin/cqw/cqh escalan con la celda; vmin refuerza legibilidad según pantalla.
 */
const CELL_LABEL: Record<SymbolGridDensity, string> = {
  sparse:
    'text-[clamp(0.78rem,calc(0.3rem+3.5cqmin+0.35vmin),1.12rem)]',
  comfortable:
    'text-[clamp(0.72rem,calc(0.26rem+3.2cqmin+0.32vmin),1.04rem)]',
  dense:
    'text-[clamp(0.65rem,calc(0.22rem+2.95cqmin+0.28vmin),0.98rem)]',
}

const CELL_LABEL_FULL: Record<SymbolGridDensity, string> = {
  sparse:
    'text-[clamp(0.82rem,calc(0.32rem+3.65cqmin+0.38vmin),1.18rem)]',
  comfortable:
    'text-[clamp(0.76rem,calc(0.28rem+3.35cqmin+0.34vmin),1.08rem)]',
  dense:
    'text-[clamp(0.68rem,calc(0.24rem+3.05cqmin+0.3vmin),1rem)]',
}

const CELL_EMOJI: Record<SymbolGridDensity, string> = {
  sparse:
    'text-[clamp(1.75rem,calc(0.55rem+11cqmin+0.4vmin),3.35rem)]',
  comfortable:
    'text-[clamp(1.55rem,calc(0.48rem+10cqmin+0.35vmin),2.9rem)]',
  dense:
    'text-[clamp(1.35rem,calc(0.44rem+9cqmin+0.32vmin),2.5rem)]',
}

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

  const folderBadgeSize = gridDensity === 'sparse' ? 14 : gridDensity === 'comfortable' ? 12 : 10
  const cellPadding =
    gridDensity === 'sparse' ? 'p-2 sm:p-2.5 md:p-3' : gridDensity === 'comfortable' ? 'p-2 md:p-2' : 'p-1.5'

  const hasGlyph =
    Boolean(typeof symbol.imageUrl === 'string' && symbol.imageUrl.trim()) ||
    Boolean(typeof symbol.emoji === 'string' && symbol.emoji.trim())

  return (
    <div
      className="symbol-cell-root relative h-full min-h-0 w-full min-w-0"
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
        ${hasGlyph ? 'symbol-cell__btn--has-glyph' : 'justify-center'}
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
          <div className="flex min-h-0 w-full flex-1 items-center justify-center px-1">
            <SymbolCellAutoFitLabel
              label={symbol.label}
              textColor={textColor}
              labelClassName={CELL_LABEL_FULL[gridDensity]}
            />
          </div>
        ) : (
          <div className="symbol-cell__inner flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1 px-0.5 py-0.5">
            {/* Bloque picto+texto centrado en H y V dentro de la celda */}
            <div
              className="symbol-cell__glyph-zone flex min-h-0 w-full shrink-0 items-center justify-center overflow-hidden"
              style={{ color: textColor }}
            >
              {symbol.imageUrl ? (
                <div className="relative mx-auto aspect-square w-[min(100%,min(88cqmin,96cqw))] max-w-full max-h-[min(58cqh,92cqmin)] min-h-0 min-w-0">
                  <Image
                    src={symbol.imageUrl}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="(max-width: 480px) 20vw, (max-width: 900px) 12vw, (max-width: 1400px) 9vw, 120px"
                    unoptimized
                  />
                </div>
              ) : (
                <PictoEmoji
                  emoji={symbol.emoji ?? ''}
                  className={`${CELL_EMOJI[gridDensity]} flex max-h-[min(54cqh,88cqmin)] min-h-0 w-full items-center justify-center overflow-hidden leading-none`}
                  aria-hidden
                />
              )}
            </div>
            <div className="relative z-[1] w-full min-w-0 shrink-0 px-0.5">
              <SymbolCellAutoFitLabel
                label={symbol.label}
                textColor={textColor}
                labelClassName={CELL_LABEL[gridDensity]}
              />
            </div>
          </div>
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
