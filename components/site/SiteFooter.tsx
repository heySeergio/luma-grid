'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { updateThemePreference } from '@/app/actions/account'
import BrandLockup from '@/components/site/BrandLockup'

const FOOTER_LINKS = [
  { href: '/branding', label: 'Branding' },
  { href: '/terminos', label: 'Términos y Condiciones' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/cookies', label: 'Cookies' },
]

export default function SiteFooter() {
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session, update: updateSession } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const handleThemeToggle = async () => {
    const nextTheme = isDark ? 'light' : 'dark'

    setTheme(nextTheme)

    if (!session?.user?.id) {
      return
    }

    setIsUpdatingTheme(true)
    try {
      const updatedUser = await updateThemePreference(nextTheme)
      await updateSession({
        user: {
          preferredTheme: updatedUser.preferredTheme,
          preferredDyslexiaFont: updatedUser.preferredDyslexiaFont,
        },
      })
    } catch {
      setTheme(session.user.preferredTheme ?? 'system')
    } finally {
      setIsUpdatingTheme(false)
    }
  }

  return (
    <footer className="border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-bg-soft)_82%,var(--app-surface-elevated))] dark:bg-[color-mix(in_srgb,var(--app-surface-strong)_88%,black_12%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 md:px-10 md:py-10">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            disabled={isUpdatingTheme}
            className="ui-icon-button inline-flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <BrandLockup
          href="/"
          iconSize={40}
          wordmarkWidth={146}
          subtitle="Comunicación Aumentativa y Alternativa con una base visual, lingüística y accesible."
          iconClassName="rounded-none"
        />

        <nav className="flex flex-wrap gap-3 text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="ui-secondary-button rounded-full px-4 py-2 font-medium text-[var(--app-foreground)] transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        </div>
      </div>
    </footer>
  )
}
