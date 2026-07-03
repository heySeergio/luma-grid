import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CompareJsonLd } from '@/components/compare/CompareJsonLd'
import { ComparePageLayout } from '@/components/compare/ComparePageLayout'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { COMPARE_SLUGS, getComparePage } from '@/lib/compare'
import { createMarketingMetadata } from '@/lib/seo/marketingMetadata'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return COMPARE_SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = getComparePage(slug)
  if (!data) return {}

  return createMarketingMetadata({
    title: data.seo.title,
    description: data.seo.description,
    path: `/comparar/${slug}`,
    keywords: data.seo.keywords,
  })
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params
  const data = getComparePage(slug)
  if (!data) notFound()

  return (
    <MarketingSiteShell comingSoon={isLandingComingSoon()}>
      <CompareJsonLd data={data} />
      <ComparePageLayout data={data} />
    </MarketingSiteShell>
  )
}
