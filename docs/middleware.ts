import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * El sitio de documentación no usa NextAuth. Este archivo evita que el bundler
 * tome el middleware.ts de la raíz del monorepo (protege /admin, /tablero, etc.).
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: '/__docs_middleware_noop__',
}
