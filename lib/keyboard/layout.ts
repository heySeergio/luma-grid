/** Disposición del teclado español (única fuente para Keyboard.tsx y colores por tecla). */

export const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const

export const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['@', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
] as const

export const PUNCT_ROW = ['-', '?', '¿', '¡', '!', '#'] as const

/** Ids fijos para zonas que no son un carácter. */
export const KB_SPECIAL_IDS = {
  composer: 'cmp:input',
  send: 'act:send',
  backspace: 'act:backspace',
  space: 'key:space',
} as const

export function charKeyId(char: string): string {
  return `key:${char}`
}

/** Todos los ids válidos para `keyColors` (whitelist persistencia). */
export function allKeyboardKeyColorIds(): Set<string> {
  const s = new Set<string>(Object.values(KB_SPECIAL_IDS))
  for (const c of NUMBER_ROW) s.add(charKeyId(c))
  for (const row of LETTER_ROWS) {
    for (const c of row) s.add(charKeyId(c))
  }
  for (const c of PUNCT_ROW) s.add(charKeyId(c))
  return s
}

const ALLOWED = allKeyboardKeyColorIds()

export function isAllowedKeyColorId(id: string): boolean {
  return ALLOWED.has(id)
}

/** Etiqueta legible para la UI del editor. */
export function keyboardKeyIdLabel(id: string): string {
  if (id === KB_SPECIAL_IDS.composer) return 'Barra de escritura'
  if (id === KB_SPECIAL_IDS.send) return 'Enviar frase'
  if (id === KB_SPECIAL_IDS.backspace) return 'Borrar carácter'
  if (id === KB_SPECIAL_IDS.space) return 'Espacio'
  if (id.startsWith('key:')) {
    const rest = id.slice(4)
    return rest || id
  }
  return id
}
