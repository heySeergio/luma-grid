'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Info, Loader2 } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons'

export default function RegisterPage() {
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
    <div className="theme-auth-shell flex min-h-screen items-center justify-center bg-[url('/bg-pattern.svg')] bg-cover bg-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl lg:max-w-[44rem]">
        <div className="glass-panel overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8 md:p-10">
          <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
            <div className="mb-8 flex w-full justify-center sm:mb-10">
              <BrandLockup
                href="/"
                iconSize={40}
                wordmarkWidth={148}
                priority
                iconClassName="rounded-none shadow-none"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Crear cuenta</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Regístrate con correo y contraseña o con Google
            </p>
          </div>

          <div className="flex gap-3 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-4 text-left text-xs leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200 sm:p-5 sm:text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" />
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
                <label htmlFor="reg-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                <label htmlFor="reg-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                <label htmlFor="reg-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                <label htmlFor="reg-confirm" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-600/50 dark:bg-slate-800/40">
              <label className="flex cursor-pointer gap-3 text-left text-sm leading-snug text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-900"
                  required
                />
                <span>
                  He leído y acepto los{' '}
                  <Link href="/terminos" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
                    Términos y Condiciones
                  </Link>
                  , la{' '}
                  <Link href="/privacidad" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
                    Política de privacidad
                  </Link>{' '}
                  y la{' '}
                  <Link href="/cookies" className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
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
              <div className="w-full border-t border-slate-200 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                O regístrate con
              </span>
            </div>
          </div>

          <OAuthSignInButtons
            callbackUrl={callbackUrl}
            googleLabel="Registrarse con Google"
            disabled={!acceptedLegal}
          />

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/login${cbQuery}`} className="font-semibold text-indigo-600 transition hover:text-indigo-500">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
