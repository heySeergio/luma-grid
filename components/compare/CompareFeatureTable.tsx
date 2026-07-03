import { Check, Minus } from 'lucide-react'

import type { CompareFeatureRow, CompareWinner } from '@/lib/compare/types'

type CompareFeatureTableProps = {
  competitorName: string
  rows: CompareFeatureRow[]
}

function winnerClass(winner: CompareWinner | undefined, side: 'luma' | 'competitor'): string {
  if (winner === 'both') return 'bg-neutral-50'
  if (winner === side) return side === 'luma' ? 'bg-[#35AA63]/8' : 'bg-accent-blue/5'
  return ''
}

function WinnerIcon({ winner, side }: { winner?: CompareWinner; side: 'luma' | 'competitor' }) {
  if (winner === 'both') return <Minus className="size-4 shrink-0 text-forest/40" aria-hidden />
  if (winner === side) return <Check className="size-4 shrink-0 text-[#35AA63]" aria-hidden />
  return null
}

export function CompareFeatureTable({ competitorName, rows }: CompareFeatureTableProps) {
  return (
    <section aria-labelledby="compare-features-heading" className="scroll-mt-28">
      <h2 id="compare-features-heading" className="text-2xl font-black text-forest md:text-3xl">
        Tabla comparativa de funciones
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-forest/75">
        Destacamos las funciones que más impactan en la comprensión auditiva:{' '}
        <strong className="font-bold text-forest">voces naturales con IA</strong>,{' '}
        <strong className="font-bold text-forest">conjugación automática de verbos</strong> y{' '}
        <strong className="font-bold text-forest">predicción de frases</strong>.
      </p>

      <div className="mt-6 overflow-x-auto rounded-[22px] border border-black/[0.06] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] bg-neutral-50/80">
              <th scope="col" className="sticky left-0 z-10 min-w-[160px] bg-neutral-50/95 px-4 py-4 font-bold text-forest">
                Función
              </th>
              <th scope="col" className="min-w-[220px] px-4 py-4 font-bold text-forest">
                Luma Grid
              </th>
              <th scope="col" className="min-w-[220px] px-4 py-4 font-bold text-forest">
                {competitorName}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.feature} className="border-b border-black/[0.04] last:border-b-0">
                <th
                  scope="row"
                  className={`sticky left-0 z-10 bg-white px-4 py-4 align-top font-semibold text-forest ${
                    row.highlight ? 'border-l-4 border-l-[#35AA63]' : ''
                  }`}
                >
                  {row.feature}
                  {row.highlight ? (
                    <span className="mt-1 block text-xs font-medium text-[#35AA63]">Diferencial clave</span>
                  ) : null}
                </th>
                <td className={`px-4 py-4 align-top leading-relaxed text-forest/80 ${winnerClass(row.winner, 'luma')}`}>
                  <div className="flex gap-2">
                    <WinnerIcon winner={row.winner} side="luma" />
                    <span>{row.luma}</span>
                  </div>
                </td>
                <td
                  className={`px-4 py-4 align-top leading-relaxed text-forest/80 ${winnerClass(row.winner, 'competitor')}`}
                >
                  <div className="flex gap-2">
                    <WinnerIcon winner={row.winner} side="competitor" />
                    <span>{row.competitor}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
