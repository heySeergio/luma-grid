/** Partición Fase 3: núcleo curado vs léxico ampliado (menor peso en predicción). */
export const LEXEME_TIERS = ['curated', 'extended'] as const
export type LexemeTier = (typeof LEXEME_TIERS)[number]

export function isLexemeTier(value: string): value is LexemeTier {
  return (LEXEME_TIERS as readonly string[]).includes(value)
}

/** Multiplicador aplicado a la parte de aacPriority en predicción para tier extended. */
export const EXTENDED_TIER_PREDICTION_FACTOR = 0.72
