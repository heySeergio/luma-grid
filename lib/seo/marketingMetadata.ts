import type { Metadata } from 'next'

import { getOgImageAbsoluteUrl, getOgImageDimensions } from '@/lib/seo/ogImage'

type CreateMarketingMetadataOptions = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

export function createMarketingMetadata({
  title,
  description,
  path,
  keywords,
}: CreateMarketingMetadataOptions): Metadata {
  const ogImageUrl = getOgImageAbsoluteUrl()
  const ogDims = getOgImageDimensions()
  const ogTitle = `${title} · Luma Grid`

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      type: 'website',
      locale: 'es_ES',
      siteName: 'Luma Grid',
      images: [
        {
          url: ogImageUrl,
          width: ogDims.width,
          height: ogDims.height,
          alt: 'Luma Grid — comunicación AAC en español',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
  }
}
