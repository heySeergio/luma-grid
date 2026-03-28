'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import BrandLockup from '@/components/site/BrandLockup'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
            const res = await signIn('credentials', {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
                callbackUrl,
            })

            if (res?.error) {
                if (res.error === 'CredentialsSignin') {
                    setError('El correo electrónico o la contraseña son incorrectos.')
                } else {
                    setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
                }
            } else {
                router.replace(callbackUrl)
                router.refresh()
            }
        } catch {
            setError('Ocurrió un error inesperado al iniciar sesión.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="theme-auth-shell flex min-h-screen items-center justify-center bg-[url('/bg-pattern.svg')] bg-cover bg-center">
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
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bienvenido de nuevo</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Inicia sesión en Luma Grid</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
                                {error}
                            </div>
                        )}

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

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">
                        ¿No tienes cuenta?{' '}
                        <Link
                            href={`/register${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(getSafeCallbackUrl(searchParams.get('callbackUrl')))}`
                                : ''}`}
                            className="font-semibold text-indigo-600 transition hover:text-indigo-500"
                        >
                            Regístrate gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
