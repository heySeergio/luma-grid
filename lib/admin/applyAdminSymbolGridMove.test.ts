import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  applyAdminSymbolGridMove,
  type AdminGridSymbolRow,
} from '@/lib/admin/applyAdminSymbolGridMove'

function row(
  id: string,
  x: number,
  y: number,
  gridId = 'main',
): AdminGridSymbolRow {
  return {
    id,
    positionX: x,
    positionY: y,
    position_x: x,
    position_y: y,
    gridId,
  }
}

describe('applyAdminSymbolGridMove', () => {
  const cols = 4
  const rows = 4

  it('mueve a celda vacía', () => {
    const symbols = [row('a', 0, 0), row('b', 2, 2)]
    const r = applyAdminSymbolGridMove({
      symbols,
      gridCols: cols,
      gridRows: rows,
      dragId: 'a',
      targetX: 1,
      targetY: 0,
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      const a = r.nextSymbols.find((s) => String(s.id) === 'a')
      assert.equal(a?.positionX, 1)
      assert.equal(a?.positionY, 0)
    }
  })

  it('intercambia dos símbolos movibles', () => {
    const symbols = [row('a', 0, 0), row('b', 1, 0)]
    const r = applyAdminSymbolGridMove({
      symbols,
      gridCols: cols,
      gridRows: rows,
      dragId: 'a',
      targetX: 1,
      targetY: 0,
    })
    assert.equal(r.ok, true)
    if (r.ok) {
      const pa = r.nextSymbols.find((s) => String(s.id) === 'a')
      const pb = r.nextSymbols.find((s) => String(s.id) === 'b')
      assert.equal(pa?.positionX, 1)
      assert.equal(pa?.positionY, 0)
      assert.equal(pb?.positionX, 0)
      assert.equal(pb?.positionY, 0)
    }
  })

  it('no mueve si el destino tiene ocupante no movible', () => {
    const symbols = [row('a', 0, 0), { ...row('t', 1, 0), id: 'template-x' }]
    const r = applyAdminSymbolGridMove({
      symbols,
      gridCols: cols,
      gridRows: rows,
      dragId: 'a',
      targetX: 1,
      targetY: 0,
    })
    assert.equal(r.ok, false)
  })
})
