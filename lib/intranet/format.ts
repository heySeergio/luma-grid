export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function countryFlagEmoji(code: string): string {
  const c = code.trim().toUpperCase()
  if (c.length !== 2) return '🌐'
  const A = 0x1f1e6
  return String.fromCodePoint(...[...c].map((ch) => A + ch.charCodeAt(0) - 65))
}
