'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

export function ThemeSync() {
  const pathname = usePathname()
  const isTableroRoute = pathname?.startsWith('/tablero') ?? false
  const { data: session } = useSession()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (isTableroRoute) return
    const preferredTheme = session?.user?.preferredTheme
    if (!preferredTheme) return
    setTheme(preferredTheme)
  }, [isTableroRoute, session?.user?.preferredTheme, setTheme])

  useEffect(() => {
    document.body.classList.toggle('font-dyslexia-enabled', Boolean(session?.user?.preferredDyslexiaFont))
  }, [session?.user?.preferredDyslexiaFont])

  return null
}
