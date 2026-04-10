import type { Metadata } from 'next'
import LandingPageOriginal from '@/components/site/LandingPageOriginal'
import { getOgImageAbsoluteUrl, getOgImageDimensions } from '@/lib/seo/ogImage'
import { getSiteUrl } from '@/lib/seo/siteUrl'

const siteUrl = getSiteUrl()
const ogImageUrl = getOgImageAbsoluteUrl()
const ogDims = getOgImageDimensions()

const LANDING_DESCRIPTION =
  'Luma Grid: comunicación AAC en español con pictogramas, frases con IA, voz y PWA. Servicio en preparación; el acceso al tablero y al registro se anunciará próximamente.'

export const metadata: Metadata = {
  title: {
    absolute:
      'Luma Grid — Comunicación AAC con IA en español | Pictogramas, voz y tablero personalizable',
  },
  description: LANDING_DESCRIPTION,
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
    'modo offline',
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
    description: LANDING_DESCRIPTION,
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
    description: LANDING_DESCRIPTION,
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

export default function RootPage() {
  return <LandingPageOriginal comingSoon />
}
