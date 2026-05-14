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
        {children}
      </body>
    </html>
  )
}
