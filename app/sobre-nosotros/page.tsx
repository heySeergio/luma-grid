import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Handshake, Volume2, Wrench, type LucideIcon } from 'lucide-react'

import { MarketingFooter } from '@/components/landing/MarketingFooter'
import { FeedbackOpinionCta } from '@/components/sobre-nosotros/FeedbackOpinionCta'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { CONTACT_EMAIL } from '@/lib/site/contact'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

const PAGE_DESCRIPTION =
  'Luma Grid: comunicación AAC desarrollada por Sergio T. Los derechos de la herramienta están delegados a Casa Numa.'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/sobre-nosotros' },
  openGraph: {
    title: 'Sobre nosotros · Luma Grid',
    description: PAGE_DESCRIPTION,
    url: '/sobre-nosotros',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Luma Grid',
  },
  twitter: {
    card: 'summary',
    title: 'Sobre nosotros · Luma Grid',
    description: PAGE_DESCRIPTION,
  },
}

const valores: readonly {
  title: string
  body: string
  iconWrapClass: string
  Icon: LucideIcon
}[] = [
  {
    title: 'Voz propia, no voz genérica',
    iconWrapClass: 'bg-[#FFB3C8]',
    Icon: Volume2,
    body: `Nada de robots intercambiables. Luma Grid adapta
la experiencia a cada persona: su ritmo, su estilo y su identidad.`,
  },
  {
    title: 'Construido con educadores',
    iconWrapClass: 'bg-[#35AA63]',
    Icon: Handshake,
    body: `Las ideas salen de charlas reales con logopedas, maestros
de PT y AL y equipos de orientación. Aquí no mandan las suposiciones.`,
  },
  {
    title: 'Simple para el profesional, poderoso para el usuario',
    iconWrapClass: 'bg-[#3A7CEC]',
    Icon: Wrench,
    body: `Queremos que el profesional no pierda el tiempo con menús
infinitos. Que pueda empezar ya, y seguir profundizando cuando toque.`,
  },
]

export default function SobreNosotrosPage() {
  const comingSoon = isLandingComingSoon()
  return (
    <MarketingSiteShell comingSoon={comingSoon}>
      <main className="bg-canvas px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-36 text-forest sm:pt-32 md:px-6 md:pb-20">
        <article className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-forest/70">
            <Link
              href="/"
              className="text-forest underline-offset-4 transition hover:text-coral hover:underline"
            >
              ← Volver al inicio
            </Link>
          </p>

          <header className="mt-8 rounded-[22px] border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-10">
            <p className="inline-flex items-center gap-2.5 rounded-full bg-[#FFEB3B] px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1C2B24] sm:text-xs sm:tracking-[0.12em]">
              <span className="size-2.5 shrink-0 rounded-full bg-[#E53935]" aria-hidden />
              Sobre Luma Grid
            </p>

            <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-forest sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]">
              Hecho para quienes enseñan <span className="text-wave">diferente.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-forest/75">
              Pensamos el AAC de otra manera: menos plantilla, más persona.
            </p>

            <div className="mt-8 rounded-2xl border border-black/[0.06] bg-[#FFFBF0] p-6 sm:p-7">
              <p className="text-base leading-relaxed text-forest/88">
                Esta herramienta ha sido desarrollada por{' '}
                <a
                  href="https://sleepyboybold.com"
                  className="font-bold text-forest underline-offset-4 transition hover:text-coral hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sergio T.
                </a>
                .
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
                <p className="text-sm font-medium text-forest/75">Los derechos están delegados a</p>
                <Link
                  href="https://casanuma.biz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-block w-[4.5rem] shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
                >
                  <Image
                    src="/casa-numa-logo.png"
                    alt="Casa NUMA"
                    width={832}
                    height={304}
                    className="relative z-0 h-auto w-full object-contain object-left transition-opacity duration-200 ease-out group-hover:opacity-0"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 bg-[#F45C41] opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                    style={{
                      WebkitMaskImage: 'url(/casa-numa-logo.png)',
                      maskImage: 'url(/casa-numa-logo.png)',
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'left center',
                      maskPosition: 'left center',
                    }}
                  />
                </Link>
              </div>
            </div>
          </header>

          <div className="mt-10 space-y-5">
            <div className="rounded-[22px] border border-black/[0.06] bg-[#FFF6F9] p-7 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-wider text-coral">El contexto</p>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-forest/88">
                {`Hay muchos comunicadores AAC y, en general, cumplen su función.
El problema es otro: pocos transmiten calidez.

Muchas veces todo se parece: interfaces rígidas, voces que suenan igual,
pictogramas que podrían ser de cualquier sitio. Al final, cada persona
acaba viéndose y sonando demasiado parecida a la anterior.`}
              </p>
            </div>

            <div className="rounded-[22px] border border-black/[0.06] bg-[#F3FBF6] p-7 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#2d8f52]">Por qué existimos</p>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-forest/88">
                {`Luma Grid nació para cambiar ese guion. Para nosotros,
comunicar no es solo pasar datos: es mostrar quién eres.

Por eso trabajamos para que cada persona tenga su voz, su identidad
y un tablero que la represente de verdad, no una copia de la de al lado.`}
              </p>
            </div>
          </div>

          <section className="mt-14" aria-labelledby="valores-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2
                id="valores-heading"
                className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl"
              >
                Lo que nos <span className="text-[#FE6B45]">mueve</span>
              </h2>
              <span className="hidden h-0.5 min-w-[4rem] flex-1 bg-coral/35 sm:block" aria-hidden />
            </div>

            <ul className="grid gap-5 sm:gap-6">
              {valores.map(({ title, body, iconWrapClass, Icon }) => (
                <li
                  key={title}
                  className="flex flex-col gap-4 rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:flex-row sm:items-start sm:gap-5 sm:p-7"
                >
                  <div
                    className={`flex size-[3.75rem] shrink-0 items-center justify-center rounded-2xl shadow-sm ${iconWrapClass}`}
                    aria-hidden
                  >
                    <Icon className="size-7 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-extrabold tracking-tight text-forest sm:text-xl">{title}</h3>
                    <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-forest/78">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 rounded-[28px] bg-[#062C1D] px-7 py-9 text-white shadow-[0_12px_40px_rgba(6,44,29,0.35)] sm:px-10 sm:py-11">
            <p className="whitespace-pre-line text-base font-bold leading-relaxed sm:text-[1.05rem]">
              {`Vamos poco a poco, y lo decimos con orgullo.
Cada centro que prueba Luma Grid nos ayuda a mejorar el producto para todos.

Si quieres contarnos algo, escríbenos: leemos los mensajes con calma.`}
            </p>

            <p className="mt-6 text-sm font-semibold text-white/90 sm:text-base">
              ¿Tienes dudas? Escríbenos a{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-extrabold text-[#FCE855] underline-offset-4 transition hover:underline hover:brightness-110"
              >
                {CONTACT_EMAIL}
              </a>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-[#FCE855] px-5 py-2.5 text-sm font-extrabold text-black shadow-sm transition hover:brightness-95"
              >
                Crear cuenta gratis
              </Link>
              <FeedbackOpinionCta />
              <Link
                href="/planes"
                className="text-sm font-bold text-[#FCE855] underline-offset-4 transition hover:underline hover:brightness-110"
              >
                Ver planes
              </Link>
            </div>
          </section>
        </article>
      </main>
      <MarketingFooter />
    </MarketingSiteShell>
  )
}
