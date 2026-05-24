import type { ActiveVocabularyItem } from '@/lib/usageEvaluation/lexiconUsageTypes'

export type VocabUsageEventRow = {
  symbolId: string | null
  lexemeId: string | null
  label: string
}

export type LexemeMeta = {
  isCore: boolean
  lexemeTier: string
  lemma: string
}

function vocabKey(row: VocabUsageEventRow): string {
  if (row.lexemeId) return `lex:${row.lexemeId}`
  if (row.symbolId) return `sym:${row.symbolId}`
  return `lbl:${row.label.trim().toLowerCase()}`
}

function resolveTier(meta: LexemeMeta | undefined): ActiveVocabularyItem['tier'] {
  if (!meta) return 'unknown'
  if (meta.isCore || meta.lexemeTier === 'curated') return 'core'
  if (meta.lexemeTier === 'extended') return 'extended'
  return 'unknown'
}

/** Agrupa eventos del periodo en vocabulario activo ordenado por frecuencia. */
export function aggregateActiveVocabulary(
  events: VocabUsageEventRow[],
  boardSymbolIds: Set<string>,
  lexemeMetaById: Map<string, LexemeMeta>,
  limit = 40,
): ActiveVocabularyItem[] {
  const map = new Map<
    string,
    {
      label: string
      lexemeId: string | null
      symbolId: string | null
      count: number
    }
  >()

  for (const row of events) {
    const label = row.label.trim() || 'Sin etiqueta'
    const key = vocabKey({ ...row, label })
    const prev = map.get(key)
    if (prev) {
      map.set(key, { ...prev, count: prev.count + 1 })
    } else {
      map.set(key, {
        label,
        lexemeId: row.lexemeId,
        symbolId: row.symbolId,
        count: 1,
      })
    }
  }

  return Array.from(map.values())
    .map((item) => {
      const meta = item.lexemeId ? lexemeMetaById.get(item.lexemeId) : undefined
      const displayLabel = meta?.lemma?.trim() || item.label
      const isOnBoard = item.symbolId ? boardSymbolIds.has(item.symbolId) : false
      const tier = resolveTier(meta)
      return {
        label: displayLabel,
        lexemeId: item.lexemeId,
        symbolId: item.symbolId,
        count: item.count,
        isOnBoard,
        tier,
        isCoreLexeme: Boolean(meta?.isCore),
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
