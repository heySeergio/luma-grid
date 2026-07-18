'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import BrandLockup from '@/components/site/BrandLockup'

const links = [
  { href: '/stats', label: 'Overview', exact: true },
  { href: '/stats/web', label: 'Tráfico web' },
  { href: '/stats/revenue', label: 'Ingresos' },
  { href: '/stats/feedback', label: 'Feedback' },
  { href: '/stats/waitlist', label: 'Waitlist' },
] as const

function publicHref(href: string): string {
  if (typeof window === 'undefined') return href
  const host = window.location.hostname.toLowerCase()
  if (host === 'stats.lumagrid.app' || host.startsWith('stats.')) {
    if (href === '/stats') return '/'
    if (href.startsWith('/stats/')) return href.slice('/stats'.length)
  }
  return href
}

export function StatsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-black/10 bg-white/80 px-3 py-6">
      <div className="mb-8 flex justify-center px-1">
        <BrandLockup
          href={publicHref('/stats')}
          iconSize={40}
          priority
          iconClassName="rounded-none shadow-none"
          subtitle="STATS"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map(({ href, label, ...rest }) => {
          const exact = 'exact' in rest && rest.exact
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={publicHref(href)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-[#042D22] text-white'
                  : 'text-[#042D22]/75 hover:bg-black/[0.04] hover:text-[#042D22]'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-4 flex flex-col gap-1">
        <a
          href="https://lumagrid.app"
          className="rounded-xl px-3 py-2 text-xs font-medium text-[#042D22]/50 hover:text-[#042D22]"
        >
          ← Volver al sitio
        </a>
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-left text-xs font-medium text-[#042D22]/50 hover:text-[#042D22]"
          onClick={() => signOut({ callbackUrl: publicHref('/stats/login') })}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
