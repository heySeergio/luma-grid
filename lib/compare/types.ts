export type CompareWinner = 'luma' | 'competitor' | 'both' | 'neither'

export type CompareFeatureRow = {
  feature: string
  luma: string
  competitor: string
  winner?: CompareWinner
  highlight?: boolean
}

export type CompareUseCase = {
  title: string
  scenario: string
  recommendation: string
  pick: 'luma' | 'competitor' | 'depends'
}

export type ComparePricingTier = {
  name: string
  price: string
  note?: string
  /** Marca filas como «no disponible» (p. ej. plan profesional inexistente en competidor). */
  unavailable?: boolean
}

/** Par Luma ↔ competidor en la misma fila de precios. */
export type ComparePricingPair = {
  luma: ComparePricingTier
  /** Omitir si el competidor no tiene tier comparable (p. ej. Asterics sin planes de pago). */
  competitor?: ComparePricingTier
}

export type CompareCompetitorPricing = {
  summary: string
  pairs: ComparePricingPair[]
  footnote?: string
}

export type CompareFaqItem = {
  question: string
  answer: string
}

export type ComparePageData = {
  slug: string
  competitorName: string
  competitorShortName: string
  competitorVendor?: string
  heroTitle: string
  heroVerdict: string
  heroSubtitle: string
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  featureRows: CompareFeatureRow[]
  useCases: CompareUseCase[]
  whenCompetitor: {
    title: string
    intro: string
    bullets: string[]
  }
  competitorPricing: CompareCompetitorPricing
  faq: CompareFaqItem[]
  hubTeaser: string
}

export type CompareHubEntry = {
  slug: string
  competitorName: string
  teaser: string
  verdict: string
}
