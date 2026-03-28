import Link from 'next/link'
import type { ReactNode } from 'react'
import BrandLockup from '@/components/site/BrandLockup'
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
}

export default function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <main className="theme-page-shell min-h-screen text-[var(--app-foreground)]">
      <section className="border-b border-[var(--app-border)]">
        <div className="mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <BrandLockup
              href="/"
              iconSize={44}
              wordmarkWidth={160}
              subtitle={eyebrow}
            />

            <div className="flex flex-wrap gap-2">
              <Link href="/" className="ui-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold text-[var(--app-foreground)]">
                Inicio
              </Link>
              <Link href="/branding" className="ui-primary-button rounded-2xl px-4 py-2 text-sm font-semibold">
                Branding
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
        <div className="space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="app-panel rounded-[1.8rem] p-6 md:p-8">
              <h2 className="text-xl font-bold text-[var(--app-foreground)]">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--app-muted-foreground)] md:text-base">
                {section.content}
              </div>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
