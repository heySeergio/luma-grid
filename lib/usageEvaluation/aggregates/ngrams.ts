import type { FrequentSequenceItem } from '@/lib/usageEvaluation/lexiconUsageTypes'

export type NgramEventRow = {
  phraseSessionId: string
  sequenceIndex: number
  label: string
}

function countNgramsInSessions(rows: NgramEventRow[], n: 2 | 3): Map<string, string[]> {
  const bySession = new Map<string, NgramEventRow[]>()
  for (const row of rows) {
    const label = row.label.trim()
    if (!label) continue
    const bucket = bySession.get(row.phraseSessionId) ?? []
    bucket.push({ ...row, label })
    bySession.set(row.phraseSessionId, bucket)
  }

  const counts = new Map<string, string[]>()
  for (const sessionRows of bySession.values()) {
    const ordered = [...sessionRows].sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    const labels = ordered.map((r) => r.label)
    for (let i = 0; i <= labels.length - n; i += 1) {
      const tokens = labels.slice(i, i + n)
      const key = tokens.join('\0')
      counts.set(key, tokens)
    }
  }

  const tally = new Map<string, { tokens: string[]; count: number }>()
  for (const [key, tokens] of counts) {
    const prev = tally.get(key)
    if (prev) tally.set(key, { tokens, count: prev.count + 1 })
    else tally.set(key, { tokens, count: 1 })
  }

  return new Map(Array.from(tally.entries()).map(([k, v]) => [k, v.tokens]))
}

/** Secuencias frecuentes de 2 y 3 símbolos dentro de sesiones de composición. */
export function aggregateFrequentSequences(
  rows: NgramEventRow[],
  limitPerKind = 15,
): FrequentSequenceItem[] {
  const bySession = new Map<string, NgramEventRow[]>()
  for (const row of rows) {
    const label = row.label.trim()
    if (!label) continue
    const bucket = bySession.get(row.phraseSessionId) ?? []
    bucket.push({ ...row, label })
    bySession.set(row.phraseSessionId, bucket)
  }

  const tally = new Map<string, { tokens: string[]; count: number; kind: 'bigram' | 'trigram' }>()

  for (const sessionRows of bySession.values()) {
    const ordered = [...sessionRows].sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    const labels = ordered.map((r) => r.label)

    for (const n of [2, 3] as const) {
      for (let i = 0; i <= labels.length - n; i += 1) {
        const tokens = labels.slice(i, i + n)
        const key = `${n}:${tokens.join('\0')}`
        const kind = n === 2 ? 'bigram' : 'trigram'
        const prev = tally.get(key)
        if (prev) tally.set(key, { tokens, count: prev.count + 1, kind })
        else tally.set(key, { tokens, count: 1, kind })
      }
    }
  }

  const bigrams: FrequentSequenceItem[] = []
  const trigrams: FrequentSequenceItem[] = []

  for (const { tokens, count, kind } of tally.values()) {
    if (count < 2) continue
    const item = { tokens, count, kind }
    if (kind === 'bigram') bigrams.push(item)
    else trigrams.push(item)
  }

  bigrams.sort((a, b) => b.count - a.count)
  trigrams.sort((a, b) => b.count - a.count)

  return [...bigrams.slice(0, limitPerKind), ...trigrams.slice(0, limitPerKind)]
}

/** Cuenta ocurrencias de n-gramas en sesiones (para tests). */
export function countNgramOccurrences(rows: NgramEventRow[], n: 2 | 3): Map<string, number> {
  const bySession = new Map<string, NgramEventRow[]>()
  for (const row of rows) {
    const label = row.label.trim()
    if (!label) continue
    const bucket = bySession.get(row.phraseSessionId) ?? []
    bucket.push({ ...row, label })
    bySession.set(row.phraseSessionId, bucket)
  }

  const counts = new Map<string, number>()
  for (const sessionRows of bySession.values()) {
    const ordered = [...sessionRows].sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    const labels = ordered.map((r) => r.label)
    for (let i = 0; i <= labels.length - n; i += 1) {
      const key = labels.slice(i, i + n).join(' → ')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return counts
}
