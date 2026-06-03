'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import BrandLockup from '@/components/site/BrandLockup'

export function IntranetLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/intranet'

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/intranet/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'No se pudo entrar')
        return
      }
      router.replace(callbackUrl.startsWith('/intranet') ? callbackUrl : '/intranet')
      router.refresh()
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="luma-product-shell font-bricolage flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4 py-12 text-[#042D22] antialiased">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
        <div className="mb-8 flex justify-center">
          <BrandLockup
            iconSize={40}
            priority
            iconClassName="rounded-none shadow-none"
            subtitle="INTRANET"
            subtitleClassName="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#042D22]/45"
          />
        </div>
        <h1 className="text-center text-2xl font-extrabold tracking-tight">Acceso restringido</h1>
        <p className="mt-2 text-center text-sm text-[#042D22]/60">
          Introduce la contraseña del panel o entra con la cuenta owner en{' '}
          <a href="/login?callbackUrl=/intranet" className="font-semibold underline">
            inicio de sesión
          </a>
          .
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none ring-[#042D22]/20 focus:ring-2"
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#042D22] py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
