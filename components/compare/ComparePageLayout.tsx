import { MarketingFooter } from '@/components/landing/MarketingFooter'
import { CompareBreadcrumb, CompareHero } from '@/components/compare/CompareHero'
import { CompareCta } from '@/components/compare/CompareCta'
import { CompareFeatureTable } from '@/components/compare/CompareFeatureTable'
import { ComparePricing } from '@/components/compare/ComparePricing'
import { CompareUseCases } from '@/components/compare/CompareUseCases'
import { CompareWhenCompetitor } from '@/components/compare/CompareWhenCompetitor'
import type { ComparePageData } from '@/lib/compare/types'

type ComparePageLayoutProps = {
  data: ComparePageData
}

export function ComparePageLayout({ data }: ComparePageLayoutProps) {
  return (
    <>
      <main className="bg-canvas px-4 pb-16 pt-36 text-forest sm:pt-32 md:px-6">
        <article className="mx-auto w-full max-w-6xl">
          <CompareBreadcrumb competitorName={data.competitorName} />

          <div className="mt-8 space-y-14 md:space-y-16">
            <CompareHero data={data} />
            <CompareFeatureTable competitorName={data.competitorName} rows={data.featureRows} />
            <CompareUseCases useCases={data.useCases} competitorName={data.competitorName} />
            <CompareWhenCompetitor
              title={data.whenCompetitor.title}
              intro={data.whenCompetitor.intro}
              bullets={data.whenCompetitor.bullets}
            />
            <ComparePricing competitorName={data.competitorName} competitorPricing={data.competitorPricing} />
            <CompareCta currentSlug={data.slug} />
          </div>
        </article>
      </main>
      <MarketingFooter />
    </>
  )
}
