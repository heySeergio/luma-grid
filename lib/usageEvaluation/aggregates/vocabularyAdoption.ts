/** Ventana para considerar un símbolo «adoptado» tras añadirlo al tablero. */
export const ADOPTION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export type IntroducedSymbolRow = {
  id: string
  label: string
  category: string
  createdAt: Date
}

export type SymbolUsageAt = {
  symbolId: string
  createdAt: Date
}

export type AdoptionCohortItem = {
  symbolId: string
  label: string
  category: string
  introducedAtIso: string
  firstUsedAtIso: string | null
  adopted: boolean
}

export type VocabularyAdoptionStats = {
  introducedInPeriod: number
  adoptedCount: number
  /** null si no hubo palabras nuevas en el periodo. */
  adoptionRate: number | null
  adoptionWindowDays: number
  cohort: AdoptionCohortItem[]
}

export function computeVocabularyAdoption(
  introduced: IntroducedSymbolRow[],
  usageEvents: SymbolUsageAt[],
  adoptionWindowMs = ADOPTION_WINDOW_MS,
  cohortLimit = 20,
): VocabularyAdoptionStats {
  const usageBySymbol = new Map<string, Date[]>()
  for (const e of usageEvents) {
    if (!e.symbolId) continue
    const list = usageBySymbol.get(e.symbolId) ?? []
    list.push(e.createdAt)
    usageBySymbol.set(e.symbolId, list)
  }

  const cohort: AdoptionCohortItem[] = introduced
    .filter((s) => s.label.trim().length > 0)
    .map((s) => {
      const windowEnd = new Date(s.createdAt.getTime() + adoptionWindowMs)
      const usages = (usageBySymbol.get(s.id) ?? []).filter(
        (t) => t >= s.createdAt && t < windowEnd,
      )
      usages.sort((a, b) => a.getTime() - b.getTime())
      const firstUsed = usages[0] ?? null
      return {
        symbolId: s.id,
        label: s.label.trim(),
        category: s.category.trim() || 'Sin categoría',
        introducedAtIso: s.createdAt.toISOString(),
        firstUsedAtIso: firstUsed?.toISOString() ?? null,
        adopted: firstUsed != null,
      }
    })
    .sort((a, b) => b.introducedAtIso.localeCompare(a.introducedAtIso))

  const adoptedCount = cohort.filter((c) => c.adopted).length
  const introducedInPeriod = cohort.length

  return {
    introducedInPeriod,
    adoptedCount,
    adoptionRate: introducedInPeriod > 0 ? adoptedCount / introducedInPeriod : null,
    adoptionWindowDays: Math.round(adoptionWindowMs / (24 * 60 * 60 * 1000)),
    cohort: cohort.slice(0, cohortLimit),
  }
}
