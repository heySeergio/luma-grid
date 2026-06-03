'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCcw } from 'lucide-react'

export default function IntranetPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[intranet]', error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">No se pudo cargar el panel</h1>
        <p className="mt-2 text-sm text-[#042D22]/65">
          En producción Next.js oculta el detalle del fallo. Revisa los logs del servidor en Vercel
          buscando el digest de abajo.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Comprueba en este orden:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Que <code className="text-xs">DATABASE_URL</code> en Vercel apunte a Neon y las
            migraciones estén aplicadas (<code className="text-xs">npm run migrate:deploy</code>).
          </li>
          <li>
            Variables de intranet: <code className="text-xs">INTRANET_PASSWORD</code>,{' '}
            <code className="text-xs">INTRANET_SESSION_SECRET</code> (o{' '}
            <code className="text-xs">NEXTAUTH_SECRET</code>),{' '}
            <code className="text-xs">INTRANET_OWNER_EMAIL</code>.
          </li>
          <li>
            Si falla solo Ingresos o Analytics, puede ser Stripe o tablas de analytics aún sin
            migrar.
          </li>
        </ol>
      </div>

      {(error.message || error.digest) ? (
        <div className="overflow-auto rounded-2xl border border-black/10 bg-white p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FE6B45]">
            Detalle técnico
          </p>
          <code className="mt-2 block whitespace-pre-wrap font-mono text-xs text-[#042D22]/70">
            {error.message || 'Error desconocido en Server Components'}
            {error.digest ? (
              <span className="mt-2 block text-[#042D22]/45">Digest: {error.digest}</span>
            ) : null}
          </code>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#042D22] px-4 py-2.5 text-sm font-bold text-white"
        >
          <RefreshCcw size={16} aria-hidden />
          Reintentar
        </button>
        <Link
          href="/intranet/login"
          className="inline-flex items-center rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-[#042D22]"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
