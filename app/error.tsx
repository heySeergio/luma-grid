'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

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
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="rounded-full bg-red-100 p-4 mb-4 text-red-600">
                <AlertCircle size={48} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800">¡Ups! Algo salió mal</h2>
            <p className="mb-6 max-w-md text-slate-600">
                Ha ocurrido un error inesperado en la aplicación. No te preocupes, puedes intentar recargar la página o volver al inicio.
            </p>

            {/* Caja de detalle técnico del error para visibilidad (solo en dev/beta, pero dejar visible según solicitud) */}
            <div className="mb-8 w-full max-w-2xl rounded-xl bg-slate-900 p-4 text-left shadow-inner overflow-auto max-h-48 border border-red-500/30">
                <p className="font-mono text-sm text-red-400 mb-2 font-semibold">Detalle del error técnico:</p>
                <code className="text-xs text-slate-300 block whitespace-pre-wrap font-mono">
                    {error.message || 'Error desconocido'}
                    {error.digest && <span className="block mt-2 text-slate-500">Digest: {error.digest}</span>}
                </code>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                    <RefreshCcw size={18} /> Reintentar
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}
