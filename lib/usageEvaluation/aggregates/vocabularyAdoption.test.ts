import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ADOPTION_WINDOW_MS,
  computeVocabularyAdoption,
} from '@/lib/usageEvaluation/aggregates/vocabularyAdoption'

describe('computeVocabularyAdoption', () => {
  it('marca adoptado si hay uso dentro de la ventana de 14 días', () => {
    const introducedAt = new Date('2026-05-01T10:00:00Z')
    const firstUse = new Date('2026-05-05T10:00:00Z')

    const stats = computeVocabularyAdoption(
      [{ id: 'sym-1', label: 'Perro', category: 'Animales', createdAt: introducedAt }],
      [{ symbolId: 'sym-1', createdAt: firstUse }],
    )

    assert.equal(stats.introducedInPeriod, 1)
    assert.equal(stats.adoptedCount, 1)
    assert.equal(stats.adoptionRate, 1)
    assert.equal(stats.adoptionWindowDays, 14)
    assert.equal(stats.cohort[0]?.adopted, true)
    assert.equal(stats.cohort[0]?.firstUsedAtIso, firstUse.toISOString())
  })

  it('no adopta si el primer uso es después de la ventana', () => {
    const introducedAt = new Date('2026-05-01T10:00:00Z')
    const lateUse = new Date(introducedAt.getTime() + ADOPTION_WINDOW_MS + 60_000)

    const stats = computeVocabularyAdoption(
      [{ id: 'sym-1', label: 'Gato', category: 'Animales', createdAt: introducedAt }],
      [{ symbolId: 'sym-1', createdAt: lateUse }],
    )

    assert.equal(stats.adoptedCount, 0)
    assert.equal(stats.adoptionRate, 0)
    assert.equal(stats.cohort[0]?.adopted, false)
    assert.equal(stats.cohort[0]?.firstUsedAtIso, null)
  })

  it('calcula tasa cuando hay mezcla adoptados / no adoptados', () => {
    const t0 = new Date('2026-05-10T10:00:00Z')

    const stats = computeVocabularyAdoption(
      [
        { id: 'a', label: 'A', category: 'X', createdAt: t0 },
        { id: 'b', label: 'B', category: 'X', createdAt: t0 },
      ],
      [{ symbolId: 'a', createdAt: new Date('2026-05-11T10:00:00Z') }],
    )

    assert.equal(stats.introducedInPeriod, 2)
    assert.equal(stats.adoptedCount, 1)
    assert.equal(stats.adoptionRate, 0.5)
  })

  it('limita el tamaño de la cohorte', () => {
    const t0 = new Date('2026-05-01T10:00:00Z')
    const introduced = Array.from({ length: 25 }, (_, i) => ({
      id: `sym-${i}`,
      label: `Palabra ${i}`,
      category: 'General',
      createdAt: new Date(t0.getTime() + i * 60_000),
    }))

    const stats = computeVocabularyAdoption(introduced, [], ADOPTION_WINDOW_MS, 20)

    assert.equal(stats.introducedInPeriod, 25)
    assert.equal(stats.cohort.length, 20)
  })
})
