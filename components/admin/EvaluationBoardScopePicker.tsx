'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Layers } from 'lucide-react'
import type { AdminNavProfile } from '@/components/admin/AdminPanelNav'

export type EvaluationScope = 'single' | 'all'

type Props = {
  profiles: AdminNavProfile[]
  selectedProfileId: string | null
  scope: EvaluationScope
  onSelectProfile: (id: string) => void
  onSelectAllBoards: () => void
}

type MenuPosition = { top: number; left: number }

export default function EvaluationBoardScopePicker({
  profiles,
  selectedProfileId,
  scope,
  onSelectProfile,
  onSelectAllBoards,
}: Props) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const [mounted, setMounted] = useState(false)

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)
  const reportLabel =
    scope === 'all' ? 'Todos los tableros' : (selectedProfile?.name ?? 'Tablero')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 6, left: rect.left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (rootRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const menu =
    open && menuPosition && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            className="fixed z-[60] min-w-[14rem] overflow-hidden rounded-xl border border-slate-200/90 bg-[var(--app-bg)] py-1 shadow-lg dark:border-slate-700/90"
          >
            <button
              type="button"
              role="menuitem"
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-[var(--app-hover)] ${
                scope === 'all'
                  ? 'bg-violet-50/80 font-semibold text-violet-900 dark:bg-violet-950/30 dark:text-violet-100'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
              onClick={() => {
                onSelectAllBoards()
                setOpen(false)
              }}
            >
              <Layers className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="min-w-0 flex-1">Evaluar todos los tableros</span>
              {scope === 'all' ? <Check className="h-4 w-4 shrink-0 text-violet-600" aria-hidden /> : null}
            </button>
            <hr className="my-1 border-0 border-t border-slate-200/80 dark:border-slate-700/80" />
            {profiles.map((p) => {
              const active = scope === 'single' && p.id === selectedProfileId
              return (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--app-hover)] ${
                    active
                      ? 'bg-violet-50/80 font-semibold text-violet-900 dark:bg-violet-950/30 dark:text-violet-100'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                  onClick={() => {
                    onSelectProfile(p.id)
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-violet-600" aria-hidden /> : null}
                </button>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        ref={rootRef}
        className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--app-muted-foreground)]"
      >
        <span>Informe de</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{reportLabel}</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-semibold text-violet-600 underline decoration-violet-400/50 underline-offset-2 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
        >
          cambiar
        </button>
      </div>
      {menu}
    </>
  )
}
