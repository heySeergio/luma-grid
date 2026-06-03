/**
 * Silueta esquemática de España para el panel de analytics (viewBox 0 0 100 95).
 * No es cartografía exacta: sirve de referencia visual junto a los puntos por CCAA.
 */
export const SPAIN_MAP_VIEWBOX = '0 0 100 95'

/** Península ibérica (solo España, estilizada). */
export const SPAIN_PENINSULA_PATH =
  'M 9 27 C 6 21 7 13 13 10 C 19 7 26 10 32 14 L 40 16 C 48 15 56 18 64 22 L 73 25 C 79 28 82 34 81 42 C 79 50 74 57 67 63 L 59 69 C 52 74 43 76 35 74 L 26 69 C 20 64 15 56 13 47 L 10 37 C 9 32 8 29 9 27 Z'

/** Islas Baleares. */
export const SPAIN_BALEARES_PATH =
  'M 79 46 C 81 45 84 46 85 48 C 86 50 84 51 82 51 C 80 50 78 48 79 46 Z'

/** Islas Canarias (Tenerife + Gran Canaria, agrupadas). */
export const SPAIN_CANARIAS_PATH =
  'M 14 86 C 16 85 19 86 20 88 C 21 90 18 91 16 90 C 14 89 13 87 14 86 Z M 22 88 C 24 87 27 88 28 90 C 29 92 26 93 24 92 C 22 91 21 89 22 88 Z'

/** Ceuta y Melilla (enclave en el norte de África). */
export const SPAIN_ENCLAVES: Array<{ cx: number; cy: number; r: number }> = [
  { cx: 32, cy: 82, r: 1.8 },
  { cx: 48, cy: 82, r: 1.8 },
]
