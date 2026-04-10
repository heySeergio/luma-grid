'use client'

import type { WordVariantsConfig } from '@/lib/symbolWordVariants'

export type WordVariantsSchematicSize = 'board' | 'preview'

type Props = {
  /** Config ya normalizada (≥2 textos). */
  cfg: WordVariantsConfig
  size?: WordVariantsSchematicSize
  className?: string
}

/**
 * Esquema fijo: variante 1 = izquierda, 2 = derecha, 3 = arriba, 4 = abajo; centro = celda (toque corto).
 * Coincide con el diseño de “múltiples formas” (fila, T o cruz según cuántas variantes haya rellenas).
 */
export default function WordVariantsSchematic({ cfg, size = 'preview', className = '' }: Props) {
  const v = cfg.variants
  const hasTwo = v.filter((t) => t.trim().length > 0).length >= 2
  if (!hasTwo) return null

  const isBoard = size === 'board'
  const gap = isBoard ? 'gap-px' : 'gap-1'
  const cell = isBoard
    ? 'min-h-[14px] min-w-[14px] rounded-[5px] px-0.5 py-px text-[8px] leading-none sm:min-h-[15px] sm:min-w-[15px] sm:text-[9px]'
    : 'min-h-[26px] min-w-[26px] rounded-lg px-1 py-0.5 text-xs font-semibold'

  const centerCell = isBoard
    ? 'min-h-[14px] min-w-[14px] rounded-[5px] sm:min-h-[15px] sm:min-w-[15px]'
    : 'min-h-[26px] min-w-[26px] rounded-lg'

  const slotClass = (slotIndex: number) => {
    const isDef = cfg.defaultIndex === slotIndex
    return [
      'flex items-center justify-center border border-slate-900/85 bg-white font-bold tabular-nums text-slate-900 shadow-sm dark:border-slate-200/80 dark:bg-slate-50 dark:text-slate-900',
      cell,
      isDef
        ? isBoard
          ? 'border-2 border-indigo-600 dark:border-indigo-400'
          : 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
        : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  const emptyPad = isBoard ? 'min-h-[14px] min-w-0 sm:min-h-[15px]' : 'min-h-[26px] min-w-0'

  const renderSlot = (slotIndex: number) => {
    const t = v[slotIndex]?.trim() ?? ''
    if (!t) return <div key={`e-${slotIndex}`} className={emptyPad} aria-hidden />
    return (
      <div key={slotIndex} className={slotClass(slotIndex)} title={t}>
        {slotIndex + 1}
      </div>
    )
  }

  return (
    <div
      className={`inline-grid max-w-full ${className}`}
      role="img"
      aria-label="Esquema de formas: centro = celda; números 1–4 = posición de cada variante alrededor."
    >
      <div className={`grid grid-cols-3 ${gap} justify-items-stretch`} style={{ gridTemplateRows: 'auto auto auto' }}>
        <div className={emptyPad} aria-hidden />
        {renderSlot(2)}
        <div className={emptyPad} aria-hidden />
        {renderSlot(0)}
        <div
          className={`flex items-center justify-center border border-slate-800/70 bg-slate-400/90 dark:border-slate-600 dark:bg-slate-500 ${centerCell}`}
          aria-hidden
        />
        {renderSlot(1)}
        <div className={emptyPad} aria-hidden />
        {renderSlot(3)}
        <div className={emptyPad} aria-hidden />
      </div>
    </div>
  )
}
