import Link from 'next/link'

import { CompareBreadcrumb } from '@/components/compare/CompareHero'
import { MarketingFooter } from '@/components/landing/MarketingFooter'
import { getCompareHubEntries } from '@/lib/compare'
import { LUMA_DIFFERENTIALS } from '@/lib/compare/lumaGrid'

export function CompareHubPage() {
  const entries = getCompareHubEntries()

  return (
    <>
      <main className="bg-canvas px-4 pb-16 pt-36 text-forest sm:pt-32 md:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <CompareBreadcrumb />

          <header className="mt-8 rounded-[22px] border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">Comparativas AAC</p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight text-forest sm:text-4xl md:text-5xl">
              Compara Luma Grid con otros comunicadores AAC
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-forest/80 md:text-lg">
              Comparativas honestas para logopedas y centros educativos en España. Reconocemos las fortalezas de cada
              competidor — sin logos ajenos ni claims de afiliación.
            </p>
          </header>

          <section aria-labelledby="compare-differentials" className="mt-10">
            <h2 id="compare-differentials" className="text-xl font-bold text-forest">
              Diferenciales de Luma Grid
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(LUMA_DIFFERENTIALS).map(([key, text]) => (
                <li
                  key={key}
                  className="rounded-[18px] border border-black/[0.06] bg-white px-4 py-3 text-sm leading-relaxed text-forest/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                >
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="compare-list-heading" className="mt-14">
            <h2 id="compare-list-heading" className="text-2xl font-black text-forest">
              Comparativas disponibles
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-1">
              {entries.map(entry => (
                <article
                  key={entry.slug}
                  className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:p-8"
                >
                  <h3 className="text-xl font-bold text-forest">
                    <Link
                      href={`/comparar/${entry.slug}`}
                      className="underline-offset-4 transition hover:text-coral hover:underline"
                    >
                      Luma Grid vs {entry.competitorName}
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-forest/75">{entry.teaser}</p>
                  <p className="mt-4 rounded-xl bg-[#35AA63]/8 px-4 py-3 text-sm font-medium leading-relaxed text-forest">
                    {entry.verdict}
                  </p>
                  <Link
                    href={`/comparar/${entry.slug}`}
                    className="mt-5 inline-flex items-center text-sm font-bold text-accent-blue underline-offset-4 transition hover:underline"
                  >
                    Ver comparativa completa →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-[22px] border border-[#35AA63]/25 bg-[#35AA63]/8 p-8 text-center">
            <h2 className="text-xl font-black text-forest">¿Listo para probar?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-forest/80">
              Empieza con el Plan Libre — gratis, sin tarjeta. Conjugación automática y predicción de frases incluidas.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#FE6B45] px-8 py-3 text-base font-bold text-white shadow-sm transition hover:brightness-95"
            >
              Crear cuenta gratis
            </Link>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  )
}
