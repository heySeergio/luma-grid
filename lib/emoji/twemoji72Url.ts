/**
 * URL del asset PNG 72×72 de Twemoji en el CDN de jsDelivr (misma convención de nombres que twitter/twemoji).
 */
const TWEMOJI_72_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@15.1.0/assets/72x72'

/** Convierte texto Unicode (incl. pares sustitutos) a codepoints hex en minúsculas unidos por guiones. */
function toCodePoint(unicodeSurrogates: string, separator = '-'): string {
  const r: string[] = []
  let p = 0
  let i = 0
  while (i < unicodeSurrogates.length) {
    const c = unicodeSurrogates.charCodeAt(i++)
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16))
      p = 0
    } else if (c >= 0xd800 && c <= 0xdbff) {
      p = c
    } else {
      r.push(c.toString(16))
    }
  }
  return r.join(separator)
}

export function twemoji72Url(emoji: string): string {
  const trimmed = emoji.trim()
  if (!trimmed) {
    return `${TWEMOJI_72_BASE}/2753.png`
  }
  return `${TWEMOJI_72_BASE}/${toCodePoint(trimmed, '-')}.png`
}

export default twemoji72Url
