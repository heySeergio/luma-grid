'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'

export default function TwoFactorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))

  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, useBackup }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        mode?: string
        completionToken?: string
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Código incorrecto')

      if (data.mode === 'session_update') {
        await update({ mfaVerified: true })
        router.push(callbackUrl)
        router.refresh()
        return
      }

      if (data.completionToken) {
        const signInRes = await signIn('credentials-mfa', {
          completionToken: data.completionToken,
          redirect: false,
          callbackUrl,
        })
        if (signInRes?.error) throw new Error('No se pudo completar el inicio de sesión')
        router.push(signInRes?.url ?? callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)]">
      <div className="w-full max-w-md">
        <div className="app-panel overflow-hidden rounded-3xl p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="rounded-none shadow-none" />
            <h1 className="mt-8 text-2xl font-extrabold text-forest dark:text-slate-100">Verificación en dos pasos</h1>
            <p className="mt-2 text-sm text-[var(--app-muted-foreground)]">
              {useBackup ? 'Introduce un código de respaldo' : 'Introduce el código de tu app autenticadora'}
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                {error}
              </p>
            ) : null}
            <input
              type="text"
              inputMode={useBackup ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="app-input w-full rounded-xl px-4 py-2.5 text-center text-lg tracking-widest"
              placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
            />
            <button
              type="submit"
              disabled={busy}
              className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verificar
            </button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-accent-blue hover:underline"
            onClick={() => setUseBackup((v) => !v)}
          >
            {useBackup ? 'Usar app autenticadora' : 'Usar código de respaldo'}
          </button>

          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-[var(--app-muted-foreground)] hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
