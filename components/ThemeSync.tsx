'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

const MARKETING_PATHS = new Set([
  '/',
  '/sobre-nosotros',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/instalar',
])

export function ThemeSync() {
  const pathname = usePathname()
  const isTableroRoute = pathname?.startsWith('/tablero') ?? false
  const isMarketingRoute = pathname != null && MARKETING_PATHS.has(pathname)
  const { data: session } = useSession()
  const { setTheme } = useTheme()

  useEffect(() => {
    /** La landing comercial es solo modo claro (canvas cálido); evita mezclar `--app-bg` oscuro del body. */
    if (isMarketingRoute) {
      setTheme('light')
      return
    }
    if (isTableroRoute) return
    const preferredTheme = session?.user?.preferredTheme
    if (!preferredTheme) return
    setTheme(preferredTheme)
  }, [isMarketingRoute, isTableroRoute, session?.user?.preferredTheme, setTheme])

  useEffect(() => {
    document.body.classList.toggle('font-dyslexia-enabled', Boolean(session?.user?.preferredDyslexiaFont))
  }, [session?.user?.preferredDyslexiaFont])

  return null
}
