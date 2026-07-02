import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'

import PricingCards from '@/components/plan/PricingCards'
import { MarketingFooter } from '@/components/landing/MarketingFooter'
import DonationPartnerLogos from '@/components/site/DonationPartnerLogos'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = {
  title: 'Planes y precios',
  description:
    'Consulta los planes de Luma Grid: plan gratuito y planes de pago con voces naturales, más tableros y funciones avanzadas.',
  alternates: { canonical: '/planes' },
  openGraph: {
    title: 'Planes y precios · Luma Grid',
    description:
      'Plan gratuito y planes de pago con voces naturales, más tableros y clonación de voz.',
    url: '/planes',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Luma Grid',
  },
  twitter: {
    card: 'summary',
    title: 'Planes y precios · Luma Grid',
    description:
      'Plan gratuito y planes de pago con voces naturales, más tableros y clonación de voz.',
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

          <header className="mt-8 rounded-[22px] border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">Planes</p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight text-forest sm:text-4xl md:text-5xl">
              Elige cómo quieres hablar con Luma Grid
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-forest/80 md:text-lg">
              Puedes empezar gratis sin tarjeta. Los planes de pago incluyen voces naturales y realistas —cercanas a
              una voz humana—, más tableros y funciones avanzadas según el plan.
            </p>
          </header>

          <div className="mt-10 rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-8 md:p-10">
            <PricingCards variant="landing" displayOnly />
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <p className="flex items-start justify-center gap-2 text-left text-xs leading-relaxed text-forest/65 md:text-sm">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-500/90" strokeWidth={2} aria-hidden />
              <span>
                El 1% del beneficio neto de Luma Grid se dona trimestralmente a ARASAAC, Confederación Autismo España y
                Protectora Huellas Ávila.
              </span>
            </p>
            <DonationPartnerLogos className="mt-5" />
          </div>
        </div>
      </main>
      <MarketingFooter />
    </MarketingSiteShell>
  )
}
