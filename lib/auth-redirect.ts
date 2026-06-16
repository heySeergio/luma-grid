export function getSafeCallbackUrl(rawValue: string | null | undefined, fallback = '/tablero') {
  if (!rawValue) {
    return fallback
  }

  if (rawValue.startsWith('/') && !rawValue.startsWith('//')) {
    return rawValue
  }

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(rawValue)
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      /* ignore malformed URLs */
    }
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
    if (target.origin !== window.location.origin) {
      return fallback
    }
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}
