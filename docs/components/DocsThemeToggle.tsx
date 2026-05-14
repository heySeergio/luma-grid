'use client'

import { useCallback, useLayoutEffect, useState } from 'react'

const STORAGE_KEY = 'docs-theme'

function readDark(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('docs-dark')
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('docs-dark', dark)
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  } catch {
    /* ignore */
  }
}

export function DocsThemeToggle() {
  const [dark, setDark] = useState(false)

  useLayoutEffect(() => {
    setDark(readDark())
  }, [])

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      applyDark(next)
      return next
    })
  }, [])

  return (
    <button
      type="button"
      className="docs-theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Activar tema claro' : 'Activar tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
    >
      {dark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
