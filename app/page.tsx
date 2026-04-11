import type { Metadata } from 'next'
import LandingPageOriginal from '@/components/site/LandingPageOriginal'
import { getOgImageAbsoluteUrl, getOgImageDimensions } from '@/lib/seo/ogImage'
import { getSiteUrl } from '@/lib/seo/siteUrl'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

const siteUrl = getSiteUrl()
const ogImageUrl = getOgImageAbsoluteUrl()
const ogDims = getOgImageDimensions()

const DESCRIPTION_COMING_SOON =
  'Luma Grid: comunicación AAC en español con pictogramas, frases con IA, voz y PWA. Servicio en preparación; el acceso al tablero y al registro se anunciará próximamente.'

const DESCRIPTION_LIVE =
  'Luma Grid: comunicación AAC en español con pictogramas, predicción contextual, voz del dispositivo o voces naturales en planes de pago, y panel para personalizar tableros. PWA instalable desde el tablero.'

export async function generateMetadata(): Promise<Metadata> {
  const comingSoon = isLandingComingSoon()
  const description = comingSoon ? DESCRIPTION_COMING_SOON : DESCRIPTION_LIVE
  return {
    title: {
      absolute:
        'Luma Grid — Comunicación AAC con IA en español | Pictogramas, voz y tablero personalizable',
    },
    description,
    keywords: [
      'AAC',
      'comunicación aumentativa y alternativa',
      'CAA',
      'pictogramas',
      'tablero AAC',
      'comunicador',
      'español',
      'PWA',
      'accesibilidad',
      'TEA',
      'parálisis cerebral',
      'afasia',
      'Luma Grid',
      'voz sintética',
      'voces naturales',
      'voz realista',
      'comunicación asistida',
    ],
    authors: [{ name: 'Luma Grid', url: siteUrl }],
    creator: 'Luma Grid',
    publisher: 'Luma Grid',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      url: siteUrl,
      siteName: 'Luma Grid',
      title: 'Luma Grid — Comunicación AAC con IA en español',
      description,
      images: [
        {
          url: ogImageUrl,
          width: ogDims.width,
          height: ogDims.height,
          alt: 'Luma Grid — vista previa para redes sociales y buscadores',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Luma Grid — AAC con IA en español',
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    category: 'accessibility',
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
          },
        }
      : {}),
  }
}

export default function RootPage() {
  return <LandingPageOriginal comingSoon={isLandingComingSoon()} />
}
