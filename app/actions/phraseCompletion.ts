'use server'

import { getPredictionCandidates, type PredictionSymbolInput } from '@/app/actions/predictions'

export type PhraseCompletionChip = {
  id: string
  label: string
}

/**
 * Hasta 3 símbolos sugeridos para completar la frase (misma lógica que predicción en grid).
 */
export async function getPhraseCompletionSuggestions(
  profileId: string,
  selectedSymbols: PredictionSymbolInput[],
  candidateSymbols: PredictionSymbolInput[],
): Promise<PhraseCompletionChip[]> {
  if (selectedSymbols.length === 0 || candidateSymbols.length === 0) return []

  const last = selectedSymbols[selectedSymbols.length - 1]
  const recent = selectedSymbols.slice(0, -1)

  const ids = await getPredictionCandidates({
    profileId,
    currentSymbol: last,
    recentSymbols: recent,
    candidateSymbols,
  })

  const chips: PhraseCompletionChip[] = []
  for (const id of ids.slice(0, 3)) {
    const sym = candidateSymbols.find((c) => c.id === id)
    if (sym) {
      chips.push({ id: sym.id, label: sym.label })
    }
  }
  return chips
}
