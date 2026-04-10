'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

export type AdminGridContextMenuItem = {
  key: string
  label: string
  disabled?: boolean
  /** Estilo de acción destructiva (p. ej. eliminar). */
  destructive?: boolean
  onSelect: () => void
}

type Props = {
  open: boolean
  x: number
  y: number
  items: AdminGridContextMenuItem[]
  onClose: () => void
}

const VIEWPORT_PAD = 8

export default function AdminGridContextMenu({ open, x, y, items, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current
      if (!el) return
      const target = e.target
      if (target instanceof Node && el.contains(target)) return
      onClose()
    }
    const t = window.setTimeout(() => {
      document.addEventListener('mousedown', onPointer, true)
      document.addEventListener('touchstart', onPointer, true)
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onPointer, true)
      document.removeEventListener('touchstart', onPointer, true)
    }
  }, [open, onClose])

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return
    const el = rootRef.current
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = x
    let top = y
    if (left + r.width + VIEWPORT_PAD > vw) {
      left = Math.max(VIEWPORT_PAD, vw - r.width - VIEWPORT_PAD)
    }
    if (top + r.height + VIEWPORT_PAD > vh) {
      top = Math.max(VIEWPORT_PAD, vh - r.height - VIEWPORT_PAD)
    }
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }, [open, x, y, items])

  if (!open || items.length === 0) return null

  return (
    <div
      ref={rootRef}
      className="fixed z-[100] min-w-[11rem] rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg dark:border-slate-600/80 dark:bg-slate-900"
      style={{
        left: x,
        top: y,
      }}
      role="menu"
      aria-label="Menú contextual del tablero"
    >
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                item.destructive
                  ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50'
                  : 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80'
              }`}
              onClick={() => {
                if (item.disabled) return
                item.onSelect()
                onClose()
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
