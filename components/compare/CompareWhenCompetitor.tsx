import { Check } from 'lucide-react'

type CompareWhenCompetitorProps = {
  title: string
  intro: string
  bullets: string[]
}

export function CompareWhenCompetitor({ title, intro, bullets }: CompareWhenCompetitorProps) {
  return (
    <section aria-labelledby="compare-when-competitor-heading" className="scroll-mt-28">
      <article className="rounded-[22px] border-2 border-accent-blue/25 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:p-10">
        <h2 id="compare-when-competitor-heading" className="text-2xl font-black text-forest md:text-3xl">
          {title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-forest/80">{intro}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map(bullet => (
            <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-forest/85 md:text-base">
              <Check className="mt-0.5 size-5 shrink-0 text-accent-blue" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}
