'use client'

import { useEffect, useRef } from 'react'

/**
 * El tablero AAC debe mostrarse en tema claro (legibilidad de pictogramas y contraste).
 * Quita temporalmente la clase `dark` del documento sin tocar la preferencia guardada en next-themes.
 */
export default function TableroForceLight({ children }: { children: React.ReactNode }) {
  const snapshot = useRef<{ hadDark: boolean; colorScheme: string } | null>(null)

  useEffect(() => {
    const el = document.documentElement
    snapshot.current = {
      hadDark: el.classList.contains('dark'),
      colorScheme: el.style.colorScheme,
    }
    el.classList.remove('dark')
    el.style.colorScheme = 'light'

    return () => {
      const s = snapshot.current
      snapshot.current = null
      if (!s) return
      if (s.hadDark) {
        el.classList.add('dark')
        el.style.colorScheme = 'dark'
      } else {
        el.style.colorScheme = s.colorScheme
      }
    }
  }, [])

  return <>{children}</>
}
