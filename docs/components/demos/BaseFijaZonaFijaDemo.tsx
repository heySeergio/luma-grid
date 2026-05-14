'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const PINNED = ['Sí', 'No', 'Parar'] as const

const MAIN_LABELS = ['Yo', 'Tú', 'Casa', 'Comer'] as const
const FOLDER_LABELS = ['Fruta', 'Beber', 'Postre', 'Volver'] as const

export function BaseFijaZonaFijaDemo() {
  const reduce = useReducedMotion()
  const [inFolder, setInFolder] = useState(false)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setInFolder((v) => !v), 3200)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="docs-demo docs-fixed-zone-demo" aria-label="Demostración de zona fija frente al resto del tablero">
      <p className="docs-demo-label">Zona fija y rejilla que cambia</p>
      <div className="docs-fixed-zone-stage" aria-hidden>
        <div className="docs-fixed-zone-rail">
          <span className="docs-fixed-zone-rail-tag">Zona fija</span>
          <motion.div
            className="docs-fixed-zone-pinned"
            animate={
              reduce
                ? {}
                : {
                    boxShadow: [
                      '0 0 0 0 color-mix(in srgb, var(--docs-accent) 0%, transparent)',
                      '0 0 0 4px color-mix(in srgb, var(--docs-accent) 18%, transparent)',
                      '0 0 0 0 color-mix(in srgb, var(--docs-accent) 0%, transparent)',
                    ],
                  }
            }
            transition={reduce ? { duration: 0 } : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {PINNED.map((t) => (
              <span key={t} className="docs-fixed-zone-chip docs-fixed-zone-chip--pinned">
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="docs-fixed-zone-lower">
          <div className="docs-fixed-zone-lower-cap">
            <motion.span
              className="docs-fixed-zone-hint"
              key={inFolder ? 'f' : 'm'}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {inFolder ? 'Dentro de una carpeta…' : 'Rejilla principal'}
            </motion.span>
          </div>
          <div className="docs-fixed-zone-swappable">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={inFolder ? 'folder' : 'main'}
                className="docs-fixed-zone-grid"
                initial={reduce ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -14 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {(inFolder ? FOLDER_LABELS : MAIN_LABELS).map((t) => (
                  <span key={t} className="docs-fixed-zone-chip">
                    {t}
                  </span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="docs-demo-caption">
        La <strong>zona fija</strong> (suele ser la primera fila) permanece como ancla; al abrir carpetas cambia lo de
        abajo, no lo esencial que dejaste fijado arriba.
      </p>
    </div>
  )
}
