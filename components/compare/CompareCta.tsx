import Link from 'next/link'

import { COMPARE_SLUGS, getComparePage } from '@/lib/compare'

type CompareCtaProps = {
  currentSlug?: string
}

export function CompareCta({ currentSlug }: CompareCtaProps) {
  const otherSlugs = COMPARE_SLUGS.filter(s => s !== currentSlug)

  return (
    <section aria-labelledby="compare-cta-heading" className="scroll-mt-28 space-y-10">
      <article className="rounded-[22px] border border-[#35AA63]/25 bg-[#35AA63]/8 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:p-12">
        <h2 id="compare-cta-heading" className="text-2xl font-black text-forest md:text-3xl">
          Empieza gratis con el Plan Libre
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest/80">
          Sin tarjeta, sin compromiso. Incluye conjugación automática de verbos y predicción de frases con IA — prueba
          cómo suenan las frases antes de decidir por voces naturales ElevenLabs.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[#FE6B45] px-8 py-3.5 text-base font-bold text-white shadow-sm transition hover:brightness-95"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/planes"
            className="inline-flex items-center justify-center rounded-full border border-black/[0.1] bg-white px-8 py-3.5 text-base font-bold text-forest transition hover:bg-neutral-50"
          >
            Ver todos los planes
          </Link>
        </div>
      </article>

      {otherSlugs.length > 0 ? (
        <div>
          <h3 className="text-xl font-bold text-forest">Otras comparaciones</h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {otherSlugs.map(slug => {
              const page = getComparePage(slug)
              if (!page) return null
              return (
                <li key={slug}>
                  <Link
                    href={`/comparar/${slug}`}
                    className="block rounded-[18px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition hover:border-accent-blue/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  >
                    <span className="font-bold text-forest">Luma Grid vs {page.competitorName}</span>
                    <p className="mt-2 text-sm leading-relaxed text-forest/70">{page.hubTeaser}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
