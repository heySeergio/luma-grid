import { getSiteUrl } from '@/lib/seo/siteUrl'
import type { ComparePageData } from '@/lib/compare/types'

type CompareJsonLdProps = {
  data: ComparePageData
}

export function CompareJsonLd({ data }: CompareJsonLdProps) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/comparar/${data.slug}`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Comparar',
          item: `${siteUrl}/comparar`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `Luma Grid vs ${data.competitorName}`,
          item: pageUrl,
        },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: data.seo.title,
      description: data.seo.description,
      inLanguage: 'es-ES',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: {
        '@type': 'SoftwareApplication',
        name: 'Luma Grid',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web, iOS, Android, Windows, macOS (navegador o PWA)',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: data.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graph,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

type CompareHubJsonLdProps = {
  title: string
  description: string
}

export function CompareHubJsonLd({ title, description }: CompareHubJsonLdProps) {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/comparar`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Comparar', item: pageUrl },
        ],
      },
      {
        '@type': 'WebPage',
        url: pageUrl,
        name: title,
        description,
        inLanguage: 'es-ES',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
