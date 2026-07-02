import type { Metadata } from 'next'
import Link from 'next/link'

import PlanesPricingPage from '@/components/plan/PlanesPricingPage'
import { MarketingFooter } from '@/components/landing/MarketingFooter'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = {
  title: 'Planes y precios',
  description:
    'Elige el plan LumaGrid que mejor se adapte a ti o a tu centro: Libre, Voz, Identidad y Terapeuta. Voces naturales, clonación de voz y herramientas para logopedas.',
  alternates: { canonical: '/planes' },
  openGraph: {
    title: 'Planes y precios · Luma Grid',
    description:
      'Planes Libre, Voz, Identidad y Terapeuta para comunicación AAC con IA, voces naturales y seguimiento clínico.',
    url: '/planes',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Luma Grid',
  },
  twitter: {
    card: 'summary',
    title: 'Planes y precios · Luma Grid',
    description:
      'Planes Libre, Voz, Identidad y Terapeuta para comunicación AAC con IA, voces naturales y seguimiento clínico.',
  },
}

export default function PlanesPage() {
  const comingSoon = isLandingComingSoon()

  return (
    <MarketingSiteShell comingSoon={comingSoon}>
      <main className="bg-canvas px-4 pb-16 pt-36 text-forest sm:pt-32 md:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm font-semibold text-forest/70">
            <Link
              href="/#inicio"
              className="text-forest underline-offset-4 transition hover:text-coral hover:underline"
            >
              ← Volver al inicio
            </Link>
          </p>

          <header className="mt-8 text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">Planes y precios</p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight text-forest sm:text-4xl md:text-5xl">
              Elige el plan que mejor se adapte{' '}
              <span className="text-[#35AA63]">a ti o a tu centro</span>
            </h1>
          </header>

          <div className="mt-10">
            <PlanesPricingPage />
          </div>
        </div>
      </main>
      <MarketingFooter />
    </MarketingSiteShell>
  )
}
