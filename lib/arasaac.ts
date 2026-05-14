/**
 * Utilidades compartidas para la autocarga de pictogramas ARASAAC.
 * Usadas tanto en el tablero (/tablero) como en el panel de administración (/admin).
 */

/** Incluye `demo`: ítems de carpeta del tablero base (`computeMainGrid`) usan ese gridId. */
export const ARASAAC_BASE_GRID_IDS = new Set([
  'default',
  'default-left',
  'template',
  'template-left',
  'demo',
])

const arasaacFirstImageCache = new Map<string, string | null>()
const arasaacInFlight = new Map<string, Promise<string | null>>()

/** Categoría de los ítems de la carpeta «Frases hechas»: solo texto, sin emoji ni pictogramas ARASAAC. */
export const FRASES_HECHAS_CATEGORY = 'Frases hechas'

/** Devuelve true si este símbolo del tablero base debe intentar cargar un pictograma ARASAAC automáticamente. */
export function shouldAutoloadArasaacForSymbol(symbol: {
  imageUrl?: string | null
  image_url?: string | null
  gridId?: string | null
  id?: string | null
  category?: string | null
}): boolean {
  const cat = typeof symbol.category === 'string' ? symbol.category.trim() : ''
  if (cat === FRASES_HECHAS_CATEGORY) return false
  const imageUrl = symbol.imageUrl ?? symbol.image_url
  if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) return false
  const gridId = typeof symbol.gridId === 'string' ? symbol.gridId : ''
  if (ARASAAC_BASE_GRID_IDS.has(gridId)) return true
  const id = typeof symbol.id === 'string' ? symbol.id : ''
  return (
    id.startsWith('template-') ||
    id.startsWith('default-') ||
    id.startsWith('fixed-left-') ||
    id.startsWith('default-left-')
  )
}

/** Busca la primera imagen ARASAAC para una etiqueta. Cachea resultados y deduplica peticiones en vuelo. */
export async function fetchFirstArasaacImage(label: string): Promise<string | null> {
  const key = label.trim().toLowerCase()
  if (!key) return null
  if (arasaacFirstImageCache.has(key)) {
    return arasaacFirstImageCache.get(key) ?? null
  }
  const running = arasaacInFlight.get(key)
  if (running) return running

  const request = (async () => {
    try {
      const res = await fetch(`/api/arasaac?q=${encodeURIComponent(label)}&locale=es`)
      if (!res.ok) return null
      const data = (await res.json()) as {
        pictograms?: Array<{ imageUrl?: string | null }>
      }
      const first = Array.isArray(data.pictograms)
        ? data.pictograms.find((p) => typeof p.imageUrl === 'string' && p.imageUrl.trim().length > 0)
        : null
      const imageUrl = first?.imageUrl?.trim() || null
      arasaacFirstImageCache.set(key, imageUrl)
      return imageUrl
    } catch {
      arasaacFirstImageCache.set(key, null)
      return null
    } finally {
      arasaacInFlight.delete(key)
    }
  })()

  arasaacInFlight.set(key, request)
  return request
}
