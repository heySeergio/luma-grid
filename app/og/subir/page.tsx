import type { Metadata } from 'next'
import Link from 'next/link'
import { OgImageUploadForm } from '@/components/seo/OgImageUploadForm'
import BrandLockup from '@/components/site/BrandLockup'
import SiteFooter from '@/components/site/SiteFooter'

export const metadata: Metadata = {
  title: 'Imagen social (OG / Twitter)',
  description: 'Sube la imagen 1200×630 (aprox.) para vista previa en redes y buscadores.',
  robots: { index: false, follow: false },
}

export default function OgImageUploadPage() {
  const needsSecret = Boolean(process.env.OG_UPLOAD_SECRET)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-lg px-6 py-10 md:py-14">
        <BrandLockup href="/" iconSize={36} wordmarkWidth={132} priority />
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Imagen Open Graph / Twitter Card
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Recomendado: <strong className="font-semibold text-slate-800 dark:text-slate-200">1200 × 630 px</strong>, PNG o JPG
          (máx. 2 MB). Se usa en la portada y al compartir el enlace.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          URL pública:{' '}
          <Link href="/og/social" className="font-mono text-indigo-600 underline dark:text-indigo-400">
            /og/social
          </Link>{' '}
          (también detecta <code className="rounded bg-slate-200/80 px-1 dark:bg-slate-800">public/og.jpg</code> en la raíz).
        </p>

        {!needsSecret ? (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            Define <code className="rounded bg-black/10 px-1 dark:bg-white/10">OG_UPLOAD_SECRET</code> en el servidor para
            habilitar la subida. En local, añádelo a <code className="rounded bg-black/10 px-1">.env.local</code>.
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <OgImageUploadForm disabled={!needsSecret} />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
          Producción con Vercel: configura Supabase Storage (bucket público de lectura) o incluye{' '}
          <code className="rounded bg-slate-200/80 px-1 dark:bg-slate-800">public/og.jpg</code> o{' '}
          <code className="rounded bg-slate-200/80 px-1 dark:bg-slate-800">public/og/og.png</code> en el deploy. Opcional:{' '}
          <code className="rounded bg-slate-200/80 px-1 dark:bg-slate-800">NEXT_PUBLIC_OG_IMAGE_URL</code> apuntando a la URL
          final (p. ej. CDN o Supabase).
        </p>

        <p className="mt-4">
          <Link href="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            ← Volver al inicio
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  )
}
