'use client'

import { motion, useReducedMotion } from 'framer-motion'

const PHRASES = ['Hola', 'Sí', 'No', 'Gracias']

export function QuickPhrasesDemo() {
  const reduce = useReducedMotion()

  return (
    <div className="docs-demo" aria-label="Demostración de frases rápidas">
      <p className="docs-demo-label">Frases a un toque</p>
      <div className="docs-quick-row">
        {PHRASES.map((p, i) => (
          <motion.span
            key={p}
            className="docs-quick-pill"
            animate={reduce ? {} : { y: [0, -2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
          >
            {p}
          </motion.span>
        ))}
      </div>
      <p className="docs-demo-caption">Las frases que fijas aparecen arriba del tablero para repetirlas al instante.</p>
    </div>
  )
}
