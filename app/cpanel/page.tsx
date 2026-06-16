import type { Metadata } from 'next'

import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

import { CpanelClient } from './CpanelClient'

export const metadata: Metadata = {
  title: 'Panel de captaciones',
  robots: { index: false, follow: false },
}

export default async function CpanelPage() {
  const comingSoon = isLandingComingSoon()
  return (
    <MarketingSiteShell comingSoon={comingSoon}>
      <main className="bg-canvas px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-36 text-forest sm:pt-32 md:px-6 md:pb-20">
        <CpanelClient />
      </main>
    </MarketingSiteShell>
  )
}
