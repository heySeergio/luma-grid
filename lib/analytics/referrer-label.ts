/** Etiqueta legible para agrupar fuentes de tráfico en intranet. */
export function parseReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer?.trim()) return null
  try {
    const url = new URL(referrer)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return host || null
  } catch {
    return null
  }
}

export function referrerLabel(host: string | null | undefined): string {
  if (!host?.trim()) return 'Directo / marcador'
  const h = host.toLowerCase().replace(/^www\./, '')

  if (h.includes('google.')) return 'Google'
  if (h.includes('bing.')) return 'Bing'
  if (h.includes('duckduckgo')) return 'DuckDuckGo'
  if (h.includes('yahoo.')) return 'Yahoo'
  if (h === 't.co' || h.includes('twitter.') || h === 'x.com' || h.endsWith('.x.com')) {
    return 'X (Twitter)'
  }
  if (h.includes('facebook.') || h === 'fb.com' || h === 'l.facebook.com') return 'Facebook'
  if (h.includes('instagram.')) return 'Instagram'
  if (h.includes('linkedin.')) return 'LinkedIn'
  if (h.includes('youtube.') || h === 'youtu.be') return 'YouTube'
  if (h.includes('tiktok.')) return 'TikTok'
  if (h.includes('reddit.')) return 'Reddit'
  if (h.includes('whatsapp.')) return 'WhatsApp'
  if (h.includes('telegram.')) return 'Telegram'

  return h
}

export function utmSourceLabel(source: string | null | undefined): string {
  if (!source?.trim()) return '—'
  return source.trim()
}
