'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandLockup from '@/components/site/BrandLockup'

const links = [
  { href: '/intranet', label: 'Overview', exact: true },
  { href: '/intranet/users', label: 'Usuarios' },
  { href: '/intranet/revenue', label: 'Ingresos' },
  { href: '/intranet/feedback', label: 'Feedback' },
  { href: '/intranet/waitlist', label: 'Waitlist' },
  { href: '/intranet/analytics', label: 'Analytics' },
  { href: '/intranet/system', label: 'Sistema' },
] as const

export function IntranetSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-black/10 bg-white/80 px-3 py-6">
      <div className="mb-8 px-1">
        <BrandLockup
          href="/intranet"
          variant="marketing"
          iconSize={40}
          priority
          iconClassName="rounded-none shadow-none"
          subtitle="INTRANET"
          subtitleClassName="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#042D22]/45"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map(({ href, label, ...rest }) => {
          const exact = 'exact' in rest && rest.exact
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
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
        <Link
          href="/"
          className="rounded-xl px-3 py-2 text-xs font-medium text-[#042D22]/50 hover:text-[#042D22]"
        >
          ← Volver al sitio
        </Link>
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-left text-xs font-medium text-[#042D22]/50 hover:text-[#042D22]"
          onClick={async () => {
            await fetch('/api/intranet/logout', { method: 'POST' })
            window.location.href = '/intranet/login'
          }}
        >
          Cerrar sesión intranet
        </button>
      </div>
    </aside>
  )
}
