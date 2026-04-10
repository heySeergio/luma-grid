'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Folder, Layers } from 'lucide-react'
import type { Symbol } from '@/lib/supabase/types'
import type { GridCellSize } from '@/lib/supabase/types'
import { getSymbolTextColor, resolveSymbolColor } from '@/lib/ui/symbolColors'
import {
  defaultPhraseLabel,
  listVariantMenuEntries,
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
}

const LONG_PRESS_MS = 480

export default function SymbolCell({
  symbol,
  isPredicted,
  sizeClass,
  gridDensity = 'dense',
  isFolder = false,
  onSelect,
}: Props) {
  const [isPopping, setIsPopping] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const isLocked = symbol.state === 'locked'
  const menuCfg = symbol.wordVariants
  const hasVariantMenu = symbolHasVariantMenu(menuCfg)
  const backgroundColor = useMemo(() => resolveSymbolColor(symbol.color) || 'var(--app-surface-elevated)', [symbol.color])
  const textColor = useMemo(() => getSymbolTextColor(symbol.color), [symbol.color])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const updateMenuPosition = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 8
    const left = Math.min(Math.max(r.left + r.width / 2, pad), window.innerWidth - pad)
    const top = r.bottom + 6
    setMenuPos({ top, left, width: Math.min(280, Math.max(200, r.width)) })
  }, [])

  useLayoutEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()
    const onWin = () => updateMenuPosition()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [menuOpen, updateMenuPosition])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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

  const openMenu = useCallback(() => {
    if (isLocked || !hasVariantMenu || !menuCfg) return
    updateMenuPosition()
    setMenuOpen(true)
  }, [hasVariantMenu, isLocked, menuCfg, updateMenuPosition])

  const pickVariant = useCallback(
    (phraseLabel: string, variantIndex: number) => {
      setMenuOpen(false)
      setIsPopping(true)
      setTimeout(() => setIsPopping(false), 200)
      onSelect(symbol, { phraseLabel, variantIndex })
    },
    [onSelect, symbol],
  )

  const onMainPointerDown = (e: React.PointerEvent) => {
    if (isLocked || !hasVariantMenu) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    longPressFiredRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      longPressTimerRef.current = null
      openMenu()
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
    if (menuOpen) return
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

  const menuEntries = menuCfg ? listVariantMenuEntries(menuCfg) : []

  const menuPortal =
    menuOpen &&
    menuPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Formas de «${symbol.label}»`}
        className="fixed z-[200] max-h-[min(50dvh,320px)] overflow-y-auto rounded-2xl border bg-[var(--app-surface-elevated)] py-1 shadow-xl dark:border-slate-600"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          transform: 'translateX(-50%)',
          borderColor: 'var(--app-border)',
          boxShadow: '0 18px 48px -24px rgb(0 0 0 / 0.35)',
        }}
      >
        <p className="border-b border-[var(--app-border)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Elegir forma
        </p>
        {menuEntries.map(({ index, label }) => (
          <button
            key={`${index}-${label}`}
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-center px-3 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-indigo-500/10 dark:text-slate-100 dark:hover:bg-indigo-500/20"
            onClick={() => pickVariant(label, index)}
          >
            {label}
            {menuCfg && index === menuCfg.defaultIndex ? (
              <span className="ml-2 shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-200">
                predeterm.
              </span>
            ) : null}
          </button>
        ))}
      </div>,
      document.body,
    )

  return (
    <div
      ref={rootRef}
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
        aria-haspopup={hasVariantMenu ? 'menu' : undefined}
        aria-expanded={hasVariantMenu ? menuOpen : undefined}
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

      {hasVariantMenu && !isLocked && (
        <button
          type="button"
          className="ui-chip absolute bottom-1.5 right-1.5 z-[2] inline-flex items-center justify-center rounded-lg p-1"
          style={{ color: textColor }}
          aria-label="Elegir otra forma de la palabra"
          title="Variantes (sin mantener pulsado)"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (menuOpen) setMenuOpen(false)
            else openMenu()
          }}
        >
          <Layers size={folderBadgeSize} strokeWidth={2} />
        </button>
      )}

      {menuPortal}
    </div>
  )
}
