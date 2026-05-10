'use client'

import { useEffect } from 'react'
import { Home, RefreshCcw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import BrandLockup from '@/components/site/BrandLockup'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Error reportado por el boundary:', error)
    }, [error])

    return (
        <main className="luma-marketing-site tk-bricolage-grotesque-36 relative flex min-h-screen items-center overflow-hidden bg-canvas px-4 py-12 font-bricolage text-forest antialiased sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-[#FFB3C8]/60 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-64 w-64 rounded-full bg-cta-yellow/70 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute left-1/2 top-1/4 h-56 w-56 -translate-x-1/2 rounded-full bg-accent-blue/15 blur-3xl" aria-hidden />

            <section className="relative z-10 mx-auto w-full max-w-4xl rounded-[2rem] border border-black/[0.06] bg-white/78 p-6 text-center shadow-[0_22px_70px_rgba(28,43,36,0.12)] backdrop-blur sm:p-10">
                <div className="flex justify-center">
                    <BrandLockup href="/#inicio" variant="marketing" priority />
                </div>

                <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#FE6B45] text-white shadow-[0_16px_35px_rgba(254,107,69,0.28)]">
                    <Sparkles size={34} aria-hidden />
                </div>

                <p className="mt-8 inline-flex rounded-full bg-cta-yellow px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.18em] text-forest">
                    Error inesperado
                </p>
                <h1 className="mx-auto mt-5 max-w-2xl text-balance text-4xl font-extrabold leading-[0.95] tracking-[-0.045em] text-forest sm:text-6xl">
                    Se nos ha movido una pieza del tablero.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-forest/70 sm:text-lg">
                    Puedes reintentar la carga o volver al inicio. El detalle técnico queda registrado para poder revisarlo.
                </p>

                {(error.message || error.digest) ? (
                    <div className="mx-auto mt-7 max-w-2xl overflow-auto rounded-3xl border border-black/10 bg-[#FDF8EE] p-4 text-left shadow-inner">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-coral">
                            Detalle técnico
                        </p>
                        <code className="mt-2 block whitespace-pre-wrap font-mono text-xs leading-relaxed text-forest/70">
                            {error.message || 'Error desconocido'}
                            {error.digest ? <span className="mt-2 block text-forest/45">Digest: {error.digest}</span> : null}
                        </code>
                    </div>
                ) : null}

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FE6B45] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                    >
                        <RefreshCcw size={18} aria-hidden />
                        Reintentar
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-forest shadow-sm transition hover:bg-neutral-50"
                    >
                        <Home size={18} aria-hidden />
                        Volver al inicio
                    </Link>
                </div>
            </section>
        </main>
    )
}
