'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Info } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'

export default function RegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    /** Género de comunicación del usuario del tablero (voces TTS, predicciones, etc.) */
    const [communicationGender, setCommunicationGender] = useState<'male' | 'female'>('male')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const normalizedEmail = email.trim().toLowerCase()
            const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: normalizedEmail,
                    password,
                    communicationGender,
                }),
            })

            const raw = await res.text()
            let data: { error?: string } = {}
            try {
                data = raw ? (JSON.parse(raw) as { error?: string }) : {}
            } catch {
                const trimmed = raw.trimStart()
                const looksLikeHtml = trimmed.startsWith('<!') || trimmed.toLowerCase().startsWith('<html')
                setError(
                    res.ok
                        ? 'Respuesta del servidor no válida. Inténtalo de nuevo.'
                        : looksLikeHtml
                          ? `Error del servidor (${res.status}). La respuesta no es JSON (p. ej. página de error). Revisa los logs del despliegue y que la base de datos tenga las migraciones aplicadas (prisma migrate deploy).`
                          : `Error del servidor (${res.status}). Si persiste, prueba más tarde.`,
                )
                return
            }

            if (!res.ok) {
                setError(data.error || 'Ocurrió un error al registrarse')
                return
            }

            try {
                const signInRes = await signIn('credentials', {
                    email: normalizedEmail,
                    password,
                    redirect: false,
                    callbackUrl,
                })

                if (signInRes?.error) {
                    setError('Cuenta creada, pero hubo un error al iniciar sesión automáticamente.')
                } else {
                    router.replace(callbackUrl)
                    router.refresh()
                }
            } catch {
                setError('Cuenta creada, pero no se pudo iniciar sesión automáticamente. Entra desde Iniciar sesión.')
            }
        } catch {
            setError('No se pudo conectar. Comprueba la red e inténtalo de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="theme-auth-shell flex min-h-screen items-center justify-center bg-[url('/bg-pattern.svg')] bg-cover bg-center py-12">
            <div className="w-full max-w-md p-6">
                <div className="glass-panel overflow-hidden rounded-3xl p-8 shadow-xl">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-10 w-full flex justify-center">
                            <BrandLockup
                                href="/"
                                iconSize={40}
                                wordmarkWidth={148}
                                priority
                                iconClassName="rounded-none shadow-none"
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Crear cuenta</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Únete a Luma Grid y personaliza tu tablero</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="app-input w-full rounded-xl px-4 py-3 text-sm hover:bg-white focus:bg-white dark:hover:bg-slate-900 dark:focus:bg-slate-900"
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="app-input w-full rounded-xl px-4 py-3 text-sm hover:bg-white focus:bg-white dark:hover:bg-slate-900 dark:focus:bg-slate-900"
                                placeholder="hola@lumagrid.app"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="app-input w-full rounded-xl px-4 py-3 text-sm hover:bg-white focus:bg-white dark:hover:bg-slate-900 dark:focus:bg-slate-900"
                                placeholder="••••••••"
                            />
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                ¿La persona que usará el tablero debe tratarse en masculino o en femenino?
                            </legend>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Se usa para la voz de apoyo, sugerencias y coherencia gramatical en el comunicador.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCommunicationGender('male')}
                                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                                        communicationGender === 'male'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-100'
                                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200'
                                    }`}
                                >
                                    Masculino
                                    <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">él, su…</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommunicationGender('female')}
                                    className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                                        communicationGender === 'female'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-100'
                                            : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200'
                                    }`}
                                >
                                    Femenino
                                    <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">ella, su…</span>
                                </button>
                            </div>
                        </fieldset>

                        <div className="flex gap-3 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-4 text-xs text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
                            <Info className="shrink-0 mt-0.5" size={16} />
                            <p>Al crear tu cuenta se generará automáticamente tu primer tablero &quot;DEMO&quot; con el vocabulario base predeterminado.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Registrarse'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
                        ¿Ya tienes cuenta?{' '}
                        <Link
                            href={`/login${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(getSafeCallbackUrl(searchParams.get('callbackUrl')))}`
                                : ''}`}
                            className="font-semibold text-indigo-600 transition hover:text-indigo-500"
                        >
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
