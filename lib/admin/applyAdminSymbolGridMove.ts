/**
 * Movimiento / intercambio 1×1 en el grid del admin (mismo `gridId` efectivo).
 * Sin dependencias de UI — el caller aplica el resultado sobre el estado `symbols`.
 */

import { effectiveSymbolGridId, parseGridCell } from '@/lib/grid/gridCellOverlap'

export type AdminGridSymbolRow = {
  id: string | number
  positionX?: number | null
  positionY?: number | null
  position_x?: number | null
  position_y?: number | null
  gridId?: string | null
  grid_id?: string | null
}

function getPos(s: AdminGridSymbolRow): { x: number; y: number } {
  return {
    x: parseGridCell(s.positionX ?? s.position_x),
    y: parseGridCell(s.positionY ?? s.position_y),
  }
}

/** Alineado con `isMovableSymbol` en AdminPageClient. */
export function isAdminGridSymbolMovableById(id: string | number | null | undefined): boolean {
  if (id == null || id === '') return false
  const sid = String(id)
  if (sid.startsWith('fixed-left')) return false
  if (sid.startsWith('template')) return false
  if (sid.startsWith('folder-item-')) return false
  if (sid.startsWith('default-') && !sid.startsWith('default-left-')) return false
  return true
}

function symbolOccupiesCell(s: AdminGridSymbolRow, cx: number, cy: number): boolean {
  const p = getPos(s)
  return p.x === cx && p.y === cy
}

function symbolRectOverlapsAny(
  px: number,
  py: number,
  symbols: readonly AdminGridSymbolRow[],
  excludeId?: string,
): boolean {
  const ex = excludeId != null && excludeId !== '' ? String(excludeId) : null
  for (const s of symbols) {
    if (ex && String(s.id) === ex) continue
    if (symbolOccupiesCell(s, px, py)) return true
  }
  return false
}

function canPlaceCell(
  px: number,
  py: number,
  gridCols: number,
  gridRows: number,
  symbols: readonly AdminGridSymbolRow[],
  excludeId?: string,
): boolean {
  if (px < 0 || py < 0 || px >= gridCols || py >= gridRows) return false
  return !symbolRectOverlapsAny(px, py, symbols, excludeId)
}

function adminSymbolsSameGridInBounds(
  allSymbols: readonly AdminGridSymbolRow[],
  gridId: string | null | undefined,
  gridCols: number,
  gridRows: number,
): AdminGridSymbolRow[] {
  const gid = effectiveSymbolGridId({ gridId, grid_id: undefined })
  return allSymbols.filter((s) => {
    if (effectiveSymbolGridId(s) !== gid) return false
    const p = getPos(s)
    return p.x >= 0 && p.y >= 0 && p.x < gridCols && p.y < gridRows
  })
}

function updateRow<T extends AdminGridSymbolRow>(row: T, x: number, y: number): T {
  return {
    ...row,
    positionX: x,
    positionY: y,
    position_x: x,
    position_y: y,
  }
}

export type ApplyAdminSymbolGridMoveResult<T extends AdminGridSymbolRow> =
  | { ok: true; nextSymbols: T[] }
  | { ok: false; reason: string }

export function applyAdminSymbolGridMove<T extends AdminGridSymbolRow>(input: {
  symbols: readonly T[]
  gridCols: number
  gridRows: number
  dragId: string
  targetX: number
  targetY: number
}): ApplyAdminSymbolGridMoveResult<T> {
  const { symbols, gridCols, gridRows, dragId } = input
  const x = input.targetX
  const y = input.targetY

  const dragged = symbols.find((s) => String(s.id) === String(dragId)) as T | undefined
  if (!dragged) {
    return { ok: false, reason: 'no_drag_symbol' }
  }
  if (!isAdminGridSymbolMovableById(dragged.id)) {
    return { ok: false, reason: 'not_movable' }
  }

  const dragGid = dragged.gridId ?? dragged.grid_id ?? 'main'
  const peers = adminSymbolsSameGridInBounds(symbols, dragGid, gridCols, gridRows) as T[]

  const sourcePosition = getPos(dragged)
  if (sourcePosition.x === x && sourcePosition.y === y) {
    return { ok: false, reason: 'same_cell' }
  }

  if (x < 0 || y < 0 || x >= gridCols || y >= gridRows) {
    return { ok: false, reason: 'out_of_bounds' }
  }

  const idStr = String(dragId)

  if (canPlaceCell(x, y, gridCols, gridRows, peers, idStr)) {
    const next = symbols.map((sym) =>
      String(sym.id) === idStr ? updateRow(sym as T, x, y) : sym,
    )
    return { ok: true, nextSymbols: next }
  }

  const targetSymbol = peers.find((symbol) => {
    if (!isAdminGridSymbolMovableById(symbol.id) || String(symbol.id) === idStr) return false
    const position = getPos(symbol)
    return position.x === x && position.y === y
  })

  if (
    targetSymbol &&
    canPlaceCell(x, y, gridCols, gridRows, peers, String(targetSymbol.id)) &&
    canPlaceCell(
      sourcePosition.x,
      sourcePosition.y,
      gridCols,
      gridRows,
      peers,
      idStr,
    )
  ) {
    const targetId = String(targetSymbol.id)
    const next = symbols.map((sym) => {
      if (String(sym.id) === idStr) {
        return updateRow(sym as T, x, y)
      }
      if (String(sym.id) === targetId) {
        return updateRow(sym as T, sourcePosition.x, sourcePosition.y)
      }
      return sym
    })
    return { ok: true, nextSymbols: next }
  }

  return { ok: false, reason: 'blocked_or_immovable_target' }
}

export const ADMIN_GRID_DRAG_MIME = 'application/x-luma-admin-symbol-id'
