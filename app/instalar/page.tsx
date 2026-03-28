import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import BrandLockup from '@/components/site/BrandLockup'
import { InstallIconAndroid, InstallIconApple, InstallIconDesktop } from '@/components/site/installPlatformIcons'
import SiteFooter from '@/components/site/SiteFooter'

export const metadata: Metadata = {
  title: 'Cómo instalar Luma Grid',
  description:
    'Instala Luma Grid como aplicación (PWA) en iPhone, Android u ordenador. Los pasos se hacen desde la página del tablero.',
}

function Section({
  id,
  title,
  titleIcon,
  children,
}: {
  id: string
  title: string
  titleIcon: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-3 text-xl font-bold text-slate-950 dark:text-white md:gap-3.5 md:text-2xl">
        <span className="inline-flex shrink-0 text-indigo-600 dark:text-indigo-400 [&>svg]:h-8 [&>svg]:w-8 md:[&>svg]:h-9 md:[&>svg]:w-9">
          {titleIcon}
        </span>
        <span>{title}</span>
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
        {children}
      </div>
    </section>
  )
}

export default function InstalarPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 md:px-8">
          <Link
            href="/"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
          >
            ← Volver al inicio
          </Link>
          <BrandLockup href="/" iconSize={36} wordmarkWidth={140} subtitle="Instalación como app (PWA)" />
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-6 py-10 md:px-8 md:py-14">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl">Instalar Luma Grid</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Luma Grid es una <strong className="font-semibold text-slate-800 dark:text-slate-200">aplicación web progresiva (PWA)</strong>.
          Para añadirla a tu pantalla de inicio o instalarla como app, debes seguir los pasos estando en la{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">página del tablero</strong>, no solo en la portada del sitio.
        </p>

        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-500/10 px-4 py-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Importante</p>
          <p className="mt-2 text-sm text-indigo-900/90 dark:text-indigo-100/90">
            Abre primero{' '}
            <Link
              href="/tablero"
              className="font-bold underline decoration-indigo-400 underline-offset-2 hover:text-indigo-700 dark:hover:text-white"
            >
              /tablero
            </Link>{' '}
            en el navegador (inicia sesión si te lo pide). Desde ahí sigue las instrucciones de tu dispositivo. Si instalas desde otra URL, el acceso puede no comportarse como la app completa.
          </p>
        </div>

        <div className="mt-12 space-y-14">
          <Section id="ios" title="iPhone y iPad (iOS)" titleIcon={<InstallIconApple />}>
            <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-indigo-600 dark:marker:text-indigo-400">
              <li>
                Abre <strong className="text-slate-800 dark:text-slate-200">Safari</strong> o{' '}
                <strong className="text-slate-800 dark:text-slate-200">Chrome</strong> y entra en{' '}
                <Link href="/tablero" className="font-semibold text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                  /tablero
                </Link>
                .
              </li>
              <li>
                Pulsa el menú de los <strong className="text-slate-800 dark:text-slate-200">tres puntos</strong> (⋮), suele estar arriba a la
                derecha en Chrome; en Safari usa el botón <strong className="text-slate-800 dark:text-slate-200">Compartir</strong> (cuadrado con
                flecha) si no ves el menú de puntos.
              </li>
              <li>
                Elige <strong className="text-slate-800 dark:text-slate-200">Compartir</strong> y, si hace falta, <strong className="text-slate-800 dark:text-slate-200">Ver más</strong> o desplázate en la hoja de compartir hasta encontrar la opción de añadir a inicio.
              </li>
              <li>
                Pulsa <strong className="text-slate-800 dark:text-slate-200">Añadir a pantalla de inicio</strong> (o el texto equivalente que muestre tu versión de iOS).
              </li>
              <li>
                Confirma el nombre y añade el icono. Al abrirlo desde el escritorio, si aparece la opción, activa{' '}
                <strong className="text-slate-800 dark:text-slate-200">Abrir como app web</strong> (o similar) para que se abra a pantalla completa como aplicación.
              </li>
            </ol>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Los textos exactos pueden variar según la versión de iOS y el navegador. Lo esencial es estar en{' '}
              <Link href="/tablero" className="text-indigo-600 underline dark:text-indigo-400">
                /tablero
              </Link>{' '}
              antes de instalar.
            </p>
          </Section>

          <Section id="android" title="Android" titleIcon={<InstallIconAndroid />}>
            <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-indigo-600 dark:marker:text-indigo-400">
              <li>
                Abre <strong className="text-slate-800 dark:text-slate-200">Chrome</strong> (recomendado) u otro navegador compatible y entra en{' '}
                <Link href="/tablero" className="font-semibold text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                  /tablero
                </Link>
                .
              </li>
              <li>
                Pulsa el menú de los <strong className="text-slate-800 dark:text-slate-200">tres puntos</strong> (⋮) arriba a la derecha.
              </li>
              <li>
                Elige <strong className="text-slate-800 dark:text-slate-200">Instalar aplicación</strong>,{' '}
                <strong className="text-slate-800 dark:text-slate-200">Añadir a la pantalla de inicio</strong> o la opción equivalente que
                muestre tu móvil (puede decir “Instalar app” o el nombre “Luma Grid”).
              </li>
              <li>Confirma la instalación. El icono aparecerá en el cajón o en el escritorio según tu lanzador.</li>
            </ol>
          </Section>

          <Section
            id="ordenador"
            title="Ordenador (Windows, Mac o Linux)"
            titleIcon={<InstallIconDesktop />}
          >
            <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-indigo-600 dark:marker:text-indigo-400">
              <li>
                Abre <strong className="text-slate-800 dark:text-slate-200">Chrome</strong>, <strong className="text-slate-800 dark:text-slate-200">Edge</strong> u otro navegador basado en Chromium y entra en{' '}
                <Link href="/tablero" className="font-semibold text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
                  /tablero
                </Link>
                .
              </li>
              <li>
                Mira la <strong className="text-slate-800 dark:text-slate-200">barra de direcciones</strong>: si aparece un icono de instalar (⊕, monitor con flecha o “Instalar”), haz clic ahí.
              </li>
              <li>
                Si no lo ves, abre el menú de los <strong className="text-slate-800 dark:text-slate-200">tres puntos</strong> (⋮) y busca{' '}
                <strong className="text-slate-800 dark:text-slate-200">Instalar Luma Grid…</strong>, <strong className="text-slate-800 dark:text-slate-200">Aplicación</strong> → <strong className="text-slate-800 dark:text-slate-200">Instalar esta página como aplicación</strong> o texto similar.
              </li>
              <li>Confirma el cuadro de diálogo. Se creará un acceso directo y podrás abrir Luma Grid como ventana propia, sin pestañas del navegador.</li>
            </ol>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              En Firefox la instalación PWA puede estar limitada; Chrome o Edge suelen ofrecer la mejor experiencia en escritorio.
            </p>
          </Section>
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/80">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">¿Listo?</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/tablero"
              className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400"
            >
              Ir al tablero
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
