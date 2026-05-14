'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const STEPS = [
  { key: 'tablero', label: 'Tablero', sub: '/tablero', hint: 'Comunicar' },
  { key: 'admin', label: 'Admin', sub: '/admin', hint: 'Configurar' },
] as const

export function OnboardingJourneyDemo() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setI((n) => (n + 1) % STEPS.length), 2000)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <div className="docs-demo docs-onboarding-demo" aria-label="Esquema animado del flujo tablero y admin">
      <p className="docs-demo-label">Flujo en dos pasos</p>
      <div className="docs-onboarding-rail" role="presentation">
        {STEPS.map((s, idx) => {
          const hot = !reduce && idx === i
          const connectorLit = !reduce && (idx === i || idx + 1 === i)
          return (
            <div key={s.key} className="docs-onboarding-segment">
              <motion.div
                className={`docs-onboarding-node${hot ? ' docs-onboarding-node--hot' : ''}`}
                animate={hot ? { scale: [1, 1.06, 1.03, 1], y: [0, -3, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              >
                <span className="docs-onboarding-node-path">{s.sub}</span>
                <span className="docs-onboarding-node-title">{s.label}</span>
                <span className="docs-onboarding-node-hint">{s.hint}</span>
              </motion.div>
              {idx < STEPS.length - 1 ? (
                <motion.div
                  className="docs-onboarding-connector"
                  aria-hidden
                  initial={false}
                  animate={{
                    opacity: reduce ? 0.4 : connectorLit ? 1 : 0.35,
                    scaleY: reduce ? 1 : connectorLit ? 1.35 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ) : null}
            </div>
          )
        })}
      </div>
      <p className="docs-demo-caption">
        Usas sobre todo <strong>/tablero</strong> para comunicar; cuando toca adaptar símbolos o la cuenta, entras en{' '}
        <strong>/admin</strong> y puedes volver al tablero cuando quieras.
      </p>
    </div>
  )
}
