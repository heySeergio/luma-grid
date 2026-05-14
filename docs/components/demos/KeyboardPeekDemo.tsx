'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

type KeyboardPeekDemoProps = {
  /** Texto del rótulo encima del teclado (por defecto: “Teclado integrado”). */
  demoLabel?: string
  /** Pie del bloque demo. */
  caption?: string
}

export function KeyboardPeekDemo({
  demoLabel = 'Teclado integrado',
  caption = 'Cambia a la pestaña de teclado cuando quieras escribir con letras o combinar pictos y texto.',
}: KeyboardPeekDemoProps) {
  const reduce = useReducedMotion()
  const [key, setKey] = useState<{ r: number; c: number } | null>({ r: 1, c: 3 })

  useEffect(() => {
    if (reduce) return
    const seq = [
      { r: 1, c: 3 },
      { r: 0, c: 4 },
      { r: 2, c: 2 },
      { r: 0, c: 2 },
    ]
    let i = 0
    const id = window.setInterval(() => {
      i = (i + 1) % seq.length
      setKey(seq[i]!)
    }, 700)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="docs-demo" aria-label="Demostración del teclado">
      <p className="docs-demo-label">{demoLabel}</p>
      <div className="docs-kb-wrap">
        {ROWS.map((row, ri) => (
          <div key={ri} className="docs-kb-row">
            {row.map((k, ci) => {
              const hot = key?.r === ri && key?.c === ci
              return (
                <motion.span
                  key={k}
                  className={`docs-kb-key${hot ? ' docs-kb-key--hot' : ''}`}
                  animate={hot ? { scale: [1, 1.12, 1.05], backgroundColor: ['#fff', '#ffe4dc', '#fff0eb'] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  {k}
                </motion.span>
              )
            })}
          </div>
        ))}
      </div>
      <p className="docs-demo-caption">{caption}</p>
    </div>
  )
}
