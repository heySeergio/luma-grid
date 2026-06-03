/** Rutas que no registramos como visita web (panel, API, assets). */
export function shouldTrackWebVisitPath(pathname: string): boolean {
  if (!pathname.startsWith('/')) return false
  if (pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/intranet')) return false
  if (pathname.startsWith('/_next/')) return false
  if (pathname.startsWith('/icons/')) return false
  if (pathname === '/sw.js' || pathname.startsWith('/workbox-')) return false
  // Uso autenticado del producto (ya cubierto en analytics de app).
  if (pathname === '/tablero' || pathname.startsWith('/tablero/')) return false
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return false
  return true
}

/** Etiqueta corta para rutas en tablas del panel. */
export function pathLabel(path: string): string {
  if (path === '/') return 'Inicio (/)'
  if (path === '/login') return 'Login'
  if (path === '/register') return 'Registro'
  if (path === '/plan') return 'Planes'
  if (path === '/beta') return 'Beta'
  if (path === '/sobre-nosotros') return 'Sobre nosotros'
  if (path === '/privacidad') return 'Privacidad'
  if (path === '/cookies') return 'Cookies'
  if (path === '/terminos') return 'Términos'
  if (path.startsWith('/docs')) return `Docs${path.slice(5) || ''}`
  return path
}
