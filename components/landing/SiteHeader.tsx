'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { AnimatedHeader } from '@/components/landing/AnimatedSection'
import { NavBrandTitle } from '@/components/landing/NavBrandTitle'
import { WaitlistModal } from '@/components/landing/WaitlistModal'

const nav = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#funciones', label: 'Funciones' },
  { href: '#planes', label: 'Planes' },
  { href: 'instalar', label: 'Instalar' },
  { href: 'sobre-nosotros', label: 'Sobre nosotros' },
] as const

const navBeforeSeparator = 3

function navHref(href: string) {
  return href.startsWith('#') ? `/${href}` : `/${href}`
}

type SiteHeaderProps = {
  comingSoon?: boolean
}

export function SiteHeader({ comingSoon = true }: SiteHeaderProps) {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistKey, setWaitlistKey] = useState(0)

  const openWaitlist = () => {
    setWaitlistKey(k => k + 1)
    setWaitlistOpen(true)
  }

  return (
    <AnimatedHeader
      className="fixed left-0 right-0 top-0 z-[100] w-full bg-canvas"
      suppressHydrationWarning
      viewportAmount={0.01}
    >
      <div className="mx-auto max-w-6xl px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
        <div className="flex flex-col gap-3 rounded-full border border-black/[0.06] bg-white py-3 pl-4 pr-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:gap-2 sm:py-2.5 sm:pl-6 sm:pr-6">
          <div className="flex items-center justify-between gap-3 sm:contents">
            <Link
              href="/#inicio"
              className="flex min-w-0 items-center gap-2.5 text-base font-extrabold tracking-tight text-neutral-950 sm:shrink-0 sm:text-lg"
            >
              <Image
                src="/logo-luma-grid.png"
                alt=""
                width={40}
                height={40}
                className="h-8 w-8 shrink-0 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:h-9 sm:w-9"
                priority
              />
              <NavBrandTitle>Luma Grid</NavBrandTitle>
            </Link>
            {comingSoon ? (
              <button
                type="button"
                onClick={openWaitlist}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FE6B45] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95 sm:hidden"
                aria-haspopup="dialog"
                aria-expanded={waitlistOpen}
              >
                Entrar en waitlist
              </button>
            ) : (
              <Link
                href="/tablero"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FE6B45] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95 sm:hidden"
              >
                Abrir app
              </Link>
            )}
          </div>

          <nav className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1 text-sm font-medium text-neutral-600 sm:mx-0 sm:flex-1 sm:justify-center sm:gap-0 sm:px-0 sm:py-0">
            {nav.map((item, index) => (
              <span key={item.href} className="flex shrink-0 items-center">
                {index === navBeforeSeparator ? (
                  <span className="mx-2 hidden h-4 w-px shrink-0 bg-neutral-200 sm:block" aria-hidden />
                ) : null}
                <Link
                  href={navHref(item.href)}
                  className="whitespace-nowrap rounded-full px-2.5 py-1.5 transition hover:bg-neutral-100 hover:text-neutral-950 sm:px-3"
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>

          {comingSoon ? (
            <button
              type="button"
              onClick={openWaitlist}
              className="hidden shrink-0 items-center justify-center rounded-full bg-[#FE6B45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 sm:inline-flex"
              aria-haspopup="dialog"
              aria-expanded={waitlistOpen}
            >
              Entrar en waitlist
            </button>
          ) : (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-neutral-50"
              >
                Panel admin
              </Link>
              <Link
                href="/tablero"
                className="inline-flex items-center justify-center rounded-full bg-[#FE6B45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                Abrir app
              </Link>
            </div>
          )}
        </div>
      </div>
      {comingSoon ? (
        <WaitlistModal key={waitlistKey} open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
      ) : null}
    </AnimatedHeader>
  )
}
