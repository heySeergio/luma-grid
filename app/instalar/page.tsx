import type { Metadata } from 'next'
import InstalarPageContent, { INSTALAR_PAGE_METADATA } from '@/components/site/pages/InstalarPageContent'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'
import { getOgImageAbsoluteUrl, getOgImageDimensions } from '@/lib/seo/ogImage'

const ogImageUrl = getOgImageAbsoluteUrl()
const ogDims = getOgImageDimensions()

export const metadata: Metadata = {
  title: INSTALAR_PAGE_METADATA.title,
  description: INSTALAR_PAGE_METADATA.description,
  alternates: { canonical: '/instalar' },
  openGraph: {
    title: `${INSTALAR_PAGE_METADATA.title} · Luma Grid`,
    description: INSTALAR_PAGE_METADATA.description,
    url: '/instalar',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Luma Grid',
    images: [{ url: ogImageUrl, width: ogDims.width, height: ogDims.height, alt: 'Luma Grid' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${INSTALAR_PAGE_METADATA.title} · Luma Grid`,
    description: INSTALAR_PAGE_METADATA.description,
    images: [ogImageUrl],
  },
}

export default function InstalarPage() {
  return (
    <MarketingSiteShell comingSoon={isLandingComingSoon()}>
      <InstalarPageContent />
    </MarketingSiteShell>
  )
}
