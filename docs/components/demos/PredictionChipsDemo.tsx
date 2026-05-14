'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const CHIPS = ['quiero', 'más', 'ayuda']

export function PredictionChipsDemo() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setI((n) => (n + 1) % CHIPS.length), 1400)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="docs-demo" aria-label="Demostración de predicción">
      <p className="docs-demo-label">Sugerencias que siguen el contexto</p>
      <div className="docs-pred-demo">
        {CHIPS.map((w, idx) => {
          const hot = idx === i
          return (
            <motion.span
              key={w}
              className={`docs-pred-chip${hot ? ' docs-pred-chip--hot' : ''}`}
              animate={hot ? { y: [0, -3, 0], scale: [1, 1.04, 1] } : { y: 0, scale: 1 }}
              transition={{ duration: 0.55 }}
            >
              {w}
            </motion.span>
          )
        })}
      </div>
      <p className="docs-demo-caption">Las sugerencias cambian según lo que ya has dicho: combina léxico y tus hábitos en el tablero.</p>
    </div>
  )
}
