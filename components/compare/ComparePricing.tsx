import type { CompareCompetitorPricing, ComparePricingTier } from '@/lib/compare/types'

function PricingCell({
  tier,
  side,
}: {
  tier: ComparePricingTier
  side: 'luma' | 'competitor'
}) {
  const priceClass =
    side === 'luma'
      ? 'text-[#35AA63]'
      : tier.unavailable
        ? 'text-forest/45'
        : 'text-forest'

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-bold text-forest">{tier.name}</span>
        <span className={`text-lg font-black ${priceClass}`}>{tier.price}</span>
      </div>
      {tier.note ? <p className="mt-2 flex-1 text-sm leading-relaxed text-forest/70">{tier.note}</p> : null}
    </div>
  )
}

type ComparePricingProps = {
  competitorName: string
  competitorPricing: CompareCompetitorPricing
}

export function ComparePricing({ competitorName, competitorPricing }: ComparePricingProps) {
  return (
    <section aria-labelledby="compare-pricing-heading" className="scroll-mt-28">
      <h2 id="compare-pricing-heading" className="text-2xl font-black text-forest md:text-3xl">
        Precios lado a lado
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-forest/75">
        Cada fila compara un plan de Luma Grid con el equivalente más cercano del competidor. Luma incluye Plan
        Terapeuta para centros; {competitorName} va por licencia de usuario final.
      </p>
      <p className="mt-2 text-sm text-forest/65">{competitorPricing.summary}</p>

      <div className="mt-6 hidden grid-cols-2 gap-4 lg:grid">
        <p className="text-sm font-bold uppercase tracking-wide text-forest/55">Luma Grid</p>
        <p className="text-sm font-bold uppercase tracking-wide text-forest/55">{competitorName}</p>
      </div>

      <div className="mt-3 space-y-4">
        {competitorPricing.pairs.map(pair => (
          <div
            key={pair.competitor ? `${pair.luma.name}-${pair.competitor.name}` : pair.luma.name}
            className="grid gap-4 lg:grid-cols-2 lg:items-stretch"
          >
            <PricingCell tier={pair.luma} side="luma" />
            {pair.competitor ? (
              <PricingCell tier={pair.competitor} side="competitor" />
            ) : (
              <div
                aria-hidden
                className="hidden min-h-[5.5rem] rounded-[18px] border border-dashed border-black/[0.08] bg-neutral-50/50 lg:block"
              />
            )}
          </div>
        ))}
      </div>

      {competitorPricing.footnote ? (
        <p className="mt-4 text-sm leading-relaxed text-forest/60">{competitorPricing.footnote}</p>
      ) : null}
    </section>
  )
}
