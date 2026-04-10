/** Vista inicial al abrir /tablero (preferencia de cuenta). */
export type DefaultTableroTab = 'grid' | 'keyboard'

export function parseDefaultTableroTab(raw: unknown): DefaultTableroTab {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  return s === 'keyboard' ? 'keyboard' : 'grid'
}
