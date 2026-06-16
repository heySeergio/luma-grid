'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import BrandLockup from '@/components/site/BrandLockup'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'No se pudo enviar el correo')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)]">
      <div className="w-full max-w-md">
        <div className="app-panel rounded-3xl p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="rounded-none shadow-none" />
            <h1 className="mt-8 text-2xl font-extrabold text-forest dark:text-slate-100">Recuperar contraseña</h1>
          </div>
          {sent ? (
            <p className="text-center text-sm text-[var(--app-muted-foreground)]">
              Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="tu@email.com"
              />
              <button
                type="submit"
                disabled={busy}
                className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar enlace
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-accent-blue hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
