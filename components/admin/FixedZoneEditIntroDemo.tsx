'use client'

import { isPositionInBaseFixedZone } from '@/lib/grid/baseFixedZone'

const DEMO_COLS = 12
const DEMO_ROWS = 4

/**
 * Mini grid de ejemplo: muestra la forma típica de la base fija (7 columnas izquierda + 1.ª fila).
 */
export default function FixedZoneEditIntroDemo() {
  return (
    <div
      className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-slate-50/80 p-3 shadow-inner dark:border-violet-500/30 dark:from-violet-950/40 dark:to-slate-900/80"
      aria-hidden
    >
      <div
        className="grid w-full gap-0.5"
        style={{ gridTemplateColumns: `repeat(${DEMO_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: DEMO_COLS * DEMO_ROWS }).map((_, i) => {
          const x = i % DEMO_COLS
          const y = Math.floor(i / DEMO_COLS)
          const fixed = isPositionInBaseFixedZone(x, y, DEMO_COLS, DEMO_ROWS)
          return (
            <div
              key={i}
              className={`aspect-square rounded-[2px] transition-colors duration-500 ${
                fixed
                  ? 'animate-pulse bg-violet-500/60 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.55)] dark:bg-violet-500/45'
                  : 'bg-slate-300/30 dark:bg-slate-600/35'
              }`}
            />
          )
        })}
      </div>
      <p className="mt-2.5 text-center text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        Ejemplo de plantilla por defecto: zona fija en violeta; el resto del grid cambia con cada carpeta.
      </p>
    </div>
  )
}
