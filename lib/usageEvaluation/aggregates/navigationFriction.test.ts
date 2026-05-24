import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  aggregateNavigationByAction,
  computeNavigationFrictionDeltas,
  summarizeNavigationFriction,
} from '@/lib/usageEvaluation/aggregates/navigationFriction'

const DAY_MS = 24 * 60 * 60 * 1000

describe('summarizeNavigationFriction', () => {
  it('calcula ratio de retirada y correcciones por enunciado', () => {
    const rows = [
      { action: 'folder_enter', phraseLength: 0, createdAt: new Date() },
      { action: 'folder_enter', phraseLength: 1, createdAt: new Date() },
      { action: 'folder_back', phraseLength: 1, createdAt: new Date() },
      { action: 'home', phraseLength: 0, createdAt: new Date() },
      { action: 'delete_last', phraseLength: 3, createdAt: new Date() },
      { action: 'clear_phrase', phraseLength: 5, createdAt: new Date() },
    ]

    const stats = summarizeNavigationFriction(rows, 2, 7 * DAY_MS)

    assert.equal(stats.totalEvents, 6)
    assert.equal(stats.folderEnterCount, 2)
    assert.equal(stats.retreatCount, 2)
    assert.equal(stats.retreatRatio, 1)
    assert.equal(stats.correctionCount, 2)
    assert.equal(stats.correctionsPerUtterance, 1)
    assert.equal(stats.avgPhraseLengthOnCorrection, 4)
    assert.ok(Math.abs(stats.navigationEventsPerDay - 6 / 7) < 0.001)
  })

  it('devuelve null en ratios cuando no hay datos base', () => {
    const stats = summarizeNavigationFriction([], 0, 7 * DAY_MS)
    assert.equal(stats.retreatRatio, null)
    assert.equal(stats.correctionsPerUtterance, null)
    assert.equal(stats.avgPhraseLengthOnCorrection, null)
  })
})

describe('computeNavigationFrictionDeltas', () => {
  it('calcula delta de eventos totales', () => {
    const current = summarizeNavigationFriction(
      [{ action: 'home', phraseLength: 0, createdAt: new Date() }],
      1,
      7 * DAY_MS,
    )
    const previous = summarizeNavigationFriction([], 0, 7 * DAY_MS)
    const deltas = computeNavigationFrictionDeltas(current, previous)
    assert.equal(deltas.totalEvents, 1)
    assert.equal(deltas.totalEventsPercent, null)
  })
})

describe('aggregateNavigationByAction', () => {
  it('agrupa acciones conocidas', () => {
    const rows = [
      { action: 'folder_enter', phraseLength: 0, createdAt: new Date() },
      { action: 'folder_enter', phraseLength: 0, createdAt: new Date() },
      { action: 'home', phraseLength: 0, createdAt: new Date() },
    ]
    const breakdown = aggregateNavigationByAction(rows)
    assert.equal(breakdown.length, 2)
    assert.equal(breakdown[0]?.action, 'folder_enter')
    assert.equal(breakdown[0]?.count, 2)
    assert.equal(breakdown[0]?.percent, (2 / 3) * 100)
  })
})
