import type { Metadata, Viewport } from 'next'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { authOptions } from '@/lib/auth'
import { getSiteUrl } from '@/lib/seo/siteUrl'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-app-sans',
})

const openDyslexic = localFont({
  src: [
    { path: '../public/fonts/OpenDyslexic-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/OpenDyslexic-Italic.otf', weight: '400', style: 'italic' },
    { path: '../public/fonts/OpenDyslexic-Bold.otf', weight: '700', style: 'normal' },
    { path: '../public/fonts/OpenDyslexic-BoldItalic.otf', weight: '700', style: 'italic' },
  ],
  variable: '--font-open-dyslexic',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Luma Grid · Comunicación AAC con IA en español',
    template: '%s · Luma Grid',
  },
  description:
    'Luma Grid es una app web de Comunicación Aumentativa y Alternativa (AAC) en español: pictogramas, frases con IA, predicción, voz (sistema y ElevenLabs), modo offline y PWA. Plan gratuito.',
  applicationName: 'Luma Grid',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#6366f1' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Luma Grid',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef2ff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/** Evita caché estática del shell; la sesión depende de cookies. */
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session: Session | null = null
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    console.error('[layout] getServerSession:', err)
  }
  const dyslexiaFontEnabled = Boolean(session?.user?.preferredDyslexiaFont)

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${openDyslexic.variable} ${dyslexiaFontEnabled ? 'font-dyslexia-enabled' : ''}`}
        suppressHydrationWarning
      >
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
