'use client'

import { useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get('callbackUrl')),
    [searchParams],
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const registered = searchParams.get('registered') === '1'

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    })
    setBusy(false)
    if (res?.error) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    router.push(res?.url ?? callbackUrl)
    router.refresh()
  }

  const cbQuery = searchParams.get('callbackUrl')
    ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : ''

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)]">
      <div className="w-full max-w-md">
        <div className="app-panel overflow-hidden rounded-3xl p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-10 flex w-full justify-center">
              <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="rounded-none shadow-none" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-forest dark:text-slate-100">Bienvenido</h1>
            <p className="mt-2 text-sm text-[var(--app-muted-foreground)]">
              Entra con tu correo o con Google
            </p>
          </div>

          {registered ? (
            <p className="mb-4 rounded-xl border border-emerald-200/70 bg-emerald-50/90 px-3 py-2 text-center text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
              Cuenta creada. Inicia sesión con tu correo y contraseña.
            </p>
          ) : null}

          <form onSubmit={(e) => void handleCredentialsSubmit(e)} className="space-y-4">
            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                {error}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-[var(--app-foreground)]">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-[var(--app-foreground)]">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Iniciar sesión
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-[var(--app-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted-foreground)]">
                O continúa con
              </span>
            </div>
          </div>

          <OAuthSignInButtons callbackUrl={callbackUrl} googleLabel="Continuar con Google" />

          <p className="mt-8 text-center text-sm text-[var(--app-muted-foreground)]">
            ¿Primera vez?{' '}
            <Link
              href={`/register${cbQuery}`}
              className="font-bold text-accent-blue underline-offset-4 transition hover:text-coral hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
