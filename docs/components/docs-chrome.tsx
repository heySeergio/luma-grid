'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { APP_ORIGIN } from '@/config/app-origin'
import { FUNCIONES_PATHS, sidebarNav, topTabs } from '@/config/navigation'
import { DocsSearch } from '@/components/DocsSearch'
import { DocsThemeToggle } from '@/components/DocsThemeToggle'
import { NavIcon } from '@/components/nav-icons'

function normalizePath(path: string) {
  const [p] = path.split('#')
  return p || '/'
}

function usePathnameAndHash() {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    setHash(() => (typeof window !== 'undefined' ? window.location.hash : ''))
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [pathname])

  return { pathname, hash }
}

function isActiveItem(itemHref: string, pathname: string, hash: string) {
  if (itemHref.startsWith('http://') || itemHref.startsWith('https://')) {
    return false
  }
  const [p, h] = itemHref.split('#')
  const base = normalizePath(p)
  if (pathname !== base) return false
  if (h) return hash === `#${h}`
  return hash === '' || hash === '#'
}

function isTopTabActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  if (href === '/guia') {
    return FUNCIONES_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  }
  if (href === '/changelog') return pathname.startsWith('/changelog')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DocsChrome({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = usePathnameAndHash()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <div className="docs-app">
      <header className="docs-topnav">
        <div className="docs-topnav-row">
          <div className="docs-topnav-left">
            <button
              type="button"
              className="docs-sidebar-toggle"
              aria-expanded={open}
              aria-controls="docs-sidebar"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="docs-sr-only">Abrir o cerrar menú</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>

            <Link href={APP_ORIGIN} className="docs-brand" prefetch={false} onClick={close}>
              <Image
                src="/logo-luma-grid.png"
                alt=""
                width={36}
                height={36}
                className="docs-brand-logo"
                priority
              />
              <span className="docs-brand-wordmark">Luma Grid</span>
            </Link>
          </div>

          <nav className="docs-topnav-tabs" aria-label="Secciones principales">
            {topTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={isTopTabActive(tab.href, pathname) ? 'docs-tab docs-tab--active' : 'docs-tab'}
                prefetch={false}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="docs-topnav-actions">
            <div className="docs-topnav-tools">
              <DocsThemeToggle />
              <DocsSearch />
            </div>
          </div>
        </div>
      </header>

      {open ? <button type="button" className="docs-sidebar-scrim" aria-label="Cerrar menú" onClick={close} /> : null}

      <div className="docs-frame">
        <aside id="docs-sidebar" className={`docs-sidebar${open ? ' docs-sidebar--open' : ''}`}>
          <div className="docs-sidebar-inner">
            {sidebarNav.map((section, i) => (
              <div key={i} className="docs-sidebar-section">
                {section.title ? <p className="docs-sidebar-heading">{section.title}</p> : null}
                <nav aria-label={section.title ?? 'Navegación'}>
                  <ul className="docs-sidebar-list">
                    {section.items.map((item) => {
                      const active = isActiveItem(item.href, pathname, hash)
                      const external = item.href.startsWith('http://') || item.href.startsWith('https://')
                      const className = `docs-sidebar-link${active ? ' docs-sidebar-link--active' : ''}`
                      return (
                        <li key={`${item.href}-${item.label}`}>
                          {external ? (
                            <a
                              href={item.href}
                              className={className}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={close}
                            >
                              <span className="docs-sidebar-icon" aria-hidden>
                                <NavIcon name={item.icon} />
                              </span>
                              {item.label}
                            </a>
                          ) : (
                            <Link href={item.href} className={className} prefetch={false} onClick={close}>
                              <span className="docs-sidebar-icon" aria-hidden>
                                <NavIcon name={item.icon} />
                              </span>
                              {item.label}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <main className="docs-main">{children}</main>
      </div>
    </div>
  )
}
