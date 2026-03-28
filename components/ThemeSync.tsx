'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

export function ThemeSync() {
  const { data: session } = useSession()
  const { setTheme } = useTheme()

  useEffect(() => {
    const preferredTheme = session?.user?.preferredTheme
    if (!preferredTheme) return
    setTheme(preferredTheme)
  }, [session?.user?.preferredTheme, setTheme])

  useEffect(() => {
    document.body.classList.toggle('font-dyslexia-enabled', Boolean(session?.user?.preferredDyslexiaFont))
  }, [session?.user?.preferredDyslexiaFont])

  return null
}
