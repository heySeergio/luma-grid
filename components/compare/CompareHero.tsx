import Link from 'next/link'

import type { ComparePageData } from '@/lib/compare/types'

type CompareHeroProps = {
  data: ComparePageData
}

export function CompareHero({ data }: CompareHeroProps) {
  return (
    <header className="rounded-[22px] border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">Comparativa AAC</p>
      <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight text-forest sm:text-4xl md:text-5xl">
        {data.heroTitle}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-forest/80 md:text-lg">{data.heroSubtitle}</p>
      <div className="mt-6 rounded-2xl border border-[#35AA63]/20 bg-[#35AA63]/8 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#35AA63]">¿Para quién es cada uno?</p>
        <p className="mt-2 text-base font-semibold leading-relaxed text-forest md:text-lg">{data.heroVerdict}</p>
      </div>
      {data.competitorVendor ? (
        <p className="mt-4 text-sm text-forest/60">
          {data.competitorName} es un producto de {data.competitorVendor}. Luma Grid no está afiliado ni respaldado por
          esta marca.
        </p>
      ) : null}
    </header>
  )
}

type CompareBreadcrumbProps = {
  competitorName?: string
}

export function CompareBreadcrumb({ competitorName }: CompareBreadcrumbProps) {
  return (
    <nav aria-label="Miga de pan" className="text-sm font-semibold text-forest/70">
      <Link href="/#inicio" className="text-forest underline-offset-4 transition hover:text-coral hover:underline">
        ← Inicio
      </Link>
      <span className="mx-2 text-forest/40">/</span>
      <Link href="/comparar" className="text-forest underline-offset-4 transition hover:text-coral hover:underline">
        Comparar
      </Link>
      {competitorName ? (
        <>
          <span className="mx-2 text-forest/40">/</span>
          <span className="text-forest/80">{competitorName}</span>
        </>
      ) : null}
    </nav>
  )
}
