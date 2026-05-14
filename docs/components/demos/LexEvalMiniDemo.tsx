'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const CHIPS = ['casa', 'comer', 'ayuda', 'hoy']

const BAR_LABELS = ['Casa', 'Comida', 'Ayuda', 'Tiempo']

/** Dos “instantáneas” de porcentajes relativos (solo ilustración). */
const BAR_SNAPSHOTS: number[][] = [
  [52, 72, 44, 58],
  [60, 64, 56, 62],
]

export function LexEvalMiniDemo() {
  const reduce = useReducedMotion()
  const [chip, setChip] = useState(0)
  const [snap, setSnap] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setChip((n) => (n + 1) % CHIPS.length)
      setSnap((n) => (n + 1) % BAR_SNAPSHOTS.length)
    }, 2100)
    return () => window.clearInterval(id)
  }, [reduce])

  const heights = BAR_SNAPSHOTS[reduce ? 0 : snap]!

  return (
    <div className="docs-demo docs-lexeval-demo" aria-label="Demostración de léxico y evaluación de uso">
      <p className="docs-demo-label">Léxico y tendencias (ilustración)</p>

      <div className="docs-lexeval-block">
        <p className="docs-lexeval-sub">Palabras que el sistema va reconociendo</p>
        <div className="docs-lexeval-chips">
          {CHIPS.map((w, idx) => {
            const hot = !reduce && idx === chip
            return (
              <motion.span
                key={w}
                className={`docs-lexeval-chip${hot ? ' docs-lexeval-chip--hot' : ''}`}
                animate={reduce ? {} : hot ? { y: [0, -4, 0], scale: [1, 1.06, 1] } : { y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {w}
              </motion.span>
            )
          })}
        </div>
      </div>

      <div className="docs-lexeval-block">
        <p className="docs-lexeval-sub">Uso por categoría en el periodo</p>
        <div className="docs-lexeval-bars" role="img" aria-hidden>
          {BAR_LABELS.map((label, i) => (
            <div key={label} className="docs-lexeval-bar-column">
              <div className="docs-lexeval-bar-track">
                <motion.div
                  className="docs-lexeval-bar-fill"
                  initial={false}
                  animate={{ height: `${heights[i]}%` }}
                  transition={
                    reduce ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 26 }
                  }
                />
              </div>
              <span className="docs-lexeval-bar-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="docs-demo-caption">
        El léxico mejora las sugerencias con el uso; los informes del panel muestran patrones por periodo para decidir
        cambios en el tablero con calma.
      </p>
    </div>
  )
}
