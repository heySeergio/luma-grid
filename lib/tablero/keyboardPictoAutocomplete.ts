import type { Symbol } from '@/lib/supabase/types'

function glyphScore(s: Pick<Symbol, 'imageUrl' | 'emoji'>): number {
  let n = 0
  if (s.imageUrl) n += 2
  if (s.emoji) n += 1
  return n
}

function normLabel(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

export type KeyboardTokenGlyph = {
  imageUrl?: string
  emoji?: string
  sourceSymbolId: string
  category?: string | null
}

/**
 * Busca en los símbolos del tablero un picto (imagen o emoji) para una palabra
 * escrita con el teclado: primero por lexema, luego por etiqueta normalizada.
 */
export function pickBoardGlyphForKeyboardToken(
  boardSymbols: Symbol[],
  token: {
    label: string
    normalizedLabel: string
    lexemeId: string | null
    detectedLemma?: string | null
  },
): KeyboardTokenGlyph | null {
  const usable = boardSymbols.filter((s) => !s.opensKeyboard && s.category !== 'Carpetas')
  const tokenNorm = normLabel(token.normalizedLabel) || normLabel(token.label)
  const tokenPlain = normLabel(token.label)
  const lemmaNorm = normLabel(token.detectedLemma)

  const pickBest = (candidates: Symbol[]): Symbol | null => {
    let best: Symbol | null = null
    let bestScore = 0
    for (const s of candidates) {
      const sc = glyphScore(s)
      if (sc === 0) continue
      if (!best || sc > bestScore || (sc === bestScore && s.id < best.id)) {
        best = s
        bestScore = sc
      }
    }
    return best
  }

  if (token.lexemeId) {
    const lexMatches = usable.filter((s) => s.lexemeId === token.lexemeId)
    const bestLex = pickBest(lexMatches)
    if (bestLex) {
      return {
        imageUrl: bestLex.imageUrl,
        emoji: bestLex.emoji,
        sourceSymbolId: bestLex.id,
        category: bestLex.category ?? null,
      }
    }
  }

  if (lemmaNorm && lemmaNorm !== tokenNorm && lemmaNorm !== tokenPlain) {
    const lemmaMatches = usable.filter((s) => {
      const sn = normLabel(s.normalizedLabel) || normLabel(s.label)
      return sn === lemmaNorm
    })
    const bestLemma = pickBest(lemmaMatches)
    if (bestLemma) {
      return {
        imageUrl: bestLemma.imageUrl,
        emoji: bestLemma.emoji,
        sourceSymbolId: bestLemma.id,
        category: bestLemma.category ?? null,
      }
    }
  }

  const labelMatches = usable.filter((s) => {
    const sn = normLabel(s.normalizedLabel) || normLabel(s.label)
    return sn === tokenNorm || normLabel(s.label) === tokenPlain
  })
  const bestLabel = pickBest(labelMatches)
  if (!bestLabel) return null
  return {
    imageUrl: bestLabel.imageUrl,
    emoji: bestLabel.emoji,
    sourceSymbolId: bestLabel.id,
    category: bestLabel.category ?? null,
  }
}
