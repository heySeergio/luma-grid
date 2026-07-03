import { astericsGridComparePage } from '@/lib/compare/competitors/asterics-grid'
import { grid3ComparePage } from '@/lib/compare/competitors/grid-3'
import { proloquo2goComparePage } from '@/lib/compare/competitors/proloquo2go'
import type { CompareHubEntry, ComparePageData } from '@/lib/compare/types'

export const COMPARE_PAGES: ComparePageData[] = [
  grid3ComparePage,
  astericsGridComparePage,
  proloquo2goComparePage,
]

export const COMPARE_SLUGS = COMPARE_PAGES.map(p => p.slug)

export function getComparePage(slug: string): ComparePageData | undefined {
  return COMPARE_PAGES.find(p => p.slug === slug)
}

export function getCompareHubEntries(): CompareHubEntry[] {
  return COMPARE_PAGES.map(p => ({
    slug: p.slug,
    competitorName: p.competitorName,
    teaser: p.hubTeaser,
    verdict: p.heroVerdict,
  }))
}

export const COMPARE_HUB_SEO = {
  title: 'Comparar Luma Grid con otros comunicadores AAC',
  description:
    'Comparativas honestas de Luma Grid frente a Grid 3, Asterics Grid y Proloquo2Go. Precios, voces naturales con IA, conjugación automática, ARASAAC y gestión multi-alumno para centros educativos en España.',
  keywords: [
    'comparar comunicadores AAC',
    'alternativa Grid 3',
    'alternativa Proloquo2Go',
    'alternativa Asterics Grid',
    'Luma Grid comparativa',
    'comunicador AAC español',
    'CAA comparativa',
    'mejor comunicador AAC España',
    'voces naturales AAC',
    'ARASAAC comunicador',
  ],
} as const
