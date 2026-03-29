'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, House } from 'lucide-react'

/**
 * Demo visual en bucle: cursor pulsando el icono de casa 5 veces y mostrando acceso a /admin.
 * Réplica simplificada de la barra del tablero (/tablero).
 */
export default function AdminAccessBoardDemo() {
  const [phase, setPhase] = useState<'out' | 'toHome' | 'tap' | 'done'>('out')
  const [tapCount, setTapCount] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const tapRef = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const clearAll = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }

    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(
        setTimeout(() => {
          if (alive.current) fn()
        }, ms),
      )
    }

    const runTap = () => {
      if (!alive.current) return
      setPhase('toHome')
      schedule(() => {
        setPhase('tap')
        schedule(() => {
          tapRef.current += 1
          const n = tapRef.current
          setTapCount(n)
          if (n >= 5) {
            setPhase('done')
            tapRef.current = 0
            schedule(() => {
              setTapCount(0)
              setPhase('out')
              schedule(runTap, 550)
            }, 2200)
            return
          }
          setPhase('out')
          schedule(runTap, 480)
        }, 200)
      }, 420)
    }

    schedule(runTap, 500)

    return () => {
      alive.current = false
      clearAll()
    }
  }, [])

  const showRipple = phase === 'tap'
  const highlightAdmin = phase === 'done'
  const cursorOnHome = phase === 'toHome' || phase === 'tap'

  return (
    <div
      className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-inner dark:border-slate-600 dark:bg-slate-900/80"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-white/90 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/90">
        <div className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
          …/tablero
        </div>
      </div>
      <div className="relative px-2 py-3">
        <div className="ui-toolbar-shell flex items-center gap-2 rounded-2xl px-2 py-2">
          <div className="ui-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-xl opacity-50">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <div className="relative">
            <div
              className={`ui-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-[box-shadow,transform] ${
                showRipple ? 'scale-95 shadow-[0_0_0_3px_rgba(99,102,241,0.45)]' : ''
              } ${highlightAdmin ? 'ring-2 ring-emerald-400/80' : ''}`}
            >
              <House className="h-5 w-5" />
            </div>
            {tapCount > 0 && phase !== 'done' ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow">
                {tapCount}/5
              </span>
            ) : null}
          </div>
          <div className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-[var(--phrase-inner)] px-2 py-1.5 text-[10px] text-slate-300">
            …
          </div>
        </div>

        <div
          className={`pointer-events-none absolute transition-all duration-300 ease-out ${
            cursorOnHome ? 'opacity-100' : 'opacity-80'
          }`}
          style={{
            left: cursorOnHome ? 'calc(2rem + 36px)' : '10px',
            top: cursorOnHome ? 'calc(50% - 6px)' : '72%',
            transform: 'translate(-4px, -4px)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
            <path
              d="M5 3l14 10-6 1.5L10 21l-1-7.5L5 3z"
              fill="white"
              stroke="#1e293b"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {highlightAdmin ? (
          <div className="pointer-events-none absolute bottom-1 right-2 flex flex-col items-end gap-0.5">
            <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              Abrir administración
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-emerald-300 dark:bg-slate-950">
              /admin
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
