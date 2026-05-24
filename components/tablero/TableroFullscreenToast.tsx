'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'luma-tablero-fullscreen-toast-dismissed-v1'

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(
    document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement,
  )
}

function supportsFullscreen(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.documentElement
  return Boolean(
    el.requestFullscreen ??
      (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen,
  )
}

async function requestAppFullscreen(): Promise<boolean> {
  const el = document.documentElement
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen()
      return true
    }
    const webkit = (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen
    if (webkit) {
      webkit.call(el)
      return true
    }
  } catch {
    return false
  }
  return false
}

export default function TableroFullscreenToast() {
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    persistDismissed()
    setVisible(false)
  }, [])

  const syncVisibility = useCallback(() => {
    if (readDismissed() || isStandaloneDisplay() || isFullscreenActive() || !supportsFullscreen()) {
      setVisible(false)
      return
    }
    setVisible(true)
  }, [])

  useEffect(() => {
    syncVisibility()

    const onFullscreenChange = () => {
      if (isFullscreenActive()) {
        dismiss()
        return
      }
      syncVisibility()
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [dismiss, syncVisibility])

  const onActivate = useCallback(async () => {
    const ok = await requestAppFullscreen()
    if (ok || isFullscreenActive()) dismiss()
  }, [dismiss])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="presentation"
    >
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border px-4 py-3 shadow-[var(--floating-shadow)]"
        style={{
          background: 'var(--panel-blue)',
          borderColor: 'color-mix(in srgb, var(--panel-blue-soft) 55%, white 12%)',
          color: '#fffaf2',
        }}
      >
        <button
          type="button"
          onClick={onActivate}
          className="min-w-0 flex-1 text-left text-sm font-medium leading-snug transition-opacity hover:opacity-90 sm:text-[0.9375rem]"
        >
          Pulsa aquí para usar el tablero a pantalla completa
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-[#fffaf2]/90 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar aviso de pantalla completa"
        >
          <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  )
}
