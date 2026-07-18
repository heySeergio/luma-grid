'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { BoardSequenceDemo } from '@/components/demos/BoardSequenceDemo'
import { Stagger } from '@/components/motion/Stagger'

const cards = [
  {
    href: '/empieza-aqui',
    title: 'Recorrido desde cero',
    desc: 'Del tablero al admin: base fija, pictos, variantes y léxico, en un solo hilo.',
    emoji: '🧭',
  },
  {
    href: '/voz-ia',
    title: 'Voz con IA',
    desc: 'Escucha tus frases y deja que la app te proponga palabras que encajan con lo que llevas dicho.',
    emoji: '🎙️',
  },
  {
    href: '/arasaac',
    title: 'Pictogramas ARASAAC',
    desc: 'Símbolos claros y reconocibles, del banco de pictos más usado en España y Latinoamérica.',
    emoji: '🧩',
  },
  {
    href: '/variantes',
    title: 'Variantes de palabra',
    desc: 'Elige entre formas de la misma idea (yo / tú, ayer / mañana…) sin llenar el tablero de botones repetidos.',
    emoji: '🔀',
  },
  {
    href: '/teclado-complementativo',
    title: 'Teclado complementativo',
    desc: 'Pictos y letras en la misma frase: en Luma Grid no hace falta renunciar al tablero para escribir con teclado.',
    emoji: '⌨️',
  },
  {
    href: '/lexico-y-evaluacion',
    title: 'Léxico y evaluación',
    desc: 'Cómo la app entiende mejor tus mensajes con el tiempo y cómo ver informes de uso en el panel.',
    emoji: '📊',
  },
  {
    href: '/empieza-aqui#editar-en-el-admin',
    title: 'Ordenar pictos en el admin',
    desc: 'En /admin puedes mantener pulsado y arrastrar símbolos para reordenar la rejilla; al guardar, el tablero recoge los cambios.',
    emoji: '↔️',
  },
  {
    href: '/guia',
    title: 'Ver todas las funciones',
    desc: 'Resumen en una sola página con enlaces a cada apartado.',
    emoji: '📖',
  },
  {
    href: '/preguntas',
    title: 'Preguntas frecuentes',
    desc: 'Respuestas cortas a lo más habitual. ¿Sigues con dudas? Escríbenos con el formulario de feedback; las respuestas se guardan y se revisan en stats.lumagrid.app.',
    emoji: '❓',
  },
] as const

export function HomeShowcase() {
  const reduce = useReducedMotion()

  return (
    <div className="docs-home">
      <motion.header
        className="docs-hero-block"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="docs-eyebrow">Guía para personas usuarias</p>
        <h1 className="docs-hero-title">Cómo sacar partido a Luma Grid</h1>
        <p className="docs-hero-lead">
          Luma Grid es una aplicación de <strong>comunicación aumentativa y alternativa (CAA)</strong> en español: eliges
          pictos, formas frases y puedes hacerlas oír. Aquí te explicamos, en lenguaje sencillo, las funciones que marcan
          la diferencia: recorrido completo en la app, voz, inteligencia artificial, pictogramas ARASAAC, variantes de
          palabra, teclado complementario al tablero y el léxico con informes de uso.
        </p>
      </motion.header>

      <motion.div
        className="docs-hero-demo-wrap"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <BoardSequenceDemo />
      </motion.div>

      <section className="docs-home-section" aria-labelledby="docs-home-features">
        <h2 id="docs-home-features" className="docs-home-h2">
          Funciones principales
        </h2>
        <Stagger className="docs-feature-grid docs-feature-grid--6">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="docs-feature-card docs-feature-card--rich" prefetch={false}>
              <span className="docs-feature-emoji" aria-hidden>
                {c.emoji}
              </span>
              <span className="docs-feature-title">{c.title}</span>
              <span className="docs-feature-desc">{c.desc}</span>
            </Link>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
