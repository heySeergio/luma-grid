'use client'

import { startTransition, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import {
  HERO_COMPOSITION_ARTBOARD,
  HERO_COMPOSITION_LAYOUT,
  HERO_COMPOSITION_Z_INDEX,
} from '@/lib/landing/heroCompositionLayout'
import {
  heroDecorInnerMotion,
  heroDecorOuterFade,
  type HeroDecorId,
} from '@/lib/landing/heroDecorMotion'
const NINA_SRC = `/images/hero/${encodeURIComponent('Niña.svg')}`

const TABLET_FRAME_MS = [3000, 2000, 2000, 2000, 2000, 5000] as const
const TABLET_FRAME_COUNT = TABLET_FRAME_MS.length

const STATIC_ITEMS = [
  { id: 'speech' as const, src: '/images/hero/Speech.svg' },
  { id: 'cara' as const, src: '/images/hero/Cara.svg' },
  { id: 'nina' as const, src: NINA_SRC },
] as const

function useCollectiveScale(artboardWidth: number) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const update = () => {
      const available = host.clientWidth
      if (available <= 0) return
      setScale(available / artboardWidth)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [artboardWidth])

  return { hostRef, scale }
}

function HeroCompositionDecor({
  id,
  ready,
  reduceMotion,
  box,
  children,
}: {
  id: HeroDecorId
  ready: boolean
  reduceMotion: boolean
  box: { left: number; top: number; width: number }
  children: ReactNode
}) {
  const outer = heroDecorOuterFade(id, ready, reduceMotion)
  const inner = heroDecorInnerMotion(id, ready, reduceMotion)

  const style: CSSProperties = {
    position: 'absolute',
    left: box.left,
    top: box.top,
    width: box.width,
    zIndex: HERO_COMPOSITION_Z_INDEX[id],
  }

  return (
    <motion.div
      style={style}
      initial={false}
      animate={outer.animate}
      transition={outer.transition}
      aria-hidden
    >
      <motion.div
        className="origin-center will-change-transform [&_img]:block [&_img]:w-full [&_img]:max-w-none"
        initial={false}
        animate={inner.animate}
        transition={inner.transition}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function HeroCompositionTablet({ frame, reduceMotion }: { frame: number; reduceMotion: boolean }) {
  const src = `/images/hero/tablet/${reduceMotion ? 0 : frame}.png`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="aspect-[1213/911] w-full max-w-none" />
  )
}

type HeroCompositionProps = {
  className?: string
}

/** Composición hero del landing: layout fijo, escala colectiva en responsive. */
export function HeroComposition({ className }: HeroCompositionProps) {
  const [ready, setReady] = useState(false)
  const [tabletFrame, setTabletFrame] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const reduceMotion = Boolean(prefersReducedMotion)
  const { hostRef, scale } = useCollectiveScale(HERO_COMPOSITION_ARTBOARD.width)

  useEffect(() => {
    startTransition(() => setReady(true))
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setTimeout(() => {
      setTabletFrame((f) => (f + 1) % TABLET_FRAME_COUNT)
    }, TABLET_FRAME_MS[tabletFrame])
    return () => window.clearTimeout(id)
  }, [tabletFrame, reduceMotion])

  const scaledHeight = HERO_COMPOSITION_ARTBOARD.height * scale

  return (
    <div ref={hostRef} className={className} style={{ width: '100%', height: scaledHeight }}>
      <div
        className="relative origin-top-left"
        style={{
          width: HERO_COMPOSITION_ARTBOARD.width,
          height: HERO_COMPOSITION_ARTBOARD.height,
          transform: `scale(${scale})`,
        }}
      >
        <HeroCompositionDecor
          id="tablet"
          ready={ready}
          reduceMotion={reduceMotion}
          box={HERO_COMPOSITION_LAYOUT.tablet}
        >
          <HeroCompositionTablet frame={tabletFrame} reduceMotion={reduceMotion} />
        </HeroCompositionDecor>

        {STATIC_ITEMS.map((item) => (
          <HeroCompositionDecor
            key={item.id}
            id={item.id}
            ready={ready}
            reduceMotion={reduceMotion}
            box={HERO_COMPOSITION_LAYOUT[item.id]}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" />
          </HeroCompositionDecor>
        ))}
      </div>
    </div>
  )
}
