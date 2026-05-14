'use client'

import { motion, useReducedMotion } from 'framer-motion'

/** Pictogramas ARASAAC (Sergio Palao / ARASAAC, CC BY-NC-SA) — `static.arasaac.org`. */
const arasaacPng = (id: number) =>
  `https://static.arasaac.org/pictograms/${id}/${id}_300.png`

/** «Agua» — mismo pictograma que en `BoardSequenceDemo`. */
const AGUA_PICTO_ID = 32464

/** Desplazamiento en px entre centros de celdas (ancho + gap del layout). */
const STEP_X = 86

export function AdminDragGridDemo() {
  const reduce = useReducedMotion()

  return (
    <div className="docs-demo docs-admin-drag-demo" aria-label="Demostración de arrastrar símbolos en el panel admin">
      <p className="docs-demo-label">Arrastrar para reordenar</p>
      <div className="docs-admin-drag-stage" aria-hidden>
        <div className="docs-admin-drag-slots">
          <div className="docs-admin-drag-slot">
            <span className="docs-admin-drag-slot-h">A</span>
          </div>
          <div className="docs-admin-drag-slot docs-admin-drag-slot--mid">
            <span className="docs-admin-drag-slot-h">B</span>
          </div>
          <div className="docs-admin-drag-slot docs-admin-drag-slot--drop">
            <span className="docs-admin-drag-slot-h">C</span>
          </div>
        </div>
        <div className="docs-admin-drag-lane">
          <motion.div
            className="docs-admin-drag-chip"
            animate={
              reduce
                ? { x: 0, scale: 1 }
                : {
                    x: [0, STEP_X, STEP_X * 2, STEP_X, 0],
                    scale: [1, 1.06, 1.06, 1.06, 1],
                    boxShadow: [
                      '0 4px 14px rgba(28, 43, 36, 0.12)',
                      '0 14px 36px rgba(255, 107, 74, 0.28)',
                      '0 14px 36px rgba(255, 107, 74, 0.28)',
                      '0 14px 36px rgba(255, 107, 74, 0.22)',
                      '0 4px 14px rgba(28, 43, 36, 0.12)',
                    ],
                  }
            }
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 5.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.22, 0.48, 0.72, 1] }
            }
          >
            <img
              className="docs-admin-drag-chip-ico"
              src={arasaacPng(AGUA_PICTO_ID)}
              alt=""
              width={22}
              height={22}
              loading="lazy"
              decoding="async"
            />
            <span className="docs-admin-drag-chip-t">Agua</span>
          </motion.div>
          {!reduce ? (
            <motion.div
              className="docs-admin-drag-cursor"
              animate={{
                x: [18, STEP_X + 18, STEP_X * 2 + 18, STEP_X + 18, 18],
                y: [6, 4, 4, 4, 6],
                opacity: [0.45, 0.95, 0.95, 0.95, 0.45],
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.22, 0.48, 0.72, 1] }}
            />
          ) : null}
        </div>
        <p className="docs-admin-drag-hint">
          Pulsa y mantén, arrastra y suelta — el símbolo ocupa la celda donde lo sueltes.
        </p>
      </div>
      <p className="docs-demo-caption">
        Cuando termines de mover símbolos en la rejilla real, recuerda <strong>guardar</strong> en el panel para que el
        tablero los recoja.
      </p>
    </div>
  )
}
