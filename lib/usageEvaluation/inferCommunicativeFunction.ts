import { normalizeLooseTextForSearch } from '@/lib/lexicon/normalize'
import { detectQuestionType } from '@/lib/lexicon/questions'
import type { CommunicativeFunction, UtteranceSymbolUsed } from '@/lib/usageEvaluation/utteranceTypes'

const REQUEST_LABELS = new Set([
  'quiero',
  'dame',
  'dame mas',
  'mas',
  'más',
  'por favor',
  'necesito',
  'puedo',
  'voy',
])

const REJECT_LABELS = new Set(['no', 'basta', 'parar', 'para', 'nunca', 'ninguno', 'ninguna', 'stop'])

const GREET_LABELS = new Set([
  'hola',
  'adios',
  'adiós',
  'gracias',
  'buenos dias',
  'buenos días',
  'buenas tardes',
  'buenas noches',
  'hasta luego',
])

function normalizeToken(label: string): string {
  return normalizeLooseTextForSearch(label).replace(/[¿?¡!.,]+/g, '').trim()
}

/**
 * Clasificación heurística v1 para informes clínicos.
 * No sustituye evaluación profesional; se cachea en UtteranceEvent.inferredIntent.
 */
export function inferCommunicativeFunction(
  text: string,
  symbolsUsed: UtteranceSymbolUsed[],
): CommunicativeFunction {
  const firstLabel = symbolsUsed[0]?.label?.trim() ?? ''
  const firstNorm = normalizeToken(firstLabel)
  const textNorm = normalizeLooseTextForSearch(text).replace(/[¿?¡!.,]+/g, '').trim()

  if (firstLabel.includes('¿') || text.includes('¿') || detectQuestionType(firstLabel)) {
    return 'question'
  }

  if (REQUEST_LABELS.has(firstNorm) || REQUEST_LABELS.has(textNorm.split(/\s+/)[0] ?? '')) {
    return 'request'
  }

  if (REJECT_LABELS.has(firstNorm)) {
    return 'reject'
  }

  if (GREET_LABELS.has(firstNorm) || GREET_LABELS.has(textNorm.split(/\s+/)[0] ?? '')) {
    return 'greet'
  }

  if (symbolsUsed.length <= 1 && firstNorm) {
    return 'comment'
  }

  return 'other'
}
