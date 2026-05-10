import Link from 'next/link'
import type { ReactNode } from 'react'
import BrandLockup from '@/components/site/BrandLockup'
import { MarketingFooter } from '@/components/landing/MarketingFooter'
import SiteFooter from '@/components/site/SiteFooter'

type LegalSection = {
  title: string
  content: ReactNode
}

type LegalPageProps = {
  eyebrow: string
  title: string
  intro: string
  sections: LegalSection[]
  /** Alineado con la landing comercial (canvas, forest, pie marketing). */
  variant?: 'default' | 'marketing'
}

export default function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  variant = 'default',
}: LegalPageProps) {
  const sectionNodes = (
    <div className="space-y-5">
      {sections.map(section => (
        <article
          key={section.title}
          className={
            variant === 'marketing'
              ? 'rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:p-8'
              : 'app-panel rounded-[1.8rem] p-6 md:p-8'
          }
        >
          <h2
            className={
              variant === 'marketing'
                ? 'text-xl font-bold text-forest'
                : 'text-xl font-bold text-[var(--app-foreground)]'
            }
          >
            {section.title}
          </h2>
          <div
            className={
              variant === 'marketing'
                ? 'mt-4 space-y-3 text-sm leading-relaxed text-forest/80 md:text-base'
                : 'mt-4 space-y-3 text-sm leading-relaxed text-[var(--app-muted-foreground)] md:text-base'
            }
          >
            {section.content}
          </div>
        </article>
      ))}
    </div>
  )

  if (variant === 'marketing') {
    return (
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

        <MarketingFooter />
      </main>
    )
  }

  return (
    <main className="theme-page-shell min-h-screen text-[var(--app-foreground)]">
      <section className="border-b border-[var(--app-border)]">
        <div className="mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <BrandLockup href="/" iconSize={44} wordmarkWidth={160} subtitle={eyebrow} />

            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="ui-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold text-[var(--app-foreground)]"
              >
                Inicio
              </Link>
            </div>
          </div>

          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-black leading-tight text-[var(--app-foreground)] md:text-5xl">{title}</h1>
            <p className="text-base leading-relaxed text-[var(--app-muted-foreground)] md:text-lg">{intro}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10 md:py-16">
        {sectionNodes}
      </section>

      <SiteFooter />
    </main>
  )
}
