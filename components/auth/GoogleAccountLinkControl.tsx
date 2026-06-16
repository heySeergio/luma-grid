'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Check, Loader2 } from 'lucide-react'
import { unlinkGoogleAccountAction } from '@/app/actions/account'
import { ADMIN_PATHS } from '@/lib/admin/adminNav'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

const linkBtnClass =
  'flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm font-bold text-[var(--app-foreground)] shadow-sm transition hover:bg-[var(--app-surface-muted)] disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto'

type Props = {
  linkedProviders?: string[]
  onAccountRefresh?: () => void
  disabled?: boolean
}

export default function GoogleAccountLinkControl({
  linkedProviders,
  onAccountRefresh,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasGoogle = linkedProviders?.includes('google') ?? false

  async function handleLink() {
    setLoading(true)
    setError('')
    try {
      await signIn('google', { callbackUrl: ADMIN_PATHS.account })
    } catch {
      setError('No se pudo vincular. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  async function handleUnlink() {
    setLoading(true)
    setError('')
    try {
      await unlinkGoogleAccountAction()
      onAccountRefresh?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo desvincular Google.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasGoogle) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={loading || disabled}
          className={linkBtnClass}
          onClick={() => void handleLink()}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
          Vincular cuenta de Google
        </button>
        {error ? <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="group relative inline-flex w-full sm:w-auto">
        <div
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition group-hover:invisible dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 sm:w-auto"
          aria-hidden
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Cuenta de google vinculada
        </div>
        <button
          type="button"
          disabled={loading || disabled}
          onClick={() => void handleUnlink()}
          className="absolute inset-0 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 disabled:opacity-50 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Desvincular
        </button>
      </div>
      {error ? <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  )
}
