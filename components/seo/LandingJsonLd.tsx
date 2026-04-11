import { getSiteUrl } from '@/lib/seo/siteUrl'

const FAQ_ITEMS = [
  {
    question: '¿Qué es Luma Grid?',
    answer:
      'Luma Grid es una aplicación web de Comunicación Aumentativa y Alternativa (AAC) en español: tablero de pictogramas, barra de frase, conjugación con ayuda inteligente y salida de voz. Puedes usar la voz del propio dispositivo o, en los planes de pago, voces muy naturales y realistas —con entonación creíble, cercanas a una voz humana—. Instalable como PWA en móvil u ordenador.',
  },
  {
    question: '¿Funciona sin conexión a internet?',
    answer:
      'Puedes seguir usando el tablero con almacenamiento local en el dispositivo; al recuperar la red se sincronizan los datos. Las sugerencias de predicción que dependen del servidor pueden actualizarse con retraso hasta completar la sincronización.',
  },
  {
    question: '¿Luma Grid es gratis?',
    answer:
      'Sí: habrá un plan que será gratis para empezar sin tarjeta. Los planes de pago pondrán el foco en voces naturales y realistas —de alta calidad y muy expresivas—, más tableros personalizados y funciones avanzadas según el plan.',
  },
  {
    question: '¿Cómo configuro tableros y voces?',
    answer:
      'Desde el panel de administración puedes crear tableros, ajustar el grid, el género de comunicación, la voz y más. El acceso al panel está disponible desde el tablero según la configuración de tu cuenta.',
  },
] as const

export function LandingJsonLd() {
  const siteUrl = getSiteUrl()
  const orgId = `${siteUrl}/#organization`
  const webId = `${siteUrl}/#website`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': webId,
      url: siteUrl,
      name: 'Luma Grid',
      description:
        'Comunicación AAC en español: tablero de pictogramas, frases con IA, predicción, voz del dispositivo y voces naturales y realistas en planes de pago, continuidad con caché local y PWA. Plan gratuito y opciones de pago.',
      inLanguage: 'es-ES',
      isAccessibleForFree: true,
      publisher: { '@id': orgId },
      potentialAction: {
        '@type': 'ReadAction',
        target: [`${siteUrl}/tablero`],
      },
    },
    {
      '@type': 'Organization',
      '@id': orgId,
      name: 'Luma Grid',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icons/favicon.png`,
      },
      sameAs: [] as string[],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Luma Grid',
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Communication',
      operatingSystem: 'Web, iOS, Android, Windows, macOS (navegador o PWA)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Plan gratuito disponible; planes de pago opcionales.',
      },
      description:
        'Aplicación AAC con grid de símbolos, conjugación en español, predicción contextual, voces naturales y realistas en planes de pago, continuidad con caché local y sincronización, y panel para familias y profesionales.',
      url: siteUrl,
      browserRequirements: 'Requiere navegador moderno con JavaScript.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}

export { FAQ_ITEMS }
