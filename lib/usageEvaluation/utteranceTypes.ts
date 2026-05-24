export const UTTERANCE_SOURCES = ['speak', 'quick_phrase'] as const
export type UtteranceSource = (typeof UTTERANCE_SOURCES)[number]

export const COMMUNICATIVE_FUNCTIONS = [
  'request',
  'reject',
  'comment',
  'question',
  'greet',
  'other',
] as const
export type CommunicativeFunction = (typeof COMMUNICATIVE_FUNCTIONS)[number]

export type UtteranceSymbolUsed = {
  id: string
  label: string
  lexemeId?: string | null
}

export type RecordUtterancePayload = {
  profileId: string
  text: string
  symbolCount: number
  durationMs?: number | null
  source: UtteranceSource
  symbolsUsed: UtteranceSymbolUsed[]
}
