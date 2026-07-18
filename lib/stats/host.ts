/** Hostnames that serve the internal stats panel (rewritten to /stats). */
export function isStatsHostname(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false
  const host = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  if (host === 'stats.lumagrid.app') return true
  if (host === 'stats.localhost' || host === 'stats.127.0.0.1') return true
  const extra = process.env.STATS_DEV_HOST?.trim().toLowerCase()
  if (extra && host === extra) return true
  return false
}

export const STATS_PUBLIC_ORIGIN = 'https://stats.lumagrid.app'

/** Paths on the stats host that do not require an authenticated allowlisted session. */
export function isStatsPublicPath(pathname: string): boolean {
  if (pathname === '/stats/login' || pathname.startsWith('/stats/login/')) return true
  if (pathname === '/stats/forbidden' || pathname.startsWith('/stats/forbidden/')) return true
  if (pathname === '/login' || pathname.startsWith('/login/')) return true
  if (pathname.startsWith('/api/auth')) return true
  return false
}

/**
 * Map a public path on the stats host to the internal /stats app path.
 * Returns null when no rewrite is needed.
 */
export function statsHostRewritePath(pathname: string): string | null {
  if (pathname.startsWith('/api/')) return null
  if (pathname.startsWith('/_next')) return null
  if (pathname.startsWith('/stats')) return null

  // Solo /login → panel stats; /login/two-factor y resto usan las páginas de la app
  if (pathname === '/login') {
    return '/stats/login'
  }
  if (pathname.startsWith('/login/')) {
    return null
  }

  if (pathname === '/') return '/stats'
  return `/stats${pathname}`
}
