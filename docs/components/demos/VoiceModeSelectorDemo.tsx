'use client'

import { useEffect, useState } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'

const MODES = [
  { id: 'system', label: 'Voz del sistema', hint: 'La del móvil o tableta' },
  { id: 'ai', label: 'Voz con IA', hint: 'Más natural, según plan' },
  { id: 'clone', label: 'Clonar voz', hint: 'Entrenada con muestras' },
] as const

export function VoiceModeSelectorDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % MODES.length)
    }, 2600)
    return () => window.clearInterval(id)
  }, [reduce, paused])

  const pick = (i: number) => {
    setActive(i)
    setPaused(true)
  }

  return (
    <div className="docs-demo docs-voice-mode-demo" aria-label="Demostración del selector de tipo de voz">
      <p className="docs-demo-label">Tipo de voz</p>
      <LayoutGroup id="docs-voice-mode">
        <div className="docs-voice-mode-track" role="tablist" aria-label="Opciones de voz para leer la frase">
          {MODES.map((m, i) => {
            const isOn = i === active
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={isOn}
                aria-label={`${m.label}. ${m.hint}`}
                className={`docs-voice-mode-tab${isOn ? ' docs-voice-mode-tab--active' : ''}`}
                onClick={() => pick(i)}
              >
                {isOn ? (
                  <motion.span
                    layoutId="docsVoiceModePill"
                    className="docs-voice-mode-pill"
                    transition={
                      reduce ? { duration: 0 } : { type: 'spring', stiffness: 440, damping: 32 }
                    }
                  />
                ) : null}
                <span className="docs-voice-mode-tab-label">{m.label}</span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>
      <p className="docs-voice-mode-active-hint" aria-live="polite">
        {MODES[active]!.hint}
      </p>
      <p className="docs-demo-caption">
        Puedes elegir entre la voz del sistema, una voz generada con IA o un modelo clonado, según lo que ofrezca tu
        cuenta. Toca una opción para pausar la demo automática.
      </p>
    </div>
  )
}
