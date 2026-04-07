/** Valores válidos en Lexeme.semanticLayer (Prisma + API). */
export const SEMANTIC_LAYERS = [
  'core',
  'actions',
  'people',
  'places',
  'objects',
  'emotions',
  'time',
  'colors',
  'numbers',
  'other',
] as const

export type SemanticLayer = (typeof SEMANTIC_LAYERS)[number]

export function isSemanticLayer(value: string): value is SemanticLayer {
  return (SEMANTIC_LAYERS as readonly string[]).includes(value)
}

/**
 * Refuerzo para ranking predictivo AAC: continuidad temática entre capas léxicas
 * (sin sustituir gramática ni historial de uso).
 */
export function getSemanticLayerPredictionBoost(
  candidateLayer: string | null | undefined,
  anchorCurrent: string | null | undefined,
  anchorPrevious: string | null | undefined,
): number {
  const cl = (candidateLayer ?? 'other').trim() || 'other'
  if (cl === 'other') return 0.06

  const cur = (anchorCurrent ?? '').trim()
  const prev = (anchorPrevious ?? '').trim()

  if (cur && cl === cur) return 0.92
  if (prev && cl === prev) return 0.62

  if (cur === 'actions' && (cl === 'objects' || cl === 'places' || cl === 'people')) return 0.48
  if (cur === 'core' && (cl === 'actions' || cl === 'objects')) return 0.4
  if (cur === 'emotions' && cl === 'actions') return 0.38
  if (cur === 'time' && (cl === 'actions' || cl === 'places')) return 0.35

  return 0.1
}
