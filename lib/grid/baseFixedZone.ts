/** Columnas fijas por la izquierda en el tablero base (coincide con la plantilla demo). */
export const BASE_FIXED_LEFT_COLUMN_COUNT = 7

/**
 * Zona fija global del tablero: las primeras 7 columnas (enteras) y la primera fila (entera).
 * La región variable es donde `x >= 7` y `y >= 1` (en un grid de al menos 8 columnas y 2 filas).
 */
export function isPositionInBaseFixedZone(
  x: number,
  y: number,
  gridCols: number,
  gridRows: number,
): boolean {
  if (x < 0 || y < 0 || x >= gridCols || y >= gridRows) return false
  const leftW = Math.min(BASE_FIXED_LEFT_COLUMN_COUNT, gridCols)
  if (x < leftW) return true
  if (y === 0) return true
  return false
}
