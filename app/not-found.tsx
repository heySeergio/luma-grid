import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import BrandLockup from '@/components/site/BrandLockup'

export default function NotFound() {
  return (
    <main className="luma-marketing-site tk-bricolage-grotesque-36 relative flex min-h-screen items-center overflow-hidden bg-canvas px-4 py-12 font-bricolage text-forest antialiased sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-20 top-20 h-48 w-48 rounded-full bg-[#FFB3C8]/60 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-56 w-56 rounded-full bg-cta-yellow/70 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-5rem] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-blue/20 blur-3xl" aria-hidden />

      <section className="relative z-10 mx-auto w-full max-w-5xl rounded-[2rem] border border-black/[0.06] bg-white/78 p-6 shadow-[0_22px_70px_rgba(28,43,36,0.12)] backdrop-blur sm:p-10">
        <div className="flex justify-center sm:justify-start">
          <BrandLockup href="/#inicio" variant="marketing" priority />
        </div>

        <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1fr_0.82fr]">
          <div className="text-center sm:text-left">
            <p className="inline-flex rounded-full bg-cta-yellow px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.18em] text-forest">
              Error 404
            </p>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-[0.92] tracking-[-0.05em] text-forest sm:text-7xl">
              Esta casilla no existe.
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-forest/70 sm:text-lg">
              La ruta que buscas se ha movido o ya no está disponible. Vuelve al inicio para encontrar el camino correcto.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FE6B45] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
              >
                <Compass size={18} aria-hidden />
                Ir al inicio
              </Link>
              <Link
                href="/tablero"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-forest shadow-sm transition hover:bg-neutral-50"
              >
                <ArrowLeft size={18} aria-hidden />
                Volver al tablero
              </Link>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3 rounded-[1.75rem] bg-[#FDF8EE] p-4 shadow-inner">
            {['404', 'AAC', 'voz', 'IA'].map((label, index) => (
              <span
                key={label}
                className={[
                  'flex aspect-square items-center justify-center rounded-3xl text-3xl font-extrabold shadow-[0_10px_30px_rgba(28,43,36,0.08)]',
                  index === 0 ? 'bg-[#FE6B45] text-white' : '',
                  index === 1 ? 'bg-[#3A7CEC] text-white' : '',
                  index === 2 ? 'bg-[#FFDB3D] text-forest' : '',
                  index === 3 ? 'bg-[#35AA63] text-white' : '',
                ].join(' ')}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
