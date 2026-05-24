/**
 * Sugerencias léxicas del teclado complementario.
 * Incluye la coincidencia exacta (p. ej. «yo» al escribir «yo») y completados por prefijo.
 */
export function getKeyboardLexiconSuggestions(
  prefix: string,
  dictionary: readonly string[],
  limit = 8,
): string[] {
  const p = prefix.toLowerCase()
  if (!p) return []

  const seen = new Set<string>()
  const exact: string[] = []
  const partial: string[] = []

  for (const word of dictionary) {
    if (!word.startsWith(p) || seen.has(word)) continue
    seen.add(word)
    if (word === p) exact.push(word)
    else partial.push(word)
  }

  partial.sort((a, b) => a.length - b.length || a.localeCompare(b, 'es'))

  return [...exact, ...partial].slice(0, limit)
}
