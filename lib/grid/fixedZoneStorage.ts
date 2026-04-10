import { isPositionInBaseFixedZone } from '@/lib/grid/baseFixedZone'

export const FIXED_ZONE_JSON_VERSION = 1 as const

export type FixedZoneJson = {
  v: typeof FIXED_ZONE_JSON_VERSION
  keys: string[]
}

/** Genera la plantilla por defecto (7 columnas izquierda + primera fila). */
export function buildDefaultFixedZoneKeySet(gridCols: number, gridRows: number): Set<string> {
  const keys = new Set<string>()
  for (let y = 0; y < gridRows; y += 1) {
    for (let x = 0; x < gridCols; x += 1) {
      if (isPositionInBaseFixedZone(x, y, gridCols, gridRows)) {
        keys.add(`${x}:${y}`)
      }
    }
  }
  return keys
}

export function serializeFixedZoneJson(keys: Set<string>): FixedZoneJson {
  return {
    v: FIXED_ZONE_JSON_VERSION,
    keys: [...keys].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  }
}

/** `null` en BD o valor inválido → usar plantilla por defecto en el merge. */
export function parseProfileFixedZoneJson(raw: unknown): Set<string> | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.v !== FIXED_ZONE_JSON_VERSION || !Array.isArray(o.keys)) return null
  const set = new Set<string>()
  for (const k of o.keys) {
    if (typeof k !== 'string') continue
    const m = /^(\d+):(\d+)$/.exec(k)
    if (!m) continue
    set.add(`${m[1]}:${m[2]}`)
  }
  return set
}

/** Si `custom` es null → geometría por defecto; si no, solo claves incluidas en el Set. */
export function isFixedZonePosition(
  x: number,
  y: number,
  gridCols: number,
  gridRows: number,
  custom: Set<string> | null,
): boolean {
  if (custom !== null) return custom.has(`${x}:${y}`)
  return isPositionInBaseFixedZone(x, y, gridCols, gridRows)
}

/** Elimina claves fuera del tablero tras cambiar dimensiones. */
export function clampFixedZoneKeysToGrid(keys: Set<string>, gridCols: number, gridRows: number): Set<string> {
  const next = new Set<string>()
  for (const k of keys) {
    const m = /^(\d+):(\d+)$/.exec(k)
    if (!m) continue
    const x = Number(m[1])
    const y = Number(m[2])
    if (x >= 0 && y >= 0 && x < gridCols && y < gridRows) next.add(`${x}:${y}`)
  }
  return next
}
