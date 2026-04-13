import { effectiveSymbolGridId, parseGridCell } from '@/lib/grid/gridCellOverlap'
import { isFixedZonePosition } from '@/lib/grid/fixedZoneStorage'

function cellFitsGrid(px: number, py: number, cols: number, rows: number): boolean {
  return px >= 0 && py >= 0 && px < cols && py < rows
}

/** Misma semántica que `getSymbolPosition` / `applyAdminSymbolGridMove` en el admin. */
function symbolGridXY<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
  },
>(s: T): { x: number; y: number } {
  return {
    x: parseGridCell(s.positionX ?? s.position_x),
    y: parseGridCell(s.positionY ?? s.position_y),
  }
}

export function symbolCellFullyInFixedZone<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
  },
>(s: T, gridCols: number, gridRows: number, fixedZoneKeys: Set<string> | null): boolean {
  const { x: px, y: py } = symbolGridXY(s)
  if (!cellFitsGrid(px, py, gridCols, gridRows)) return false
  return isFixedZonePosition(px, py, gridCols, gridRows, fixedZoneKeys)
}

/** Celda del `main` que debe persistir al abrir una carpeta: geometría de base fija o marca `fixedCell` en BD. */
function isMainFixedBaseForFolderOverlay<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
    gridId?: string | null
    fixedCell?: boolean | null
  },
>(s: T, gridCols: number, gridRows: number, fixedZoneKeys: Set<string> | null): boolean {
  return symbolCellFullyInFixedZone(s, gridCols, gridRows, fixedZoneKeys) || Boolean(s.fixedCell)
}

function cellCoveredBySymbol<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
  },
>(s: T, cx: number, cy: number): boolean {
  const { x: px, y: py } = symbolGridXY(s)
  return px === cx && py === cy
}

/**
 * Base fija = mismo criterio de visibilidad que el tablero principal: los ocultos no se pintan.
 * Los bloqueados (`locked`) sí se incluyen (se ven igual que en el principal).
 */
function isSuppressedOnFolderOverlayFixedMain<
  T extends { state?: string | null; hidden?: boolean | null },
>(s: T): boolean {
  if (Boolean(s.hidden)) return true
  const st = s.state ?? 'visible'
  return st === 'hidden'
}

/**
 * Con carpeta activa, un símbolo de la carpeta puede solapar celdas de la base fija (mismo grid visual).
 * Prioriza el símbolo `main` cuyo rectángulo cae por completo en la zona fija para que la base siga siendo editable.
 */
export function findCoveringSymbolAtCellPreferringFixedMain<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
    gridId?: string | null
    fixedCell?: boolean | null
  },
>(
  symbols: T[],
  cx: number,
  cy: number,
  gridCols: number,
  gridRows: number,
  fixedZoneKeys: Set<string> | null,
): T | undefined {
  const isMain = (s: T) => effectiveSymbolGridId(s) === 'main'
  const fixedMainCovering = symbols.find(
    (s) =>
      isMain(s) &&
      isMainFixedBaseForFolderOverlay(s, gridCols, gridRows, fixedZoneKeys) &&
      cellCoveredBySymbol(s, cx, cy),
  )
  if (fixedMainCovering) return fixedMainCovering
  return symbols.find((s) => cellCoveredBySymbol(s, cx, cy))
}

/**
 * Vista del tablero principal: celdas del grid `main` que forman la base fija se muestran siempre; el resto solo
 * cuando no hay carpeta activa.
 * `fixedZoneKeys` null = perfil base canónico: 7 columnas izquierda + 1.ª fila (`isPositionInBaseFixedZone`), más
 * celdas con `fixedCell` en BD si aplica.
 *
 * Los símbolos del grid de la carpeta nunca pintan la zona fija geométrica: si quedaron copias antiguas en BD en esas
 * celdas, se ignoran; solo cuenta el grid `main` (evita que pictos borrados de la base reaparezcan al abrir una carpeta).
 *
 * Con carpeta activa: la zona fija replica el `main` como sin carpeta (incl. bloqueados); la zona no fija solo
 * muestra el grid de esa carpeta (o celdas vacías).
 */
export function mergeMainGridWithFolderView<
  T extends {
    positionX?: number | null
    positionY?: number | null
    position_x?: number | null
    position_y?: number | null
    gridId?: string | null
    state?: string | null
    hidden?: boolean | null
    fixedCell?: boolean | null
  },
>(
  symbols: T[],
  activeFolder: string | null,
  gridCols: number,
  gridRows: number,
  fixedZoneKeys: Set<string> | null = null,
): T[] {
  const inBounds = (s: T) => {
    const { x, y } = symbolGridXY(s)
    return cellFitsGrid(x, y, gridCols, gridRows)
  }

  const cellFullyInFixedZone = (s: T) => symbolCellFullyInFixedZone(s, gridCols, gridRows, fixedZoneKeys)

  const isMain = (s: T) => effectiveSymbolGridId(s) === 'main'

  const fixedMainOverlay = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return isMainFixedBaseForFolderOverlay(s, gridCols, gridRows, fixedZoneKeys)
  })
  const variableMain = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return !isMainFixedBaseForFolderOverlay(s, gridCols, gridRows, fixedZoneKeys)
  })

  if (!activeFolder) {
    return [...fixedMainOverlay, ...variableMain]
  }

  const fixedMain = fixedMainOverlay.filter((s) => !isSuppressedOnFolderOverlayFixedMain(s))

  const folderSyms = symbols.filter(
    (s) => effectiveSymbolGridId(s) === activeFolder && inBounds(s) && !cellFullyInFixedZone(s),
  )
  const key = (s: T) => {
    const { x, y } = symbolGridXY(s)
    return `${x}:${y}`
  }
  const byPos = new Map<string, T>()
  for (const s of folderSyms) byPos.set(key(s), s)
  for (const s of fixedMain) byPos.set(key(s), s)
  return Array.from(byPos.values())
}
