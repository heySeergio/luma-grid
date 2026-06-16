'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import BrandLockup from '@/components/site/BrandLockup'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    void fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => setStatus(r.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="luma-product-shell font-bricolage flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 antialiased dark:bg-[var(--app-bg-soft)]">
      <div className="w-full max-w-md text-center">
        <div className="app-panel rounded-3xl p-8 shadow-xl">
          <BrandLockup href="/" variant="marketing" iconSize={40} priority iconClassName="mx-auto rounded-none shadow-none" />
          {status === 'loading' ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
            </div>
          ) : status === 'ok' ? (
            <p className="mt-8 text-sm text-emerald-700 dark:text-emerald-300">
              Correo verificado correctamente.{' '}
              <Link href="/login" className="font-bold underline">
                Inicia sesión
              </Link>
            </p>
          ) : (
            <p className="mt-8 text-sm text-rose-600">
              Enlace inválido o caducado. Inicia sesión y solicita un nuevo correo de verificación.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
