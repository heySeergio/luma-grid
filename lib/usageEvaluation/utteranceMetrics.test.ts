import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { inferCommunicativeFunction } from '@/lib/usageEvaluation/inferCommunicativeFunction'
import {
  avgCompositionMs,
  avgSymbolsPerUtterance,
  utterancesPerDay,
} from '@/lib/usageEvaluation/utteranceMetrics'

describe('utteranceMetrics', () => {
  it('avgSymbolsPerUtterance (LME) con varios enunciados', () => {
    assert.equal(avgSymbolsPerUtterance([2, 4, 3]), 3)
    assert.equal(avgSymbolsPerUtterance([]), 0)
    assert.equal(avgSymbolsPerUtterance([1]), 1)
  })

  it('utterancesPerDay en ventana de 7 días', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    assert.equal(utterancesPerDay(14, sevenDaysMs), 2)
    assert.equal(utterancesPerDay(0, sevenDaysMs), 0)
  })

  it('avgCompositionMs ignora nulls', () => {
    assert.equal(avgCompositionMs([1000, 3000, null, undefined]), 2000)
    assert.equal(avgCompositionMs([null]), null)
  })
})

describe('inferCommunicativeFunction', () => {
  it('detecta petición', () => {
    assert.equal(
      inferCommunicativeFunction('Quiero agua', [{ id: '1', label: 'Quiero' }]),
      'request',
    )
  })

  it('detecta rechazo', () => {
    assert.equal(inferCommunicativeFunction('No más', [{ id: '1', label: 'No' }]), 'reject')
  })

  it('detecta pregunta', () => {
    assert.equal(
      inferCommunicativeFunction('¿Qué?', [{ id: '1', label: '¿Qué?' }]),
      'question',
    )
  })

  it('detecta saludo', () => {
    assert.equal(inferCommunicativeFunction('Hola', [{ id: '1', label: 'Hola' }]), 'greet')
  })
})
