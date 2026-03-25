import Link from 'next/link'

const features = [
  {
    title: 'Grid AAC adaptable',
    description: 'Pictogramas por categorias, busqueda rapida y tamano de celda configurable por perfil.',
  },
  {
    title: 'Frases naturales con IA',
    description: 'Conjugacion en espanol y prediccion contextual para acelerar la comunicacion diaria.',
  },
  {
    title: 'Modo offline real',
    description: 'Funciona sin conexion con IndexedDB, sincronizacion automatica y cache inteligente.',
  },
  {
    title: 'Panel para cuidadores',
    description: 'Gestion centralizada de perfiles, voz, editor de grid y analitica de uso.',
  },
]

const modules = [
  'Grid de simbolos por categorias',
  'Barra de frase y boton Hablar',
  'Teclado alfabetico, silabico y predictivo',
  'Modo escaner para acceso asistido',
  'Historial y frases rapidas ancladas',
  'Voz del sistema y ElevenLabs con cache',
]

export default function RootPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.32),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_35%)]" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-10 md:px-10 md:pb-28 md:pt-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-xl">💬</div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-indigo-300">Luma Grid</p>
                <p className="text-xs text-slate-300">Comunicacion Aumentativa y Alternativa</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/35 hover:bg-white/10"
              >
                Panel admin
              </Link>
              <Link
                href="/app"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Abrir app
              </Link>
            </div>
          </header>

          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <p className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                PWA pensada para comunicacion asistida
              </p>

              <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
                La voz digital que acompana cada conversacion.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                Luma Grid ayuda a personas con dificultades de comunicacion verbal a construir frases con simbolos,
                conjugarlas en lenguaje natural y reproducirlas al instante con una voz clara.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
                >
                  Probar interfaz AAC
                </Link>
                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/35 hover:bg-white/10"
                >
                  Gestionar perfiles
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur">
              <div className="grid gap-3 rounded-2xl bg-slate-900/80 p-4">
                <div className="grid grid-cols-3 gap-2">
                  {['Yo', 'Querer', 'Agua', 'Tu', 'Ir', 'Parque', 'Feliz', 'No', 'Ahora'].map(item => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xs font-semibold text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-200">
                  Frase: <span className="font-semibold text-white">"Quiero ir al parque ahora"</span>
                </div>
                <button className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white">Hablar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Por que Luma Grid</h2>
          <p className="text-sm text-slate-400">Diseo limpio, alto contraste, enfoque en autonomia</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map(feature => (
            <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-300">Modulos principales</p>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Todo el flujo AAC en una sola app</h2>
          </div>
          <ul className="space-y-3">
            {modules.map(module => (
              <li key={module} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {module}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
        <div className="rounded-3xl border border-indigo-300/30 bg-indigo-500/10 p-8 md:p-10">
          <h2 className="text-2xl font-black text-white md:text-4xl">Listo para usar en tablet, movil o escritorio</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-indigo-100/90 md:text-base">
            Instalable como PWA, optimizada para uso diario y preparada para evolucionar con perfiles personalizados,
            analitica de uso y gestion remota desde el panel de administracion.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100">
              Entrar en la app
            </Link>
            <Link href="/admin" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Ir al panel admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
