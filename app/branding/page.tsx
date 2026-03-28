import Image from 'next/image'
import Link from 'next/link'
import BrandLockup from '@/components/site/BrandLockup'
import SiteFooter from '@/components/site/SiteFooter'

const primaryPalette = [
  {
    name: 'Luma Indigo',
    token: '--accent',
    value: '#6366F1',
    usage: 'Color principal de accion, llamadas primarias y elementos de identidad.',
  },
  {
    name: 'Luma Indigo Light',
    token: '--accent-light',
    value: '#818CF8',
    usage: 'Gradientes, estados hover y apoyos visuales suaves.',
  },
  {
    name: 'Luma Indigo Dark',
    token: '--accent-dark',
    value: '#4F46E5',
    usage: 'Contraste, profundidad y variantes de CTA.',
  },
]

const semanticPalette = [
  {
    name: 'App Background',
    token: '--app-bg',
    usage: 'Fondo general del producto y pantallas principales.',
  },
  {
    name: 'Surface',
    token: '--app-surface',
    usage: 'Tarjetas, paneles y superficies elevadas.',
  },
  {
    name: 'Foreground',
    token: '--app-foreground',
    usage: 'Texto principal, iconografia y contraste base.',
  },
  {
    name: 'Muted Foreground',
    token: '--app-muted-foreground',
    usage: 'Texto secundario, soporte y descripciones.',
  },
  {
    name: 'Border',
    token: '--app-border',
    usage: 'Separadores, bordes suaves y contencion visual.',
  },
  {
    name: 'Predicted',
    token: '--app-predicted',
    usage: 'Resaltado de sugerencias y estados inteligentes.',
  },
]

const symbolPalette = [
  { name: 'Surface', token: '--symbol-color-surface' },
  { name: 'Sky', token: '--symbol-color-sky' },
  { name: 'Green', token: '--symbol-color-green' },
  { name: 'Yellow', token: '--symbol-color-yellow' },
  { name: 'Violet', token: '--symbol-color-violet' },
  { name: 'Rose', token: '--symbol-color-rose' },
  { name: 'Cyan', token: '--symbol-color-cyan' },
  { name: 'Pink', token: '--symbol-color-pink' },
  { name: 'Amber', token: '--symbol-color-amber' },
  { name: 'Mint', token: '--symbol-color-mint' },
  { name: 'Time', token: '--symbol-color-time' },
  { name: 'Folder', token: '--symbol-color-folder' },
]

const principles = [
  'Claro primero: la interfaz debe entenderse sin explicacion previa.',
  'Calma visual: pocas capas, bordes suaves y movimiento sutil.',
  'Accesibilidad real: contraste alto y lectura inmediata.',
  'Consistencia: un mismo sistema visual para tablero, admin y marketing.',
]

const brandAssets = [
  { name: 'Logo base', href: '/icons/LogoBase.png', format: 'PNG' },
  { name: 'Logo texto', href: '/icons/Luma%20Grid%20Texto.svg', format: 'SVG' },
  { name: 'Favicon principal', href: '/icons/favicon.png', format: 'PNG' },
  { name: 'Apple touch icon', href: '/icons/apple-touch-icon.png', format: 'PNG' },
  { name: 'PWA 192x192', href: '/icons/192x192.png', format: 'PNG' },
  { name: 'PWA 512x512', href: '/icons/512x512.png', format: 'PNG' },
]

export default function BrandingPage() {
  return (
    <main className="theme-page-shell min-h-screen text-[var(--app-foreground)]">
      <section className="relative overflow-hidden border-b border-[var(--app-border)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(129,140,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(129,140,248,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <BrandLockup
              href="/"
              iconSize={44}
              wordmarkWidth={164}
              subtitle="Sistema de branding y lenguaje visual"
              priority
            />

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="ui-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold text-[var(--app-foreground)]"
              >
                Inicio
              </Link>
              <Link
                href="/tablero"
                className="ui-primary-button rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Abrir app
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <span className="ui-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200">
                Branding hub
              </span>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-[var(--app-foreground)] md:text-6xl">
                  La identidad visual de Luma Grid ya está integrada en la app.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-[var(--app-muted-foreground)] md:text-lg">
                  Esta página reúne la paleta principal, los colores semánticos del sistema y los logos, favicons e iconos
                  reales que ya has añadido para web, branding y PWA.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="#paleta" className="ui-primary-button rounded-2xl px-5 py-3 text-sm font-semibold">
                  Ver paleta
                </a>
              </div>
            </div>

            <div className="app-panel rounded-[2rem] p-5">
              <div className="grid gap-4 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                      Sistema de logos
                    </p>
                    <p className="mt-1 text-sm text-[var(--app-muted-foreground)]">
                      Aplicado en landing, auth, favicons, PWA y documentación visual.
                    </p>
                  </div>
                  <span className="ui-soft-badge rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-muted-foreground)]">
                    Activo
                  </span>
                </div>

                <div
                  className="grid gap-4 rounded-[1.8rem] border border-dashed border-[var(--app-border-strong)] bg-[color-mix(in_srgb,var(--app-surface-elevated)_84%,transparent)] p-5 md:p-6"
                  id="logo"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                        Vista comparada
                      </p>
                      <p className="mt-1 text-sm text-[var(--app-muted-foreground)]">
                        El branding se muestra a la vez sobre fondo claro y fondo oscuro, independientemente del tema activo.
                      </p>
                    </div>
                    <span className="ui-chip rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-muted-foreground)]">
                      Claro + Oscuro
                    </span>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <article className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.22)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Fondo claro
                      </p>
                      <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center gap-6 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 text-center">
                        <Image
                          src="/icons/LogoBase.png"
                          alt="Logo base de Luma Grid sobre fondo claro"
                          width={144}
                          height={144}
                          priority
                          className="h-auto w-28 md:w-36"
                        />
                        <Image
                          src="/icons/Luma%20Grid%20Texto.svg"
                          alt="Logo tipográfico de Luma Grid sobre fondo claro"
                          width={340}
                          height={96}
                          priority
                          className="h-auto w-full max-w-[260px]"
                        />
                      </div>
                    </article>

                    <article className="rounded-[1.7rem] border border-slate-800 bg-slate-950 p-6 shadow-[0_20px_55px_-30px_rgba(2,6,23,0.9)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Fondo oscuro
                      </p>
                      <div className="mt-5 flex min-h-[260px] flex-col items-center justify-center gap-6 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 text-center">
                        <Image
                          src="/icons/LogoBase.png"
                          alt="Logo base de Luma Grid sobre fondo oscuro"
                          width={144}
                          height={144}
                          priority
                          className="h-auto w-28 md:w-36"
                        />
                        <Image
                          src="/icons/Luma%20Grid%20Texto.svg"
                          alt="Logo tipográfico de Luma Grid sobre fondo oscuro"
                          width={340}
                          height={96}
                          priority
                          className="h-auto w-full max-w-[260px]"
                        />
                      </div>
                    </article>
                  </div>

                  <p className="text-sm text-[var(--app-muted-foreground)]">
                    Así puedes validar al instante la presencia de marca sobre superficies luminosas y profundas sin depender del modo actual de la interfaz.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--app-muted-foreground)]">
                      Estado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">Branding actualizado</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--app-muted-foreground)]">
                      Cobertura
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">Web, auth, footer y PWA</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--app-muted-foreground)]">
                      Uso
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--app-foreground)]">Web, app, PWA y docs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="paleta" className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Paleta principal
            </p>
            <h2 className="mt-2 text-3xl font-black text-[var(--app-foreground)]">Colores nucleares de marca</h2>
          </div>
          <p className="max-w-2xl text-sm text-[var(--app-muted-foreground)]">
            Esta es la capa mas identitaria: accion, reconocimiento y consistencia visual en todo el ecosistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {primaryPalette.map((item) => (
            <article key={item.name} className="app-panel rounded-[1.75rem] p-4">
              <div
                className="h-36 rounded-[1.4rem] border border-white/20 shadow-[var(--premium-shadow)]"
                style={{ backgroundColor: `var(${item.token})` }}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[var(--app-foreground)]">{item.name}</h3>
                  <span className="ui-chip rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-muted-foreground)]">
                    {item.value}
                  </span>
                </div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">{item.token}</p>
                <p className="text-sm leading-relaxed text-[var(--app-muted-foreground)]">{item.usage}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_72%,transparent)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Sistema semantico
            </p>
            <h2 className="mt-2 text-3xl font-black text-[var(--app-foreground)]">
              Tokens preparados para claro y oscuro
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--app-muted-foreground)]">
              La identidad no depende de hex dispersos. Se apoya en tokens para fondo, superficie, texto, bordes y
              estados, haciendo que la marca se comporte bien en cualquier tema.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {semanticPalette.map((item) => (
              <div key={item.token} className="ui-floating-panel rounded-[1.4rem] p-4">
                <div
                  className="mb-4 h-16 rounded-2xl border border-[var(--app-border)]"
                  style={{ backgroundColor: `var(${item.token})` }}
                />
                <p className="text-sm font-bold text-[var(--app-foreground)]">{item.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">
                  {item.token}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted-foreground)]">{item.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Paleta de simbolos
            </p>
            <h2 className="mt-2 text-3xl font-black text-[var(--app-foreground)]">
              Colores adaptativos para el sistema AAC
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-[var(--app-muted-foreground)]">
            Estos colores se adaptan automaticamente al modo claro y oscuro y son la base visual del tablero y del editor.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {symbolPalette.map((item) => (
            <div key={item.token} className="app-panel rounded-[1.5rem] p-4">
              <div
                className="h-24 rounded-[1.2rem] border border-[var(--app-border)]"
                style={{ backgroundColor: `var(${item.token})` }}
              />
              <div className="mt-3">
                <p className="text-base font-bold text-[var(--app-foreground)]">{item.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                  {item.token}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--app-border)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--app-surface))]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:px-10 lg:grid-cols-2">
          <article className="app-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Principios
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--app-foreground)]">Como debe sentirse Luma Grid</h2>
            <ul className="mt-5 space-y-3">
              {principles.map((principle) => (
                <li
                  key={principle}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-4 py-3 text-sm text-[var(--app-foreground)]"
                >
                  {principle}
                </li>
              ))}
            </ul>
          </article>

          <article className="app-panel rounded-[1.8rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Activos disponibles
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--app-foreground)]">Descargas y formatos listos para usar</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {brandAssets.map((asset) => (
                <a
                  key={asset.href}
                  href={asset.href}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-floating-panel rounded-2xl px-4 py-4 text-sm font-medium text-[var(--app-foreground)] transition hover:opacity-90"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{asset.name}</span>
                    <span className="ui-chip rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-muted-foreground)]">
                      {asset.format}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-elevated)] p-8 shadow-[var(--premium-shadow)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                Estado actual
              </p>
              <h2 className="mt-2 text-3xl font-black text-[var(--app-foreground)]">
                La identidad visual ya está conectada en toda la app.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--app-muted-foreground)]">
                Si quieres, el siguiente nivel sería documentar normas de uso, tamaños mínimos, márgenes de seguridad,
                versiones monocromas y mockups de aplicación para dejar esta sección de branding más profesional.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="ui-secondary-button rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--app-foreground)]">
                Ir al admin
              </Link>
              <Link href="/tablero" className="ui-primary-button rounded-2xl px-5 py-3 text-sm font-semibold">
                Ver producto
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
