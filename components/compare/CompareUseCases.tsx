import type { CompareUseCase } from '@/lib/compare/types'

type CompareUseCasesProps = {
  useCases: CompareUseCase[]
  competitorName: string
}

const pickLabels: Record<CompareUseCase['pick'], { label: string; className: string }> = {
  luma: { label: 'Recomendado: Luma Grid', className: 'bg-[#35AA63]/10 text-[#2d8f52]' },
  competitor: { label: 'Recomendado: competidor', className: 'bg-accent-blue/10 text-accent-blue' },
  depends: { label: 'Depende del contexto', className: 'bg-amber-50 text-amber-800' },
}

export function CompareUseCases({ useCases, competitorName }: CompareUseCasesProps) {
  return (
    <section aria-labelledby="compare-usecases-heading" className="scroll-mt-28">
      <h2 id="compare-usecases-heading" className="text-2xl font-black text-forest md:text-3xl">
        Comparación por casos de uso
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-forest/75">
        Tres escenarios habituales en CAA. La recomendación prioriza comprensión auditiva (voces naturales, verbos
        conjugados) y viabilidad en centros educativos españoles.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {useCases.map(useCase => {
          const pick = pickLabels[useCase.pick]
          return (
            <article
              key={useCase.title}
              className="flex flex-col rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            >
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${pick.className}`}>
                {pick.label}
              </span>
              <h3 className="mt-4 text-lg font-bold text-forest">{useCase.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-forest/75">{useCase.scenario}</p>
              <p className="mt-4 border-t border-black/[0.06] pt-4 text-sm font-medium leading-relaxed text-forest">
                {useCase.recommendation}
              </p>
            </article>
          )
        })}
      </div>
      <p className="mt-4 text-sm text-forest/60">
        Estas recomendaciones son orientativas. Evalúa siempre las necesidades individuales del usuario AAC frente a{' '}
        {competitorName}.
      </p>
    </section>
  )
}
