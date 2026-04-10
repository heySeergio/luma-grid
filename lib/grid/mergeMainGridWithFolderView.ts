import { isFixedZonePosition } from '@/lib/grid/fixedZoneStorage'

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
    const x = s.positionX ?? 0
    const y = s.positionY ?? 0
    return x >= 0 && y >= 0 && x < gridCols && y < gridRows
  }

  const isMain = (s: T) => (s.gridId ?? 'main') === 'main'

  const fixedMain = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return isFixedZonePosition(s.positionX ?? 0, s.positionY ?? 0, gridCols, gridRows, fixedZoneKeys)
  })
  const variableMain = symbols.filter((s) => {
    if (!isMain(s) || !inBounds(s)) return false
    return !isFixedZonePosition(s.positionX ?? 0, s.positionY ?? 0, gridCols, gridRows, fixedZoneKeys)
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
