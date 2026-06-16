'use client'

import { useCallback, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fingerprint, Loader2 } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'
import { getSafeCallbackUrl, resolveClientSignInRedirect } from '@/lib/auth-redirect'

type Props = {
  email?: string
  callbackUrl: string
  className?: string
}

export function PasskeySignInButton({ email, callbackUrl, className }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handlePasskey = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const optsRes = await fetch('/api/auth/passkey/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email?.trim() || undefined }),
      })
      const optsData = (await optsRes.json()) as {
        options?: PublicKeyCredentialRequestOptionsJSON
        challengeToken?: string
        error?: string
      }
      if (!optsRes.ok || !optsData.options || !optsData.challengeToken) {
        throw new Error(optsData.error || 'No se pudo iniciar passkey')
      }

      const assertion = await startAuthentication({ optionsJSON: optsData.options })
      const verifyRes = await fetch('/api/auth/passkey/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: optsData.challengeToken,
          response: assertion,
        }),
      })
      const verifyData = (await verifyRes.json()) as {
        requires2fa?: boolean
        completionToken?: string
        provider?: string
        error?: string
      }
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Passkey rechazada')

      if (verifyData.requires2fa) {
        router.push(`/login/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }

      const provider = verifyData.provider === 'passkey' ? 'passkey' : 'credentials-mfa'
      const res = await signIn(provider, {
        completionToken: verifyData.completionToken,
        redirect: false,
        callbackUrl,
      })
      if (res?.error) throw new Error('No se pudo completar el inicio de sesión')
      router.push(resolveClientSignInRedirect(res?.url, callbackUrl))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error con passkey')
    } finally {
      setBusy(false)
    }
  }, [callbackUrl, email, router])

  return (
    <div className={className}>
      {error ? (
        <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handlePasskey()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm font-bold text-[var(--app-foreground)] shadow-sm transition hover:bg-[var(--app-surface-muted)] disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
        Entrar con passkey
      </button>
    </div>
  )
}

export function useLoginHints(email: string) {
  const [hints, setHints] = useState({ hasCredentials: true, hasGoogle: true, hasPasskey: true })

  useEffect(() => {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return
    const t = setTimeout(() => {
      void fetch('/api/auth/login-hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data === 'object') setHints(data as typeof hints)
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [email])

  return hints
}
