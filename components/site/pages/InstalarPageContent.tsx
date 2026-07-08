import type { ReactNode } from 'react'
import Image from 'next/image'
import { NavBrandTitle } from '@/components/landing/NavBrandTitle'
import { InstallIconAndroid, InstallIconApple, InstallIconDesktop } from '@/components/site/installPlatformIcons'

/** Metadatos de `/instalar` (usados en `app/instalar/page.tsx`). */
export const INSTALAR_PAGE_METADATA = {
  title: 'Cómo instalar Luma Grid',
  description:
    'Cuando la aplicación esté disponible para su uso, estos son los pasos para instalarla como PWA en iPhone, Android u ordenador.',
} as const

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
    <section id={id} className="scroll-mt-28">
      <h2 className="flex items-center gap-3 text-xl font-extrabold text-forest md:gap-3.5 md:text-2xl">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center text-accent-blue md:size-10 [&>span]:flex [&>span]:h-8 [&>span]:w-8 [&>span]:items-center [&>span]:justify-center md:[&>span]:h-9 md:[&>span]:w-9 [&>svg]:h-8 [&>svg]:w-8 md:[&>svg]:h-9 md:[&>svg]:w-9"
          aria-hidden
        >
          {titleIcon}
        </span>
        <span>{title}</span>
      </h2>
      <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-forest/80 md:text-base">{children}</div>
    </section>
  )
}

/** Misma composición que `MarketingFooter`, sin hipervínculos (pie de `/instalar`). */
function InstalarFooterSinEnlaces() {
  return (
    <footer className="border-t border-black/10 bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-forest">
            <Image
              src="/logo-luma-grid.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            />
            <NavBrandTitle>Luma Grid</NavBrandTitle>
          </div>
          <p className="mt-2 text-sm font-medium text-forest/65">Comunicación Aumentativa y Alternativa</p>
        </div>
        <div
          aria-label="Documentación legal (solo texto)"
          className="grid w-full grid-cols-3 gap-3 text-center text-sm font-semibold leading-snug text-forest/80 sm:ml-auto sm:w-auto sm:max-w-2xl sm:gap-8 sm:text-right"
        >
          <p className="min-w-0">Términos y Condiciones</p>
          <p>Privacidad</p>
          <p>Cookies</p>
        </div>
      </div>
    </footer>
  )
}

/** Contenido de `/instalar` (estética alineada con la landing comercial). */
export default function InstalarPageContent() {
  return (
    <main className="bg-canvas px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-36 text-forest sm:pt-32 md:px-6 md:pb-16">
      <article className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest/55">Guía de instalación</p>

        <header className="mt-6">
          <h1 className="text-balance text-3xl font-black tracking-tight text-forest md:text-4xl">Instalar Luma Grid</h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-forest/80">
            Cuando la aplicación sea de uso general y esté disponible para las personas que la utilizarán,{' '}
            <strong className="font-extrabold text-forest">estos serán los pasos</strong> para añadirla a la pantalla de inicio o instalarla como{' '}
            <strong className="font-extrabold text-forest">aplicación web progresiva (PWA)</strong>, según el dispositivo.
          </p>
        </header>

        <div className="mt-6 rounded-[22px] border border-black/[0.06] bg-cta-yellow/90 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <p className="text-sm font-extrabold text-forest">Importante</p>
          <p className="mt-2 text-sm font-medium text-forest/85">
            La instalación habrá de hacerse con <strong className="font-extrabold text-forest">Luma Grid abierto en el navegador</strong>, en la misma
            dirección web desde la que se usará la herramienta en el día a día. Si se instala desde otra página del sitio, la experiencia puede no ser la
            completa.
          </p>
        </div>

        <div className="mt-12 space-y-14">
          <Section id="ios" title="iPhone y iPad (iOS)" titleIcon={<InstallIconApple />}>
            <ol className="list-decimal space-y-3 pl-5 marker:font-extrabold marker:text-accent-blue">
              <li>
                Abre <strong className="text-forest">Safari</strong> o <strong className="text-forest">Chrome</strong> y accede a Luma Grid usando la
                dirección web de trabajo (donde la aplicación estará en uso).
              </li>
              <li>
                Pulsa el menú de los <strong className="text-forest">tres puntos</strong> (⋮), suele estar arriba a la derecha en Chrome; en Safari usa
                el botón <strong className="text-forest">Compartir</strong> (cuadrado con flecha) si no ves el menú de puntos.
              </li>
              <li>
                Elige <strong className="text-forest">Compartir</strong> y, si hace falta, <strong className="text-forest">Ver más</strong> o desplázate
                en la hoja de compartir hasta encontrar la opción de añadir a inicio.
              </li>
              <li>
                Pulsa <strong className="text-forest">Añadir a pantalla de inicio</strong> (o el texto equivalente que muestre tu versión de iOS).
              </li>
              <li>
                Confirma el nombre y añade el icono. Al abrirlo desde el escritorio, si aparece la opción, activa{' '}
                <strong className="text-forest">Abrir como app web</strong> (o similar) para que se abra a pantalla completa como aplicación.
              </li>
            </ol>
            <p className="mt-4 text-sm text-forest/65">
              Los textos exactos pueden variar según la versión de iOS y el navegador. Lo esencial es tener Luma Grid abierto en la dirección correcta
              antes de instalar.
            </p>
          </Section>

          <Section id="android" title="Android" titleIcon={<InstallIconAndroid />}>
            <ol className="list-decimal space-y-3 pl-5 marker:font-extrabold marker:text-accent-blue">
              <li>
                Abre <strong className="text-forest">Chrome</strong> (recomendado) u otro navegador compatible y accede a Luma Grid en la dirección web
                donde utilizarás la aplicación.
              </li>
              <li>
                Pulsa el menú de los <strong className="text-forest">tres puntos</strong> (⋮) arriba a la derecha.
              </li>
              <li>
                Elige <strong className="text-forest">Instalar aplicación</strong>,{' '}
                <strong className="text-forest">Añadir a la pantalla de inicio</strong> o la opción equivalente que muestre tu móvil (puede decir “Instalar
                app” o el nombre “Luma Grid”).
              </li>
              <li>Confirma la instalación. El icono aparecerá en el cajón o en el escritorio según tu lanzador.</li>
            </ol>
          </Section>

          <Section id="ordenador" title="Ordenador (Windows, Mac o Linux)" titleIcon={<InstallIconDesktop />}>
            <ol className="list-decimal space-y-3 pl-5 marker:font-extrabold marker:text-accent-blue">
              <li>
                Abre <strong className="text-forest">Chrome</strong>, <strong className="text-forest">Edge</strong> u otro navegador basado en Chromium y
                accede a Luma Grid en la dirección web desde la que usarás la herramienta.
              </li>
              <li>
                Mira la <strong className="text-forest">barra de direcciones</strong>: si aparece un icono de instalar (⊕, monitor con flecha o
                “Instalar”), haz clic ahí.
              </li>
              <li>
                Si no lo ves, abre el menú de los <strong className="text-forest">tres puntos</strong> (⋮) y busca{' '}
                <strong className="text-forest">Instalar Luma Grid…</strong>, <strong className="text-forest">Aplicación</strong> →{' '}
                <strong className="text-forest">Instalar esta página como aplicación</strong> o texto similar.
              </li>
              <li>
                Confirma el cuadro de diálogo. Se creará un acceso directo y podrás abrir Luma Grid como ventana propia, sin pestañas del navegador.
              </li>
            </ol>
            <p className="mt-4 text-sm text-forest/65">
              En Firefox la instalación PWA puede estar limitada; Chrome o Edge suelen ofrecer la mejor experiencia en escritorio.
            </p>
          </Section>
        </div>

        <div className="mt-14 mb-10 rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:mb-14">
          <p className="text-sm font-extrabold text-forest">Resumen</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-forest/85">
            Cuando Luma Grid esté disponible para quienes la vayan a usar, abre siempre la aplicación en el navegador en la dirección indicada para tu caso
            y, desde ahí, sigue los pasos que muestre tu sistema operativo o navegador para añadirla al inicio o instalarla como app.
          </p>
        </div>
      </article>

      <InstalarFooterSinEnlaces />
    </main>
  )
}
