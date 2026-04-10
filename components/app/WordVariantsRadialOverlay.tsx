'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import type { Symbol } from '@/lib/supabase/types'
import type { WordVariantsConfig } from '@/lib/symbolWordVariants'
import { listVariantMenuEntries } from '@/lib/symbolWordVariants'
import { getSymbolTextColor, resolveSymbolColor } from '@/lib/ui/symbolColors'
import type { SymbolGridDensity } from '@/components/app/SymbolCell'

type Props = {
  symbol: Symbol
  cfg: WordVariantsConfig
  gridDensity: SymbolGridDensity
  onPick: (phraseLabel: string, variantIndex: number) => void
  onClose: () => void
}

const MARGIN = 6

type Side = 'left' | 'right' | 'top' | 'bottom'

function sideForSlotIndex(index: number): Side {
  if (index === 0) return 'left'
  if (index === 1) return 'right'
  if (index === 2) return 'top'
  return 'bottom'
}

/** Lee row-gap y column-gap del grid (mismo tamaño que las celdas del tablero). */
function readGridGaps(grid: HTMLElement | null): { col: number; row: number } {
  if (!grid) return { col: 8, row: 8 }
  const s = getComputedStyle(grid)
  const row = parseFloat(s.rowGap) || 0
  const col = parseFloat(s.columnGap) || 0
  if (row > 0 && col > 0) return { col, row }
  const g = s.gap || '8px'
  const parts = g
    .trim()
    .split(/\s+/)
    .map((p) => parseFloat(p))
    .filter((n) => !Number.isNaN(n))
  if (parts.length === 0) return { col: 8, row: 8 }
  if (parts.length === 1) return { col: parts[0], row: parts[0] }
  return { row: parts[0], col: parts[1] }
}

function positionForSide(
  rect: DOMRect,
  side: Side,
  gaps: { col: number; row: number },
  vw: number,
  vh: number,
): { left: number; top: number } {
  const W = rect.width
  const H = rect.height
  const { col: colGap, row: rowGap } = gaps
  let left = 0
  let top = 0
  if (side === 'left') {
    left = rect.left - colGap - W
    top = rect.top
  } else if (side === 'right') {
    left = rect.right + colGap
    top = rect.top
  } else if (side === 'top') {
    left = rect.left
    top = rect.top - rowGap - H
  } else {
    left = rect.left
    top = rect.bottom + rowGap
  }
  left = Math.max(MARGIN, Math.min(left, vw - W - MARGIN))
  top = Math.max(MARGIN, Math.min(top, vh - H - MARGIN))
  return { left, top }
}

const labelSizeFull: Record<SymbolGridDensity, string> = {
  sparse: 'text-sm sm:text-base md:text-lg',
  comfortable: 'text-xs sm:text-sm md:text-base',
  dense: 'text-xs md:text-sm',
}

const cellPaddingClass: Record<SymbolGridDensity, string> = {
  sparse: 'p-2 sm:p-2.5 md:p-3',
  comfortable: 'p-2 md:p-2',
  dense: 'p-1.5',
}

function imageBoxPxForDensity(d: SymbolGridDensity): number {
  if (d === 'sparse') return 120
  if (d === 'comfortable') return 88
  return 64
}

/** Resorte más vivo: menos “peso”, algo de elasticidad sin marear. */
const VARIANT_SPRING = {
  type: 'spring' as const,
  stiffness: 620,
  damping: 24,
  mass: 0.48,
  restDelta: 0.35,
  restSpeed: 1.2,
}

const STAGGER_MS = 0.022

export default function WordVariantsRadialOverlay({ symbol, cfg, gridDensity, onPick, onClose }: Props) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [gaps, setGaps] = useState<{ col: number; row: number }>({ col: 8, row: 8 })
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const prefersReducedMotion = useReducedMotion()

  const updateGeometry = useCallback(() => {
    if (typeof document === 'undefined') return
    const safeId = typeof CSS !== 'undefined' && 'escape' in CSS ? CSS.escape(symbol.id) : symbol.id
    const el = document.querySelector<HTMLElement>(`[data-symbol-id="${safeId}"]`)
    if (el) {
      setAnchorRect(el.getBoundingClientRect())
      const grid = el.closest<HTMLElement>('.aac-grid-surface')
      setGaps(readGridGaps(grid))
    }
    setViewport({ w: window.innerWidth, h: window.innerHeight })
  }, [symbol.id])

  useLayoutEffect(() => {
    updateGeometry()
  }, [updateGeometry])

  useEffect(() => {
    window.addEventListener('resize', updateGeometry)
    window.addEventListener('scroll', updateGeometry, true)
    return () => {
      window.removeEventListener('resize', updateGeometry)
      window.removeEventListener('scroll', updateGeometry, true)
    }
  }, [updateGeometry])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const entries = listVariantMenuEntries(cfg)
  const bg = resolveSymbolColor(symbol.color) || 'var(--app-surface-elevated)'
  const fg = getSymbolTextColor(symbol.color)
  const pad = cellPaddingClass[gridDensity]
  const labelClass = labelSizeFull[gridDensity]
  const maxImg = imageBoxPxForDensity(gridDensity)

  if (typeof document === 'undefined' || !anchorRect) return null

  const W = anchorRect.width
  const H = anchorRect.height
  const imgSize = Math.max(32, Math.min(maxImg, Math.floor(Math.min(W, H) * 0.42)))

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[238]"
        style={{ background: 'transparent' }}
        aria-hidden
        onPointerDown={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-[245]">
        {entries.map(({ index, label, imageUrl }, slotOrder) => {
          const side = sideForSlotIndex(index)
          const { left, top } = positionForSide(
            anchorRect,
            side,
            gaps,
            viewport.w || window.innerWidth,
            viewport.h || window.innerHeight,
          )
          const isDefault = cfg.defaultIndex === index
          const hasVariantGlyph = Boolean(imageUrl?.trim())
          const ax = anchorRect.left
          const ay = anchorRect.top
          const instant = prefersReducedMotion
          return (
            <motion.button
              key={index}
              type="button"
              initial={
                instant
                  ? { left, top, width: W, height: H, scale: 1, opacity: 1 }
                  : {
                      left: ax,
                      top: ay,
                      width: W,
                      height: H,
                      scale: 0.97,
                      opacity: 0.88,
                    }
              }
              animate={{ left, top, width: W, height: H, scale: 1, opacity: 1 }}
              transition={
                instant
                  ? { duration: 0 }
                  : {
                      ...VARIANT_SPRING,
                      delay: slotOrder * STAGGER_MS,
                      opacity: {
                        duration: 0.16,
                        ease: [0.22, 1, 0.36, 1],
                        delay: slotOrder * STAGGER_MS,
                      },
                    }
              }
              style={{
                position: 'fixed',
                zIndex: 246,
                boxShadow: 'var(--card-shadow)',
                backgroundColor: bg,
                color: fg,
                transformOrigin: 'center center',
              }}
              whileTap={
                instant
                  ? undefined
                  : {
                      scale: 0.97,
                      transition: { type: 'spring', stiffness: 700, damping: 32, mass: 0.35 },
                    }
              }
              className={`pointer-events-auto flex flex-col items-stretch overflow-hidden rounded-[1.35rem] border text-left ${
                isDefault ? 'border-indigo-500 ring-2 ring-indigo-400/60' : 'border-[var(--app-border)]'
              } ${pad}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onPick(label, index)}
              title={label}
              aria-label={label}
            >
              <span className="flex min-h-0 flex-1 flex-col items-stretch justify-center">
                {!hasVariantGlyph ? (
                  <span
                    className={`flex min-h-0 w-full flex-1 items-center justify-center px-0.5 text-center font-semibold leading-tight ${labelClass} line-clamp-4`}
                  >
                    {label}
                  </span>
                ) : (
                  <>
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5 pt-0.5">
                      <span className="relative flex max-h-full max-w-full flex-1 items-center justify-center">
                        <Image
                          src={imageUrl!}
                          alt=""
                          width={imgSize}
                          height={imgSize}
                          className="max-h-full max-w-full object-contain"
                          unoptimized
                        />
                      </span>
                    </div>
                    <span
                      className={`shrink-0 px-0.5 pb-0.5 text-center font-semibold leading-tight line-clamp-2 ${labelClass}`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>
    </>,
    document.body,
  )
}
