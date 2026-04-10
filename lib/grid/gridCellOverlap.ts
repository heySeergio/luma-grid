/**
 * Colocación 1×1 por celda (sin rectángulos multi-celda).
 */

export type SymbolLikeGridCell = {
  positionX?: number | null
  positionY?: number | null
  position_x?: number | null
  position_y?: number | null
  gridId?: string | null
  grid_id?: string | null
}

export function effectiveSymbolGridId(s: SymbolLikeGridCell): string {
  const raw = s.gridId ?? s.grid_id
  if (raw == null) return 'main'
  const t = String(raw).trim()
  return t.length > 0 ? t : 'main'
}

function parseGridCell(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseInt(v.trim(), 10)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function cellKey(x: number, y: number): string {
  return `${x}:${y}`
}

export type GridCellRow = SymbolLikeGridCell & { id: string }

/** Dos símbolos del mismo `gridId` no pueden ocupar la misma celda. */
export function findCellOverlaps(symbols: GridCellRow[]): Array<{ a: string; b: string; cell: string }> {
  const byGrid = new Map<string, GridCellRow[]>()
  for (const s of symbols) {
    const gid = effectiveSymbolGridId(s)
    const list = byGrid.get(gid) ?? []
    list.push(s)
    byGrid.set(gid, list)
  }
  const conflicts: Array<{ a: string; b: string; cell: string }> = []
  for (const [, list] of byGrid) {
    const cellOwner = new Map<string, string>()
    for (const s of list) {
      const px = parseGridCell(s.positionX ?? s.position_x)
      const py = parseGridCell(s.positionY ?? s.position_y)
      const key = cellKey(px, py)
      const existing = cellOwner.get(key)
      if (existing && existing !== s.id) {
        conflicts.push({ a: existing, b: s.id, cell: key })
      } else if (!existing) {
        cellOwner.set(key, s.id)
      }
    }
  }
  return conflicts
}

/**
 * Reasigna celdas para el mismo `gridId` sin duplicar (orden: fila, columna, id).
 */
export function resolveCellOverlapsBeforeSave<T extends GridCellRow>(symbols: T[], cols: number, rows: number): T[] {
  const byGrid = new Map<string, T[]>()
  for (const s of symbols) {
    const gid = effectiveSymbolGridId(s)
    const list = byGrid.get(gid) ?? []
    list.push(s)
    byGrid.set(gid, list)
  }
  const out: T[] = []
  for (const gk of [...byGrid.keys()].sort((a, b) => a.localeCompare(b, 'es'))) {
    out.push(...resolveOneGrid1x1(byGrid.get(gk)!, cols, rows))
  }
  return out
}

function resolveOneGrid1x1<T extends GridCellRow>(group: T[], cols: number, rows: number): T[] {
  const sorted = [...group].sort((a, b) => {
    const ax = parseGridCell(a.positionX ?? a.position_x)
    const ay = parseGridCell(a.positionY ?? a.position_y)
    const bx = parseGridCell(b.positionX ?? b.position_x)
    const by = parseGridCell(b.positionY ?? b.position_y)
    if (ay !== by) return ay - by
    if (ax !== bx) return ax - bx
    return String(a.id).localeCompare(String(b.id), 'es')
  })
  const occupied = new Set<string>()
  const result: T[] = []
  for (const s of sorted) {
    const id = String(s.id)
    let x = parseGridCell(s.positionX ?? s.position_x)
    let y = parseGridCell(s.positionY ?? s.position_y)
    const k = cellKey(x, y)
    if (x >= 0 && x < cols && y >= 0 && y < rows && !occupied.has(k)) {
      occupied.add(k)
      result.push({
        ...s,
        positionX: x,
        positionY: y,
        position_x: x,
        position_y: y,
      })
      continue
    }
    let placed = false
    for (let ty = 0; ty < rows && !placed; ty += 1) {
      for (let tx = 0; tx < cols && !placed; tx += 1) {
        const kk = cellKey(tx, ty)
        if (!occupied.has(kk)) {
          occupied.add(kk)
          result.push({
            ...s,
            positionX: tx,
            positionY: ty,
            position_x: tx,
            position_y: ty,
          })
          placed = true
        }
      }
    }
    if (!placed) {
      result.push({
        ...s,
        positionX: x,
        positionY: y,
        position_x: x,
        position_y: y,
      })
    }
  }
  return result
}
