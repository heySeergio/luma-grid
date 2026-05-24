import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { aggregateActiveVocabulary } from '@/lib/usageEvaluation/aggregates/activeVocabulary'
import { computeCoreCoverage } from '@/lib/usageEvaluation/aggregates/coreCoverage'
import { findIgnoredSymbols } from '@/lib/usageEvaluation/aggregates/ignoredSymbols'
import { aggregateFrequentSequences, countNgramOccurrences } from '@/lib/usageEvaluation/aggregates/ngrams'

describe('aggregateActiveVocabulary', () => {
  it('agrupa por lexema y ordena por frecuencia', () => {
    const board = new Set(['sym-1'])
    const meta = new Map([['lex-1', { isCore: true, lexemeTier: 'curated', lemma: 'agua' }]])
    const rows = [
      { symbolId: 'sym-1', lexemeId: 'lex-1', label: 'Agua' },
      { symbolId: 'sym-1', lexemeId: 'lex-1', label: 'Agua' },
      { symbolId: null, lexemeId: null, label: 'Pan' },
    ]
    const result = aggregateActiveVocabulary(rows, board, meta)
    assert.equal(result[0]?.label, 'agua')
    assert.equal(result[0]?.count, 2)
    assert.equal(result[0]?.isOnBoard, true)
    assert.equal(result[0]?.tier, 'core')
  })
})

describe('findIgnoredSymbols', () => {
  it('lista símbolos visibles sin uso', () => {
    const end = new Date('2026-05-24T12:00:00Z')
    const created = new Date('2026-05-01T12:00:00Z')
    const ignored = findIgnoredSymbols(
      [{ id: 'a', label: 'Zzz', category: 'General', createdAt: created }],
      new Set<string>(),
      end,
    )
    assert.equal(ignored.length, 1)
    assert.equal(ignored[0]?.label, 'Zzz')
    assert.ok(ignored[0]!.daysOnBoard >= 22)
  })
})

describe('ngrams', () => {
  it('cuenta bigramas en sesión', () => {
    const rows = [
      { phraseSessionId: 's1', sequenceIndex: 0, label: 'Quiero' },
      { phraseSessionId: 's1', sequenceIndex: 1, label: 'Agua' },
      { phraseSessionId: 's2', sequenceIndex: 0, label: 'Quiero' },
      { phraseSessionId: 's2', sequenceIndex: 1, label: 'Agua' },
    ]
    const counts = countNgramOccurrences(rows, 2)
    assert.equal(counts.get('Quiero → Agua'), 2)
  })

  it('aggregateFrequentSequences exige mínimo 2 repeticiones', () => {
    const rows = [
      { phraseSessionId: 's1', sequenceIndex: 0, label: 'No' },
      { phraseSessionId: 's1', sequenceIndex: 1, label: 'Más' },
      { phraseSessionId: 's2', sequenceIndex: 0, label: 'No' },
      { phraseSessionId: 's2', sequenceIndex: 1, label: 'Más' },
    ]
    const seq = aggregateFrequentSequences(rows)
    assert.equal(seq.length, 1)
    assert.deepEqual(seq[0]?.tokens, ['No', 'Más'])
  })
})

describe('computeCoreCoverage', () => {
  it('resume núcleo y temático', () => {
    const stats = computeCoreCoverage(
      [
        {
          label: 'agua',
          lexemeId: 'lex-1',
          symbolId: 'sym-1',
          count: 5,
          isOnBoard: true,
          tier: 'core',
          isCoreLexeme: true,
        },
        {
          label: 'dinosaurio',
          lexemeId: 'lex-2',
          symbolId: 'sym-2',
          count: 1,
          isOnBoard: true,
          tier: 'extended',
          isCoreLexeme: false,
        },
      ],
      100,
      10,
    )
    assert.equal(stats.coreLexemesUsed, 1)
    assert.equal(stats.boardCoreSymbolsUsed, 1)
    assert.equal(stats.thematicUsedCount, 1)
  })
})
