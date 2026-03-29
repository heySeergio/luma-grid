import Link from 'next/link'
import { Compass } from 'lucide-react'
import BrandLockup from '@/components/site/BrandLockup'

export default function NotFound() {
  return (
    <div className="theme-auth-shell flex min-h-screen items-center justify-center bg-[url('/bg-pattern.svg')] bg-cover bg-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="glass-panel overflow-hidden rounded-3xl p-8 shadow-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-8 flex w-full justify-center">
              <BrandLockup
                href="/"
                iconSize={40}
                wordmarkWidth={148}
                priority
                iconClassName="rounded-none shadow-none"
              />
            </div>
            <p className="font-mono text-6xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 sm:text-7xl">
              404
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Página no encontrada
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              La ruta que buscas no existe o ha cambiado. Vuelve al inicio o entra al panel de administración.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="ui-primary-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              <Compass size={18} aria-hidden />
              Ir al inicio
            </Link>
            <Link
              href="/admin"
              className="ui-secondary-button inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition dark:border-white/20 dark:text-slate-100"
            >
              Panel admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
