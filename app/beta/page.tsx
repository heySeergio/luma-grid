import type { Metadata } from 'next'

import BetaPageContent from '@/components/site/pages/BetaPageContent'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = {
  title: 'Beta cerrada',
  description:
    'Información para participantes de la beta cerrada de Luma Grid: cómo reportar fallos, proponer mejoras y contactar con el equipo.',
  alternates: { canonical: '/beta' },
  robots: { index: false, follow: false },
}

export default function BetaPage() {
  return (
    <MarketingSiteShell comingSoon={isLandingComingSoon()}>
      <BetaPageContent />
    </MarketingSiteShell>
  )
}
