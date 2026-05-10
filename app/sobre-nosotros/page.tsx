import type { Metadata } from 'next'
import Link from 'next/link'
import { Handshake, Volume2, Wrench, type LucideIcon } from 'lucide-react'

import { FeedbackOpinionCta } from '@/components/sobre-nosotros/FeedbackOpinionCta'
import { MarketingSiteShell } from '@/components/site/MarketingSiteShell'
import { isLandingComingSoon } from '@/lib/site/comingSoon'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Luma Grid es un proyecto de Casa Numa: comunicación AAC con voz propia, hecha con educadores y orientada a personas reales.',
  alternates: { canonical: '/sobre-nosotros' },
  openGraph: {
    title: 'Sobre nosotros · Luma Grid',
    description:
      'Luma Grid es un proyecto de Casa Numa: comunicación AAC con voz propia, hecha con educadores y orientada a personas reales.',
    url: '/sobre-nosotros',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Luma Grid',
  },
  twitter: {
    card: 'summary',
    title: 'Sobre nosotros · Luma Grid',
    description:
      'Luma Grid es un proyecto de Casa Numa: comunicación AAC con voz propia, hecha con educadores y orientada a personas reales.',
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
de PT y equipos de orientación. Aquí no mandan las suposiciones.`,
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
      <main className="bg-canvas px-4 pb-20 pt-36 text-forest sm:pt-32 md:px-6">
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
              En{' '}
              <a
                href="https://casanuma.biz"
                className="font-bold text-forest underline-offset-4 transition hover:text-coral hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Casa Numa
              </a>{' '}
              pensamos el AAC de otra manera: menos plantilla, más persona.
            </p>
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
                {`Luma Grid nació en Casa Numa para cambiar ese guion. Para nosotros,
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

Si quieres contarnos algo, escríbenos: en Casa Numa leemos los mensajes
con calma.`}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <FeedbackOpinionCta />
              <Link
                href="/"
                className="text-sm font-bold text-[#FCE855] underline-offset-4 transition hover:underline hover:brightness-110"
              >
                Explorar la landing
              </Link>
            </div>
          </section>
        </article>
      </main>
    </MarketingSiteShell>
  )
}
