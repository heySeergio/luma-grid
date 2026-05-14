import type { DocsSearchEntry } from '@/config/search-index'

/** Normaliza texto para comparar sin importar mayúsculas ni tildes. */
export function normalizeDocsSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Comprueba si la consulta coincide con título, sección o palabras clave (todas las palabras deben aparecer). */
export function docsSearchMatches(query: string, entry: DocsSearchEntry): boolean {
  const q = normalizeDocsSearchText(query).trim()
  if (!q) return false
  const haystack = normalizeDocsSearchText(`${entry.title} ${entry.section} ${entry.keywords}`)
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((t) => haystack.includes(t))
}

export function filterDocsSearchIndex(query: string, entries: readonly DocsSearchEntry[]): DocsSearchEntry[] {
  if (!query.trim()) return []
  return entries.filter((e) => docsSearchMatches(query, e))
}
