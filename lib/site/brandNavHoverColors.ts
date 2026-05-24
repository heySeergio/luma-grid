/** Colores de hover del título de marca en el nav (ciclo en cada hover). */
export const BRAND_NAV_HOVER_SWATCHES: { color: string; textShadow?: string }[] = [
  { color: '#35AA63' },
  { color: '#F16641' },
  { color: '#3A7CEC' },
  {
    color: '#FFDB3D',
    textShadow: '0 0 1px rgba(28,43,36,0.35), 0 1px 2px rgba(28,43,36,0.22)',
  },
  {
    color: '#FFB3C8',
    textShadow: '0 0 1px rgba(28,43,36,0.28), 0 1px 2px rgba(28,43,36,0.18)',
  },
]

export const BRAND_NAV_HOVER_COLORS = BRAND_NAV_HOVER_SWATCHES.map((s) => s.color)
