'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import BrandLockup from '@/components/site/BrandLockup'

export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'No se pudo restablecer')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8 text-center text-sm text-rose-600">
        Enlace inválido. Solicita uno nuevo desde{' '}
        <Link href="/forgot-password" className="ml-1 underline">
          recuperar contraseña
        </Link>
        .
      </div>
    )
  }

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)]">
      <div className="w-full max-w-md">
        <div className="app-panel rounded-3xl p-8 shadow-xl">
          <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="mx-auto rounded-none shadow-none" />
          <h1 className="mt-8 text-center text-2xl font-extrabold text-forest dark:text-slate-100">Nueva contraseña</h1>
          {done ? (
            <p className="mt-4 text-center text-sm">
              Contraseña actualizada.{' '}
              <Link href="/login" className="font-bold text-accent-blue hover:underline">
                Iniciar sesión
              </Link>
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="Nueva contraseña"
              />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="Confirmar contraseña"
              />
              <button
                type="submit"
                disabled={busy}
                className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
