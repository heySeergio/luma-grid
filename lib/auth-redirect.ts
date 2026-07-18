function isAllowedLumaHostname(hostname: string): boolean {
  return hostname === 'lumagrid.app' || hostname.endsWith('.lumagrid.app')
}

export function getSafeCallbackUrl(rawValue: string | null | undefined, fallback = '/tablero') {
  if (!rawValue) {
    return fallback
  }

  if (rawValue.startsWith('/') && !rawValue.startsWith('//')) {
    return rawValue
  }

  try {
    const url = new URL(rawValue)
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`
    }
    if (isAllowedLumaHostname(url.hostname)) {
      return url.toString()
    }
  } catch {
    /* ignore malformed URLs */
  }

  return fallback
}

/** Evita redirigir fuera del origen actual cuando NextAuth usa NEXTAUTH_URL de otro entorno. */
export function resolveClientSignInRedirect(
  resUrl: string | null | undefined,
  fallback: string,
): string {
  if (!resUrl) {
    return fallback
  }

  if (typeof window === 'undefined') {
    return resUrl.startsWith('/') ? resUrl : fallback
  }

  try {
    const target = new URL(resUrl, window.location.origin)
    if (target.origin === window.location.origin) {
      return `${target.pathname}${target.search}${target.hash}`
    }
    if (isAllowedLumaHostname(target.hostname)) {
      return target.toString()
    }
    return fallback
  } catch {
    return fallback
  }
}
