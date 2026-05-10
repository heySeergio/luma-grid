'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Info, Loader2 } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons'

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams.get('callbackUrl')),
    [searchParams],
  )

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cbQuery = searchParams.get('callbackUrl')
    ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!acceptedLegal) {
      setError('Debes aceptar los términos legales para crear la cuenta.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          acceptTerms: true,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'No se pudo registrar.')
        setBusy(false)
        return
      }
      router.push(`/login${cbQuery ? `${cbQuery}&` : '?'}registered=1`)
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)] sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl lg:max-w-[44rem]">
        <div className="app-panel overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8 md:p-10">
          <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
            <div className="mb-8 flex w-full justify-center sm:mb-10">
              <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="rounded-none shadow-none" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-forest dark:text-slate-100">Crear cuenta</h1>
            <p className="mt-2 text-sm text-[var(--app-muted-foreground)]">
              Regístrate con correo y contraseña o con Google
            </p>
          </div>

          <div className="flex gap-3 rounded-xl border border-accent-blue/20 bg-accent-blue/[0.07] p-4 text-left text-xs leading-relaxed text-forest dark:border-accent-blue/25 dark:bg-accent-blue/10 dark:text-slate-200 sm:p-5 sm:text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue sm:h-[1.125rem] sm:w-[1.125rem]" />
            <p className="min-w-0 flex-1">
              Al registrarte se crea el tablero BASE con el vocabulario inicial. Podrás ajustar género de comunicación y voz en el panel de
              administración.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-5">
            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="reg-name" className="text-sm font-medium text-[var(--app-foreground)]">
                  Nombre (opcional)
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="reg-email" className="text-sm font-medium text-[var(--app-foreground)]">
                  Correo electrónico
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="reg-password" className="text-sm font-medium text-[var(--app-foreground)]">
                  Contraseña
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="reg-confirm" className="text-sm font-medium text-[var(--app-foreground)]">
                  Confirmar contraseña
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
              <label className="flex cursor-pointer gap-3 text-left text-sm leading-snug text-[var(--app-foreground)]">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--app-input-border)] text-accent-blue focus:ring-accent-blue dark:bg-slate-900"
                  required
                />
                <span>
                  He leído y acepto los{' '}
                  <Link href="/terminos" className="font-bold text-accent-blue underline-offset-2 hover:text-coral hover:underline">
                    Términos y Condiciones
                  </Link>
                  , la{' '}
                  <Link href="/privacidad" className="font-bold text-accent-blue underline-offset-2 hover:text-coral hover:underline">
                    Política de privacidad
                  </Link>{' '}
                  y la{' '}
                  <Link href="/cookies" className="font-bold text-accent-blue underline-offset-2 hover:text-coral hover:underline">
                    Política de cookies
                  </Link>
                  . Es obligatorio para crear la cuenta.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={busy || !acceptedLegal}
              className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Crear cuenta
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-[var(--app-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted-foreground)]">
                O regístrate con
              </span>
            </div>
          </div>

          <OAuthSignInButtons
            callbackUrl={callbackUrl}
            googleLabel="Registrarse con Google"
            disabled={!acceptedLegal}
          />

          <p className="mt-8 text-center text-sm text-[var(--app-muted-foreground)]">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/login${cbQuery}`} className="font-bold text-accent-blue underline-offset-4 transition hover:text-coral hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
