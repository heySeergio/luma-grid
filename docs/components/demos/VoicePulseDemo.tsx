'use client'

import { motion, useReducedMotion } from 'framer-motion'

const bars = [0, 1, 2, 3, 4]

export function VoicePulseDemo() {
  const reduce = useReducedMotion()

  return (
    <div className="docs-demo" aria-label="Demostración de ondas de voz">
      <p className="docs-demo-label">Voz en acción</p>
      <div className="docs-voice-demo">
        <div className="docs-voice-bars" role="presentation">
          {bars.map((i) => (
            <motion.span
              key={i}
              className="docs-voice-bar"
              animate={
                reduce
                  ? { scaleY: 0.45 }
                  : { scaleY: [0.35, 1, 0.45, 0.9, 0.35], opacity: [0.65, 1, 0.75, 1, 0.65] }
              }
              transition={{
                duration: 1.1,
                repeat: reduce ? 0 : Infinity,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
              style={{ transformOrigin: '50% 100%' }}
            />
          ))}
        </div>
        <p className="docs-voice-caption">«Casa comer agua»</p>
      </div>
      <p className="docs-demo-caption">Al pulsar hablar, el dispositivo lee la frase con la voz configurada en tu cuenta.</p>
    </div>
  )
}
