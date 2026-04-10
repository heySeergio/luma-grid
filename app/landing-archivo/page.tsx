import type { Metadata } from 'next'
import LandingPageOriginal from '@/components/site/LandingPageOriginal'

/**
 * Copia archivada del landing público (mismo contenido que en `/`).
 * No enlazada en el sitio; `noindex` para que no aparezca en buscadores.
 */
export const metadata: Metadata = {
  title: 'Archivo — landing Luma Grid',
  description: 'Copia interna del landing; no usar como URL pública.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function LandingArchivoPage() {
  return <LandingPageOriginal includeJsonLd={false} />
}
