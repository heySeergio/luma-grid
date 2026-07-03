import type { Metadata } from 'next'

import { CompareHubPage } from '@/components/compare/CompareHubPage'
import { CompareHubJsonLd } from '@/components/compare/CompareJsonLd'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { COMPARE_HUB_SEO } from '@/lib/compare'
import { createMarketingMetadata } from '@/lib/seo/marketingMetadata'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = createMarketingMetadata({
  title: COMPARE_HUB_SEO.title,
  description: COMPARE_HUB_SEO.description,
  path: '/comparar',
  keywords: [...COMPARE_HUB_SEO.keywords],
})

export default function CompararPage() {
  return (
    <MarketingSiteShell comingSoon={isLandingComingSoon()}>
      <CompareHubJsonLd title={COMPARE_HUB_SEO.title} description={COMPARE_HUB_SEO.description} />
      <CompareHubPage />
    </MarketingSiteShell>
  )
}
