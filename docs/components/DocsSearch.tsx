'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DOCS_SEARCH_INDEX } from '@/config/search-index'
import { filterDocsSearchIndex } from '@/lib/docs-search'

const MAX_RESULTS = 12

export function DocsSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = 'docs-search-results'

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const results = useMemo(() => filterDocsSearchIndex(query, DOCS_SEARCH_INDEX).slice(0, MAX_RESULTS), [query])

  const showPanel = open && query.trim().length > 0

  useEffect(() => {
    setActive(0)
  }, [query, results.length])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const clearAndClose = useCallback(() => {
    setQuery('')
    close()
  }, [close])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    if (showPanel) {
      document.addEventListener('mousedown', onDoc)
      return () => document.removeEventListener('mousedown', onDoc)
    }
  }, [showPanel, close])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) {
      if (e.key === 'Escape') {
        e.currentTarget.blur()
        close()
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
      close()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
      return
    }

    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      const href = results[active]?.href ?? results[0]!.href
      clearAndClose()
      inputRef.current?.blur()
      router.push(href)
    }
  }

  return (
    <div ref={wrapRef} className={`docs-search${showPanel ? ' docs-search--open' : ''}`} role="search">
      <span className="docs-search-icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        ref={inputRef}
        className="docs-search-input"
        type="search"
        name="docs-q"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Buscar en la guía…"
        aria-label="Buscar en la documentación"
        aria-autocomplete="list"
        aria-controls={showPanel ? listId : undefined}
        aria-expanded={showPanel}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
      />
      <kbd className="docs-kbd" aria-hidden>
        ⌘K
      </kbd>

      {showPanel ? (
        <div id={listId} className="docs-search-panel" role="listbox" aria-label="Resultados de búsqueda">
          {results.length === 0 ? (
            <p className="docs-search-empty">No hay resultados para esa búsqueda.</p>
          ) : (
            <ul className="docs-search-list">
              {results.map((item, idx) => (
                <li key={item.href} role="presentation">
                  <Link
                    href={item.href}
                    role="option"
                    aria-selected={idx === active}
                    className={`docs-search-hit${idx === active ? ' docs-search-hit--active' : ''}`}
                    prefetch={false}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      clearAndClose()
                    }}
                  >
                    <span className="docs-search-hit-section">{item.section}</span>
                    <span className="docs-search-hit-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
