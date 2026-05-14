'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Pictogramas ARASAAC (Sergio Palao / ARASAAC, CC BY-NC-SA) — `static.arasaac.org`. */
const arasaacPng = (id: number) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`

/** «Abuelo» (masculino), pictograma en color AAC. */
const ABAUELO_PICTO_ID = 23718

const RADIUS = 102

/** Cuatro variantes en cruz (arriba, derecha, abajo, izquierda). */
const VARIANTS = [
  { label: 'abuela', angle: -90 },
  { label: 'abuelos', angle: 0 },
  { label: 'abuelas', angle: 90 },
  { label: 'abuelo', angle: 180 },
]

function polarToCss(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  const x = Math.cos(rad) * RADIUS
  const y = Math.sin(rad) * RADIUS
  return { x, y }
}

export function WordVariantsRadialDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % VARIANTS.length)
    }, 1100)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="docs-demo docs-variants-demo" aria-label="Demostración animada de variantes de palabra">
      <p className="docs-demo-label">Menú circular de variantes</p>
      <div className="docs-variants-stage">
        <div className="docs-variants-ring" aria-hidden />
        <div className="docs-variants-center-wrap">
          <motion.div
            className="docs-variants-center"
            animate={reduce ? {} : { scale: [1, 1.03, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              className="docs-variants-center-picto"
              src={arasaacPng(ABAUELO_PICTO_ID)}
              alt=""
              width={88}
              height={88}
              loading="lazy"
              decoding="async"
            />
            <span className="docs-variants-center-label">Abuelo</span>
          </motion.div>
        </div>

        {VARIANTS.map((v, i) => {
          const { x, y } = polarToCss(v.angle)
          const isHot = i === active
          return (
            <div
              key={v.label}
              className={`docs-variants-chip-anchor${isHot ? ' docs-variants-chip-anchor--hot' : ''}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <motion.span
                role="presentation"
                className={`docs-variants-chip${isHot ? ' docs-variants-chip--hot' : ''}`}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={
                  reduce
                    ? { scale: 1, opacity: 1 }
                    : {
                        scale: isHot ? 1.08 : 1,
                        opacity: 1,
                      }
                }
                transition={{
                  scale: { type: 'spring', stiffness: 420, damping: 22 },
                  opacity: { delay: i * 0.07, duration: 0.35 },
                }}
                aria-hidden
              >
                {v.label}
              </motion.span>
            </div>
          )
        })}
      </div>
      <p className="docs-demo-caption">
        Ilustración simplificada: al pulsar un picto con variantes, aparecen opciones alrededor; eliges una y se añade a
        la frase con la forma correcta (por ejemplo, abuela, abuelos o abuelas en lugar de abuelo).
      </p>
    </div>
  )
}
