'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { AnimatedHeader } from '@/components/landing/AnimatedSection'
import { SHOW_LANDING_PRICING_SECTION } from '@/components/landing/landingFlags'
import { NavBrandTitle } from '@/components/landing/NavBrandTitle'

const nav = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#funciones', label: 'Funciones' },
  ...(SHOW_LANDING_PRICING_SECTION
    ? [{ href: '#planes' as const, label: 'Planes' as const }]
    : [{ href: 'planes' as const, label: 'Planes' as const }]),
  { href: 'instalar', label: 'Instalar' },
  { href: 'sobre-nosotros', label: 'Sobre nosotros' },
] as const

const navBeforeSeparator = 3

function navHref(href: string) {
  return href.startsWith('#') ? `/${href}` : `/${href}`
}

export function SiteHeader() {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const closeMobileNav = () => setMobileNavOpen(false)

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  return (
    <AnimatedHeader
      className="fixed left-0 right-0 top-0 z-[100] w-full bg-canvas"
      suppressHydrationWarning
      viewportAmount={0.01}
    >
      <div className="relative mx-auto max-w-6xl px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
        <div className="flex flex-col gap-3 rounded-full border border-black/[0.06] bg-white py-3 pl-4 pr-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:gap-2 sm:py-2.5 sm:pl-6 sm:pr-6">
          <div className="flex items-center justify-between gap-3 sm:contents">
            <Link
              href="/#inicio"
              className="flex min-w-0 items-center gap-2.5 font-bricolage-heading text-base font-extrabold tracking-tight text-neutral-950 sm:shrink-0 sm:text-lg"
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
            <div className="flex items-center gap-2 sm:hidden">
              {isAuthenticated ? (
                <Link
                  href="/tablero"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FE6B45] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  Ir al tablero
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FE6B45] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  Crear cuenta
                </Link>
              )}
              <button
                type="button"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                aria-expanded={mobileNavOpen}
                aria-controls="marketing-mobile-nav"
                aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMobileNavOpen(o => !o)}
              >
                {mobileNavOpen ? (
                  <X className="size-[1.15rem]" strokeWidth={2.25} aria-hidden />
                ) : (
                  <Menu className="size-[1.15rem]" strokeWidth={2.25} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <nav
            className="no-scrollbar -mx-1 hidden items-center gap-1 overflow-x-auto px-1 text-sm font-medium text-neutral-600 md:flex md:flex-1 md:justify-center md:gap-0 md:px-0 md:py-0"
            aria-label="Secciones principales"
          >
            {nav.map((item, index) => (
              <span key={item.href} className="flex shrink-0 items-center">
                {index === navBeforeSeparator ? (
                  <span className="mx-2 hidden h-4 w-px shrink-0 bg-neutral-200 md:block" aria-hidden />
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

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Link
                href="/tablero"
                className="inline-flex items-center justify-center rounded-full bg-[#FE6B45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                Ir al tablero
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-neutral-50"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#FE6B45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[105] bg-black/30 md:hidden"
              aria-label="Cerrar menú"
              onClick={closeMobileNav}
            />
            <nav
              id="marketing-mobile-nav"
              className="absolute left-4 right-4 top-full z-[110] mt-2 md:hidden"
              aria-label="Secciones principales"
            >
              <div className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_20px_48px_rgba(0,0,0,0.14)]">
                <ul className="flex flex-col py-1">
                  {nav.map(item => (
                    <li key={item.href}>
                      <Link
                        href={navHref(item.href)}
                        className="block px-5 py-3.5 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-50 active:bg-neutral-100"
                        onClick={closeMobileNav}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-black/[0.06]">
                    {isAuthenticated ? (
                      <Link
                        href="/tablero"
                        className="block px-5 py-3.5 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
                        onClick={closeMobileNav}
                      >
                        Ir al tablero
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        className="block px-5 py-3.5 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
                        onClick={closeMobileNav}
                      >
                        Iniciar sesión
                      </Link>
                    )}
                  </li>
                </ul>
              </div>
            </nav>
          </>
        ) : null}
      </div>
    </AnimatedHeader>
  )
}
