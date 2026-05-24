import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  aggregateCommunicativeFunctions,
  buildWeeklyTimeSeries,
  computeCommunicationDeltas,
  summarizeUtterances,
} from '@/lib/usageEvaluation/aggregates/communicationEvaluation'

describe('communicationEvaluation aggregates', () => {
  it('summarizeUtterances calcula LME y msgs/día', () => {
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const rows = [
      { createdAt: new Date(), symbolCount: 2, durationMs: 1000, inferredIntent: 'request' },
      { createdAt: new Date(), symbolCount: 4, durationMs: 2000, inferredIntent: 'greet' },
    ]
    const s = summarizeUtterances(rows, weekMs)
    assert.equal(s.utteranceCount, 2)
    assert.equal(s.avgSymbolsPerUtterance, 3)
    assert.ok(s.utterancesPerDay > 0)
  })

  it('aggregateCommunicativeFunctions agrupa por intent', () => {
    const rows = [
      { createdAt: new Date(), symbolCount: 1, durationMs: null, inferredIntent: 'request' },
      { createdAt: new Date(), symbolCount: 1, durationMs: null, inferredIntent: 'request' },
      { createdAt: new Date(), symbolCount: 1, durationMs: null, inferredIntent: 'greet' },
    ]
    const fns = aggregateCommunicativeFunctions(rows)
    const request = fns.find((f) => f.function === 'request')
    assert.equal(request?.count, 2)
    assert.equal(request?.percent, (2 / 3) * 100)
  })

  it('buildWeeklyTimeSeries trocea por semanas', () => {
    const start = new Date('2026-05-01T00:00:00Z')
    const end = new Date('2026-05-15T00:00:00Z')
    const rows = [
      { createdAt: new Date('2026-05-02T12:00:00Z'), symbolCount: 2, durationMs: null, inferredIntent: null },
      { createdAt: new Date('2026-05-10T12:00:00Z'), symbolCount: 3, durationMs: null, inferredIntent: null },
    ]
    const series = buildWeeklyTimeSeries(start, end, rows)
    assert.ok(series.length >= 2)
    assert.equal(series.reduce((n, b) => n + b.utteranceCount, 0), 2)
  })

  it('computeCommunicationDeltas', () => {
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const cur = summarizeUtterances(
      [{ createdAt: new Date(), symbolCount: 4, durationMs: 1000, inferredIntent: 'other' }],
      weekMs,
    )
    const prev = summarizeUtterances([], weekMs)
    const d = computeCommunicationDeltas(cur, prev)
    assert.equal(d.utteranceCount, 1)
    assert.equal(d.avgSymbolsPerUtterance, 4)
  })
})
