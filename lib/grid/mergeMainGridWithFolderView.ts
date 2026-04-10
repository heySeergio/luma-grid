import { isFixedZonePosition } from '@/lib/grid/fixedZoneStorage'

function cellFitsGrid(px: number, py: number, cols: number, rows: number): boolean {
  return px >= 0 && py >= 0 && px < cols && py < rows
}

export function symbolCellFullyInFixedZone<
  T extends {
    positionX?: number | null
    positionY?: number | null
  },
>(s: T, gridCols: number, gridRows: number, fixedZoneKeys: Set<string> | null): boolean {
  const px = Number(s.positionX ?? 0)
  const py = Number(s.positionY ?? 0)
  if (!cellFitsGrid(px, py, gridCols, gridRows)) return false
  return isFixedZonePosition(px, py, gridCols, gridRows, fixedZoneKeys)
}

function cellCoveredBySymbol<
  T extends {
    positionX?: number | null
    positionY?: number | null
  },
>(s: T, cx: number, cy: number): boolean {
  const px = Number(s.positionX ?? 0)
  const py = Number(s.positionY ?? 0)
  return px === cx && py === cy
}

/**
 * Con carpeta activa, un símbolo de la carpeta puede solapar celdas de la base fija (mismo grid visual).
 * Prioriza el símbolo `main` cuyo rectángulo cae por completo en la zona fija para que la base siga siendo editable.
 */
export function findCoveringSymbolAtCellPreferringFixedMain<
  T extends {
    positionX?: number | null
    positionY?: number | null
    gridId?: string | null
  },
>(
  symbols: T[],
  cx: number,
  cy: number,
  gridCols: number,
  gridRows: number,
  fixedZoneKeys: Set<string> | null,
): T | undefined {
  const isMain = (s: T) => (s.gridId ?? 'main') === 'main'
  const fixedMainCovering = symbols.find(
    (s) =>
      isMain(s) &&
      symbolCellFullyInFixedZone(s, gridCols, gridRows, fixedZoneKeys) &&
      cellCoveredBySymbol(s, cx, cy),
  )
  if (fixedMainCovering) return fixedMainCovering
  return symbols.find((s) => cellCoveredBySymbol(s, cx, cy))
}

/**
 * Vista del tablero principal: celdas del grid `main` en la zona fija se muestran siempre; el resto solo
 * cuando no hay carpeta activa. `fixedZoneKeys` null = plantilla por defecto (7 col + fila 0).
 */
export function mergeMainGridWithFolderView<
  T extends {
    positionX?: number | null
    positionY?: number | null
    gridId?: string | null
  },
>(
  symbols: T[],
  activeFolder: string | null,
  gridCols: number,
  gridRows: number,
  fixedZoneKeys: Set<string> | null = null,
): T[] {
  const inBounds = (s: T) => {
    const x = Number(s.positionX ?? 0)
    const y = Number(s.positionY ?? 0)
    return cellFitsGrid(x, y, gridCols, gridRows)
  }

  const cellFullyInFixedZone = (s: T) => symbolCellFullyInFixedZone(s, gridCols, gridRows, fixedZoneKeys)

  const isMain = (s: T) => (s.gridId ?? 'main') === 'main'

  const fixedMain = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return cellFullyInFixedZone(s)
  })
  const variableMain = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return !cellFullyInFixedZone(s)
  })

  if (!activeFolder) {
    return [...fixedMain, ...variableMain]
  }

  const folderSyms = symbols.filter((s) => s.gridId === activeFolder && inBounds(s))
  const key = (s: T) => `${s.positionX}:${s.positionY}`
  const byPos = new Map<string, T>()
  for (const s of folderSyms) byPos.set(key(s), s)
  for (const s of fixedMain) byPos.set(key(s), s)
  return Array.from(byPos.values())
}
