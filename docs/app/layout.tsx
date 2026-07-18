import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Luma Grid — Documentación',
    template: '%s · Luma Grid',
  },
  description: 'Documentación del producto Luma Grid.',
  metadataBase: new URL('https://docs.lumagrid.app'),
}

function DocsUmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim()
  const scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() || 'https://cloud.umami.is/script.js'
  if (!websiteId) return null
  return <Script defer src={scriptUrl} data-website-id={websiteId} strategy="afterInteractive" />
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="docs-body docs-theme tk-bricolage-grotesque-extralig" suppressHydrationWarning>
        <Script id="docs-theme-init" strategy="beforeInteractive">
          {`(function(){try{var k='docs-theme';var t=localStorage.getItem(k);var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('docs-dark');}catch(e){}})();`}
        </Script>
        <DocsUmamiScript />
        {children}
      </body>
    </html>
  )
}
