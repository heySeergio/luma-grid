import Link from 'next/link'
import type { ReactNode } from 'react'
import { MarketingFooter } from '@/components/landing/MarketingFooter'

type LegalSection = {
  title: string
  content: ReactNode
}

type LegalPageProps = {
  eyebrow: string
  title: string
  intro: string
  sections: LegalSection[]
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: LegalPageProps) {
  const sectionNodes = (
    <div className="space-y-5">
      {sections.map(section => (
        <article
          key={section.title}
          className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:p-8"
        >
          <h2 className="text-xl font-bold text-forest">{section.title}</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-forest/80 md:text-base">
            {section.content}
          </div>
        </article>
      ))}
    </div>
  )

  return (
    <>
      <main className="bg-canvas px-4 pb-16 pt-36 text-forest sm:pt-32 md:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-semibold text-forest/70">
            <Link
              href="/#inicio"
              className="text-forest underline-offset-4 transition hover:text-coral hover:underline"
            >
              ← Volver al inicio
            </Link>
          </p>

          <header className="mt-8 rounded-[22px] border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">{eyebrow}</p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight text-forest sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-forest/80 md:text-lg">{intro}</p>
          </header>

          <section className="mx-auto mt-10 w-full max-w-5xl py-2 md:py-4">{sectionNodes}</section>
        </div>
      </main>
      <MarketingFooter />
    </>
  )
}
