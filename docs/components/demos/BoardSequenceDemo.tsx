'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Pictogramas ARASAAC (Sergio Palao / ARASAAC, CC BY-NC-SA) — `static.arasaac.org`. */
const arasaacPng = (id: number) =>
  `https://static.arasaac.org/pictograms/${id}/${id}_300.png`

type Cell = { pictogramId: number; label: string; tint: string }

const CELLS: Cell[] = [
  { pictogramId: 6964, label: 'Casa', tint: '#dbeafe' },
  { pictogramId: 32464, label: 'Agua', tint: '#e0f2fe' },
  { pictogramId: 6456, label: 'Comer', tint: '#fef3c7' },
  { pictogramId: 30196, label: 'Sentir', tint: '#fee2e2' },
  { pictogramId: 15905, label: 'Baño', tint: '#ffe8e0' },
  { pictogramId: 5397, label: 'Bien', tint: '#dcfce7' },
  { pictogramId: 3233, label: 'Carpeta', tint: '#f3f4f6' },
  { pictogramId: 7196, label: 'Parar', tint: '#ffedd5' },
]

type Step = { focus: number | null; phrase: string[] }

const SCRIPT: Step[] = [
  { focus: 0, phrase: [] },
  { focus: 0, phrase: ['Casa'] },
  { focus: 2, phrase: ['Casa', 'Comer'] },
  { focus: 1, phrase: ['Casa', 'Comer', 'Agua'] },
  { focus: null, phrase: ['Casa', 'Comer', 'Agua'] },
]

export function BoardSequenceDemo() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const current = SCRIPT[step % SCRIPT.length]!

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % SCRIPT.length), 2200)
    return () => window.clearInterval(id)
  }, [reduce])

  const phrase = useMemo(() => current.phrase, [current])

  return (
    <div className="docs-demo" aria-label="Demostración animada del tablero">
      <p className="docs-demo-label">Así se construye una frase</p>
      <div className="docs-board-demo">
        <div className="docs-board-grid" role="img" aria-hidden>
          {CELLS.map((c, i) => {
            const hot = current.focus === i
            return (
              <motion.div
                key={c.label}
                className={`docs-board-cell${hot ? ' docs-board-cell--hot' : ''}`}
                style={{ background: c.tint }}
                animate={hot ? { scale: [1, 1.06, 1.04], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              >
                <img
                  className="docs-board-picto"
                  src={arasaacPng(c.pictogramId)}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                />
                <span className="docs-board-cell-label">{c.label}</span>
              </motion.div>
            )
          })}
        </div>
        <div className="docs-board-phrase" aria-live="polite">
          <span className="docs-board-phrase-label">Frase</span>
          <div className="docs-board-chips">
            <AnimatePresence mode="popLayout">
              {phrase.map((word, wi) => (
                <motion.span
                  key={`${step}-${wi}-${word}`}
                  layout
                  className="docs-board-chip"
                  initial={{ opacity: 0, x: 12, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  {word}
                </motion.span>
              ))}
            </AnimatePresence>
            {phrase.length === 0 ? <span className="docs-board-placeholder">Toca símbolos en el tablero…</span> : null}
          </div>
        </div>
      </div>
      <p className="docs-demo-caption">
        Así se encadenan pictos en la barra de frase: tocas, lees en voz alta y, si quieres, pides sugerencias para seguir
        hablando. Pictogramas: Sergio Palao / ARASAAC (CC BY-NC-SA).
      </p>
    </div>
  )
}
