'use client'

import { useLayoutEffect, useRef } from 'react'

/** Suelo legible; por debajo el texto casi no se lee pero evita “…” o cortes raros */
const MIN_FONT_PX = 6

function fitFontToWidth(container: HTMLElement, el: HTMLElement) {
  const cw = container.clientWidth
  if (cw < 2) return

  el.style.whiteSpace = 'nowrap'
  el.style.fontSize = ''
  void el.offsetHeight

  const maxPx = parseFloat(getComputedStyle(el).fontSize)
  if (!Number.isFinite(maxPx) || maxPx <= MIN_FONT_PX) {
    el.style.fontSize = `${MIN_FONT_PX}px`
    return
  }

  el.style.fontSize = `${maxPx}px`
  if (el.scrollWidth <= cw + 0.5) return

  let lo = MIN_FONT_PX
  let hi = maxPx
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2
    el.style.fontSize = `${mid}px`
    if (el.scrollWidth <= cw + 0.5) lo = mid
    else hi = mid
    if (hi - lo < 0.35) break
  }
  el.style.fontSize = `${Math.max(MIN_FONT_PX, lo)}px`
}

type Props = {
  label: string
  textColor: string
  /** Clases Tailwind con el tamaño máximo (p. ej. CELL_LABEL[dense]) */
  labelClassName: string
  /** Clases extra en el contenedor ancho (p. ej. flex-1) */
  wrapperClassName?: string
}

/**
 * Una sola línea: reduce font-size hasta que el texto quepa; sin saltos ni puntos suspensivos.
 */
export default function SymbolCellAutoFitLabel({
  label,
  textColor,
  labelClassName,
  wrapperClassName = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const run = () => {
      fitFontToWidth(container, text)
    }

    run()
    const ro = new ResizeObserver(() => {
      run()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [label, labelClassName])

  return (
    <div
      ref={containerRef}
      className={`symbol-cell__label--adaptive w-full min-w-0 text-center ${wrapperClassName}`.trim()}
    >
      <span
        ref={textRef}
        className={`inline-block max-w-full font-semibold leading-none ${labelClassName}`}
        style={{ color: textColor }}
      >
        {label}
      </span>
    </div>
  )
}
