import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, MessageCircle, Sparkles, Volume2, WifiOff } from 'lucide-react'
import PricingCards from '@/components/plan/PricingCards'
import { LandingJsonLd, FAQ_ITEMS } from '@/components/seo/LandingJsonLd'
import BrandLockup from '@/components/site/BrandLockup'
import DonationPartnerLogos from '@/components/site/DonationPartnerLogos'
import PwaInstallButtons from '@/components/site/PwaInstallButtons'
import SiteFooter from '@/components/site/SiteFooter'
import { getOgImageAbsoluteUrl, getOgImageDimensions } from '@/lib/seo/ogImage'
import { getSiteUrl } from '@/lib/seo/siteUrl'

const siteUrl = getSiteUrl()
const ogImageUrl = getOgImageAbsoluteUrl()
const ogDims = getOgImageDimensions()

const LANDING_DESCRIPTION =
  'Comunicación AAC en español: tablero de pictogramas, barra de frase con conjugación inteligente, predicción contextual, voz del sistema y ElevenLabs, modo offline PWA y panel para familias y profesionales. Empieza gratis.'

export const metadata: Metadata = {
  title: {
    absolute:
      'Luma Grid — Comunicación AAC con IA en español | Pictogramas, voz y tablero personalizable',
  },
  description: LANDING_DESCRIPTION,
  keywords: [
    'AAC',
    'comunicación aumentativa y alternativa',
    'CAA',
    'pictogramas',
    'tablero AAC',
    'comunicador',
    'español',
    'PWA',
    'accesibilidad',
    'TEA',
    'parálisis cerebral',
    'afasia',
    'Luma Grid',
    'voz sintética',
    'ElevenLabs',
    'modo offline',
    'comunicación asistida',
  ],
  authors: [{ name: 'Luma Grid', url: siteUrl }],
  creator: 'Luma Grid',
  publisher: 'Luma Grid',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: siteUrl,
    siteName: 'Luma Grid',
    title: 'Luma Grid — Comunicación AAC con IA en español',
    description: LANDING_DESCRIPTION,
    images: [
      {
        url: ogImageUrl,
        width: ogDims.width,
        height: ogDims.height,
        alt: 'Luma Grid — vista previa para redes sociales y buscadores',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luma Grid — AAC con IA en español',
    description: LANDING_DESCRIPTION,
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'accessibility',
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
}

const features = [
  {
    title: 'Grid AAC adaptable',
    description: 'Pictogramas por categorías, búsqueda rápida y tamaño de celda configurable por tablero.',
  },
  {
    title: 'Frases naturales con IA',
    description: 'Conjugación en español y predicción contextual para acelerar la comunicación diaria.',
  },
  {
    title: 'Modo offline real',
    description: 'Funciona sin conexión con IndexedDB, sincronización automática y caché inteligente.',
  },
  {
    title: 'Panel para cuidadores',
    description: 'Gestión centralizada de tableros, voz, editor de grid y analítica de uso.',
  },
]

const modules = [
  'Grid de símbolos por categorías',
  'Barra de frase y botón Hablar',
  'Teclado alfabético, silábico y predictivo',
  'Modo escáner para acceso asistido',
  'Historial y frases rápidas ancladas',
  'Voz del sistema y ElevenLabs con caché',
]

export default function RootPage() {
  return (
    <main className="min-h-screen select-none bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 [&_a]:select-text [&_button]:select-text [&_input]:select-text [&_select]:select-text [&_textarea]:select-text">
      <LandingJsonLd />
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-white/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_100%_50%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_0%_80%,rgba(99,102,241,0.08),transparent_45%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_100%_40%,rgba(16,185,129,0.15),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 md:gap-14 md:px-10 md:pb-32 md:pt-12">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <BrandLockup
              href="/"
              iconSize={40}
              wordmarkWidth={148}
              subtitle="Comunicación Aumentativa y Alternativa"
              priority
            />

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Link
                href="/admin"
                className="rounded-xl border border-slate-300/90 bg-white/50 px-4 py-2.5 text-sm font-medium text-slate-800 backdrop-blur-sm transition hover:border-slate-400 hover:bg-white/90 dark:border-white/20 dark:bg-white/5 dark:text-white/90 dark:hover:border-white/35 dark:hover:bg-white/10"
              >
                Panel admin
              </Link>
              <Link
                href="/tablero"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
              >
                Abrir app
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div className="space-y-8">
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  AAC con IA en español
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <MessageCircle className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  Instalable como PWA
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="text-[2.15rem] font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
                  Tu tablero.
                  <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-emerald-400">
                    Tu voz.
                  </span>
                  <span className="block">Sin complicaciones.</span>
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
                  Construye frases con pictogramas, conjúgalas con ayuda inteligente y escúchalas al momento. Un solo flujo para comunicarse con
                  autonomía, en casa o fuera de casa.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tablero"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:bg-indigo-500"
                >
                  Entrar al tablero
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300/90 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:border-slate-400 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-white/90 dark:hover:border-white/35 dark:hover:bg-white/10"
                >
                  Configurar tableros
                </Link>
                <Link
                  href="#precios"
                  className="inline-flex items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold text-indigo-700 underline decoration-indigo-400/60 underline-offset-4 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  Ver planes
                </Link>
              </div>

              <ul className="flex flex-col gap-3 border-t border-slate-200/80 pt-8 text-sm text-slate-600 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
                <li className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" aria-hidden />
                  Voz del sistema y ElevenLabs
                </li>
                <li className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Modo offline con sincronización
                </li>
              </ul>
            </div>

            <div className="relative lg:pl-2">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-transparent to-emerald-500/15 blur-2xl dark:from-indigo-500/25 dark:to-emerald-500/10" aria-hidden />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/90 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur dark:border-white/12 dark:bg-slate-900/90 dark:shadow-black/40 dark:ring-white/10">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vista previa</span>
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </div>
                </div>
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5">
                    {[
                      { t: 'Yo', bg: 'bg-sky-500/15 text-sky-900 dark:text-sky-100' },
                      { t: 'Tú', bg: 'bg-sky-500/15 text-sky-900 dark:text-sky-100' },
                      { t: 'Querer', bg: 'bg-violet-500/15 text-violet-900 dark:text-violet-100' },
                      { t: 'Ir', bg: 'bg-violet-500/15 text-violet-900 dark:text-violet-100' },
                      { t: 'Agua', bg: 'bg-cyan-500/15 text-cyan-900 dark:text-cyan-100' },
                      { t: 'Parque', bg: 'bg-amber-500/15 text-amber-900 dark:text-amber-100' },
                      { t: 'Feliz', bg: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100' },
                      { t: 'Ahora', bg: 'bg-indigo-500/15 text-indigo-900 dark:text-indigo-100' },
                    ].map((cell) => (
                      <div
                        key={cell.t}
                        className={`flex aspect-[4/3] items-center justify-center rounded-xl border border-black/[0.06] px-1 text-center text-[11px] font-bold leading-tight dark:border-white/10 sm:text-xs ${cell.bg}`}
                      >
                        {cell.t}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200">
                    <span className="text-slate-500 dark:text-slate-400">Frase generada</span>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">&quot;Quiero ir al parque ahora&quot;</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white">
                      <Volume2 className="h-4 w-4" aria-hidden />
                      Hablar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">Por qué Luma Grid</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Diseño limpio, alto contraste, enfoque en autonomía</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map(feature => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <h3 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-100/80 dark:border-white/10 dark:bg-slate-900/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Módulos principales</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">Todo el flujo AAC en una sola app</h2>
          </div>
          <ul className="space-y-3">
            {modules.map(module => (
              <li key={module} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-none">
                {module}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="precios" className="border-y border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-950/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
          <div className="mb-10 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Planes y precios</p>
            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white md:text-4xl">Elige cómo quieres hablar con Luma Grid</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
              Empieza gratis sin tarjeta. Escala a voces naturales ElevenLabs y más tableros cuando lo necesites.
            </p>
          </div>
          <PricingCards variant="landing" />
          <div className="mx-auto mt-8 max-w-3xl md:mt-10">
            <p className="flex items-start justify-center gap-2 text-left text-xs leading-relaxed text-slate-500 dark:text-slate-400 md:text-sm">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-500/90 dark:text-rose-400/90" strokeWidth={2} aria-hidden />
              <span>
                El 1% del beneficio neto de Luma Grid se dona trimestralmente a ARASAAC, Confederación Autismo España y Protectora Huellas Ávila.
              </span>
            </p>
            <DonationPartnerLogos className="mt-5" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">
          Preguntas frecuentes sobre Luma Grid
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Información clave para entender el comunicador AAC y cómo empezar.
        </p>
        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm open:shadow-md dark:border-white/10 dark:bg-white/5 dark:shadow-none"
            >
              <summary className="cursor-pointer list-none text-left text-sm font-semibold text-slate-900 outline-none marker:content-none dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{item.question}</span>
                  <span className="mt-0.5 shrink-0 text-slate-400 transition group-open:rotate-180 dark:text-slate-500" aria-hidden>
                    ▼
                  </span>
                </span>
              </summary>
              <div className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-300">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <div className="rounded-3xl border border-indigo-300/30 bg-indigo-500/10 p-8 md:p-10 dark:border-indigo-300/30">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white md:text-4xl">Úsala como app en tu dispositivo</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 dark:text-indigo-100/90 md:text-base">
            Luma Grid es una PWA: puedes instalarla en la pantalla de inicio y abrirla como una aplicación. Los pasos dependen del sistema; lo
            importante es hacerlos desde la página del <strong className="font-semibold text-slate-900 dark:text-white">tablero</strong> (
            <Link href="/tablero" className="font-semibold underline decoration-indigo-400/80 underline-offset-2 hover:text-indigo-900 dark:hover:text-white">
              /tablero
            </Link>
            ).
          </p>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-indigo-100/80">
            Elige tu plataforma para ver la guía paso a paso.
          </p>
          <PwaInstallButtons />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
