'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

import {
  CtaBannerDecors,
  CTA_ENTRANCE_DURATION,
  CTA_GLOBAL_OFFSET_SEC,
} from '@/components/landing/CtaBannerDecors'
import { useDelayedSectionReveal } from '@/components/landing/useDelayedSectionReveal'
import { useIsMobileLayout } from '@/lib/hooks/useIsMobileLayout'

const easeOut = [0.22, 1, 0.36, 1] as const

type CtaBannerClientProps = {
  moverEnabled: boolean
  comingSoon?: boolean
}

export function CtaBannerClient({ moverEnabled, comingSoon = true }: CtaBannerClientProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const reduceMotion = useReducedMotion()
  const { revealed } = useDelayedSectionReveal(rootRef)
  const isMobileLayout = useIsMobileLayout()
  const ctaEntranceDelay = isMobileLayout ? 0 : CTA_GLOBAL_OFFSET_SEC

  const instant = reduceMotion === true
  const entranceStarted = instant || revealed

  return (
    <div
      ref={rootRef}
      className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[var(--luma-marketing-cta-yellow)] shadow-inner shadow-black/5"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block lg:w-[55%]" aria-hidden>
        <CtaBannerDecors
          moverEnabled={moverEnabled}
          entranceStarted={entranceStarted}
          instantEntrance={instant}
        />
      </div>

      <motion.div
        className="relative z-10 px-6 py-14 sm:px-12 sm:py-16 md:max-w-[58%] lg:max-w-[52%]"
        initial={instant ? false : { opacity: 0 }}
        animate={entranceStarted ? { opacity: 1 } : { opacity: 0 }}
        transition={
          instant
            ? { duration: 0 }
            : {
                duration: CTA_ENTRANCE_DURATION,
                ease: easeOut,
                delay: ctaEntranceDelay,
              }
        }
      >
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-forest sm:text-4xl">
          Empieza a comunicarte <span className="text-accent-blue">a tu manera.</span>
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-forest sm:text-lg">
          Únete a miles de personas que usan Luma Grid para expresarse, aprender y conectar.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {comingSoon ? (
            <Link
              href="/#recursos"
              className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-900"
            >
              Únete a la lista de espera
            </Link>
          ) : (
            <Link
              href="/tablero"
              className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-900"
            >
              Entrar al tablero
            </Link>
          )}
          <Link
            href="/#funciones"
            className="text-sm font-bold text-forest underline-offset-4 transition hover:underline"
          >
            Ver demo →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
