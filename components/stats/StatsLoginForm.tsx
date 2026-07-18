'use client'

import { useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSafeCallbackUrl, resolveClientSignInRedirect } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons'

export function StatsLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get('callbackUrl')
    const safe = getSafeCallbackUrl(raw, '/stats')
    if (safe.startsWith('http')) return safe
    if (safe.startsWith('/stats') || safe === '/') return safe
    return '/stats'
  }, [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      })
      if (res?.error) {
        setError('Correo o contraseña incorrectos.')
        return
      }
      router.push(resolveClientSignInRedirect(res?.url, callbackUrl))
      router.refresh()
    } catch {
      setError('No se pudo completar el inicio de sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="font-bricolage flex min-h-dvh items-center justify-center bg-[#F5F0E8] px-4 py-12 text-[#042D22] antialiased">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
        <div className="mb-8 flex justify-center">
          <BrandLockup
            iconSize={40}
            priority
            iconClassName="rounded-none shadow-none"
            subtitle="STATS"
          />
        </div>
        <h1 className="text-center text-2xl font-extrabold tracking-tight">Acceso restringido</h1>
        <p className="mt-2 text-center text-sm text-[#042D22]/60">
          Solo la cuenta autorizada puede ver estadísticas de Luma Grid.
        </p>

        <div className="mt-8">
          <OAuthSignInButtons callbackUrl={callbackUrl} googleLabel="Continuar con Google" />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#042D22]/40">
          <span className="h-px flex-1 bg-black/10" />
          o correo
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Correo</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none ring-[#042D22]/20 focus:ring-2"
            />
          </label>
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
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#042D22] py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? 'Entrando…' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
